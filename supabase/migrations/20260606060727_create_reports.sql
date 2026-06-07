create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  target_type text not null check (target_type in ('topic', 'reply', 'user')),
  target_topic_id uuid references public.topics(id) on delete cascade,
  target_reply_id uuid references public.replies(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('spam', 'abuse', 'offensive', 'personal_info', 'off_topic', 'other')),
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(coalesce(details, '')) <= 1000),
  check (
    (target_type = 'topic' and target_topic_id is not null and target_reply_id is null and target_user_id is null)
    or (target_type = 'reply' and target_reply_id is not null and target_user_id is null)
    or (target_type = 'user' and target_user_id is not null and target_topic_id is null and target_reply_id is null)
  ),
  check (target_type <> 'user' or reporter_id <> target_user_id)
);

create unique index reports_unique_topic_per_user
on public.reports (reporter_id, target_topic_id)
where target_type = 'topic';

create unique index reports_unique_reply_per_user
on public.reports (reporter_id, target_reply_id)
where target_type = 'reply';

create unique index reports_unique_user_per_user
on public.reports (reporter_id, target_user_id)
where target_type = 'user';

create index reports_status_created_at_idx
on public.reports (status, created_at desc);

alter table public.reports enable row level security;

create policy "reports_insert_authenticated"
on public.reports
for insert
to authenticated
with check (reporter_id = auth.uid());

create policy "reports_select_owner_or_moderator"
on public.reports
for select
to authenticated
using (
  reporter_id = auth.uid()
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id in (1, 2)
  )
);

create policy "reports_update_moderator"
on public.reports
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id in (1, 2)
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id in (1, 2)
  )
);
