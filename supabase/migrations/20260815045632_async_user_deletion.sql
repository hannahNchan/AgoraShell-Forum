create extension if not exists pgmq;

do $$
begin
  perform pgmq.create('delete_user_jobs');
exception
  when duplicate_table then null;
  when undefined_function then null;
  when undefined_schema then null;
end $$;

alter table public.profiles
add column if not exists deletion_status text not null default 'active',
add column if not exists deletion_requested_at timestamptz,
add column if not exists deletion_requested_by uuid references public.profiles(id) on delete set null;

alter table public.profiles
drop constraint if exists profiles_deletion_status_check;

alter table public.profiles
add constraint profiles_deletion_status_check
check (deletion_status in ('active', 'deletion_requested', 'deleting', 'failed'));

create index if not exists profiles_deletion_status_idx
on public.profiles (deletion_status, deletion_requested_at desc);

create table if not exists public.user_deletion_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  requested_by uuid references public.profiles(id) on delete set null,
  target_username text,
  target_email text,
  target_role_id integer,
  status text not null default 'queued',
  attempts integer not null default 0,
  last_error text,
  queue_msg_id bigint,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint user_deletion_jobs_status_check
    check (status in ('queued', 'processing', 'deleted', 'failed'))
);

create unique index if not exists user_deletion_jobs_open_user_idx
on public.user_deletion_jobs (user_id)
where status in ('queued', 'processing');

create index if not exists user_deletion_jobs_status_requested_idx
on public.user_deletion_jobs (status, requested_at);

alter table public.user_deletion_jobs enable row level security;

drop policy if exists "Admins and moderators can read user deletion jobs" on public.user_deletion_jobs;
create policy "Admins and moderators can read user deletion jobs"
on public.user_deletion_jobs
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role_id in (1, 2)
      and p.deletion_status = 'active'
  )
);

drop policy if exists "Admins and moderators can insert user deletion jobs" on public.user_deletion_jobs;
create policy "Admins and moderators can insert user deletion jobs"
on public.user_deletion_jobs
for insert
with check (
  requested_by = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role_id in (1, 2)
      and p.deletion_status = 'active'
  )
);

drop policy if exists "Admins and moderators can update user deletion jobs" on public.user_deletion_jobs;
create policy "Admins and moderators can update user deletion jobs"
on public.user_deletion_jobs
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role_id in (1, 2)
      and p.deletion_status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role_id in (1, 2)
      and p.deletion_status = 'active'
  )
);

create or replace function public.touch_user_deletion_jobs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_deletion_jobs_touch_updated_at on public.user_deletion_jobs;
create trigger user_deletion_jobs_touch_updated_at
before update on public.user_deletion_jobs
for each row execute function public.touch_user_deletion_jobs_updated_at();

create or replace function public.can_request_user_deletion(actor_id uuid, target_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  with actor as (
    select id, role_id, deletion_status
    from public.profiles
    where id = actor_id
  ),
  target as (
    select id, role_id, deletion_status
    from public.profiles
    where id = target_id
  ),
  admin_count as (
    select count(*)::int as total
    from public.profiles
    where role_id = 1
      and deletion_status = 'active'
  )
  select coalesce((
    select
      actor.id is not null
      and target.id is not null
      and actor.id <> target.id
      and actor.deletion_status = 'active'
      and target.deletion_status in ('active', 'failed')
      and target.role_id <> 1
      and (
        actor.role_id = 1
        or (actor.role_id = 2 and target.role_id = 3)
      )
      and not (target.role_id = 1 and (select total from admin_count) <= 1)
    from actor, target
  ), false);
$$;

grant execute on function public.can_request_user_deletion(uuid, uuid) to authenticated;

create or replace function public.enqueue_user_deletion_job(job_id uuid, target_user_id uuid)
returns bigint
language sql
security definer
set search_path = public, pgmq
as $$
  with queued as (
    select pgmq.send(
      'delete_user_jobs',
      jsonb_build_object(
        'jobId', job_id,
        'userId', target_user_id
      ),
      0
    ) as message_id
  ),
  updated as (
    update public.user_deletion_jobs
    set queue_msg_id = queued.message_id
    from queued
    where id = job_id
    returning queued.message_id
  )
  select message_id from updated;
$$;

revoke all on function public.enqueue_user_deletion_job(uuid, uuid) from public;
grant execute on function public.enqueue_user_deletion_job(uuid, uuid) to service_role;

alter table public.topics
alter column author_id drop not null;

alter table public.replies
alter column author_id drop not null;

alter table public.topic_map_places
alter column created_by drop not null;

alter table public.channels
drop constraint if exists channels_created_by_fkey;
alter table public.channels
add constraint channels_created_by_fkey
foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.tags
drop constraint if exists tags_created_by_fkey;
alter table public.tags
add constraint tags_created_by_fkey
foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.topics
drop constraint if exists topics_author_id_fkey;
alter table public.topics
add constraint topics_author_id_fkey
foreign key (author_id) references public.profiles(id) on delete set null;

alter table public.replies
drop constraint if exists replies_author_id_fkey;
alter table public.replies
add constraint replies_author_id_fkey
foreign key (author_id) references public.profiles(id) on delete set null;

alter table public.topic_map_places
drop constraint if exists topic_map_places_created_by_fkey;
alter table public.topic_map_places
add constraint topic_map_places_created_by_fkey
foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.reports
drop constraint if exists reports_target_user_id_fkey;
alter table public.reports
add constraint reports_target_user_id_fkey
foreign key (target_user_id) references public.profiles(id) on delete set null;

alter table public.reports
drop constraint if exists reports_reporter_id_fkey;
alter table public.reports
add constraint reports_reporter_id_fkey
foreign key (reporter_id) references public.profiles(id) on delete set null;

alter table public.reports
alter column reporter_id drop not null;
