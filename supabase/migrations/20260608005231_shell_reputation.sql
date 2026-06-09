create table if not exists public.user_reputation_events (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  points integer not null,
  source_type text not null,
  source_id uuid not null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint user_reputation_events_action_check check (
    action in (
      'topic_created',
      'topic_deleted',
      'reply_created',
      'reply_deleted',
      'topic_star_received',
      'topic_star_removed',
      'reply_reaction_received',
      'reply_reaction_removed'
    )
  )
);

create unique index if not exists user_reputation_events_source_action_key
on public.user_reputation_events (source_type, source_id, action, target_user_id);

create index if not exists user_reputation_events_target_created_idx
on public.user_reputation_events (target_user_id, created_at desc);

alter table public.user_reputation_events enable row level security;

drop policy if exists "Reputation events are public read" on public.user_reputation_events;
create policy "Reputation events are public read"
on public.user_reputation_events
for select
using (true);

create or replace view public.user_reputation_scores as
select
  p.id as user_id,
  coalesce(sum(e.points), 0)::integer as shell_score,
  count(*) filter (where e.action = 'topic_star_received')::integer as stars_received,
  count(*) filter (where e.action = 'reply_reaction_received')::integer as reply_reactions_received,
  count(*) filter (where e.action = 'topic_created')::integer as topics_created,
  count(*) filter (where e.action = 'reply_created')::integer as replies_created,
  case
    when coalesce(sum(e.points), 0) >= 1000 then 'Arquitecto'
    when coalesce(sum(e.points), 0) >= 500 then 'Referente'
    when coalesce(sum(e.points), 0) >= 250 then 'Conector'
    when coalesce(sum(e.points), 0) >= 50 then 'Aportador'
    else 'Visitante'
  end as level_name,
  case
    when coalesce(sum(e.points), 0) >= 1000 then '1000+'
    when coalesce(sum(e.points), 0) >= 500 then '500 - 999'
    when coalesce(sum(e.points), 0) >= 250 then '250 - 499'
    when coalesce(sum(e.points), 0) >= 50 then '50 - 249'
    else '0 - 49'
  end as level_range
from public.profiles p
left join public.user_reputation_events e on e.target_user_id = p.id
group by p.id;

create or replace view public.user_reputation_badges as
select
  s.user_id,
  array_remove(array[
    case when s.topics_created + s.replies_created >= 1 then 'Primer aporte' end,
    case when s.stars_received >= 10 then 'Chispa inicial' end,
    case when s.reply_reactions_received >= 25 then 'Voz útil' end,
    case when s.topics_created >= 25 then 'Constructor' end,
    case when s.replies_created >= 100 then 'Conversador' end,
    case when s.stars_received >= 50 then 'Referencia' end,
    case when s.shell_score >= 250 then 'Conector' end,
    case when s.shell_score >= 1000 then 'Arquitecto' end
  ], null) as badges
from public.user_reputation_scores s;

create or replace function public.record_reputation_event(
  p_target_user_id uuid,
  p_actor_id uuid,
  p_action text,
  p_points integer,
  p_source_type text,
  p_source_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_target_user_id is null or p_points = 0 then
    return;
  end if;

  insert into public.user_reputation_events (
    target_user_id,
    actor_id,
    action,
    points,
    source_type,
    source_id,
    metadata
  )
  values (
    p_target_user_id,
    p_actor_id,
    p_action,
    p_points,
    p_source_type,
    p_source_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (source_type, source_id, action, target_user_id) do nothing;
end;
$$;

create or replace function public.reputation_topic_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.record_reputation_event(new.author_id, new.author_id, 'topic_created', 2, 'topic', new.id);
  return new;
end;
$$;

create or replace function public.reputation_topic_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.record_reputation_event(old.author_id, auth.uid(), 'topic_deleted', -2, 'topic', old.id);
  return old;
end;
$$;

create or replace function public.reputation_reply_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.record_reputation_event(new.author_id, new.author_id, 'reply_created', 1, 'reply', new.id, jsonb_build_object('topic_id', new.topic_id));
  return new;
end;
$$;

create or replace function public.reputation_reply_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.record_reputation_event(old.author_id, auth.uid(), 'reply_deleted', -1, 'reply', old.id, jsonb_build_object('topic_id', old.topic_id));
  return old;
end;
$$;

create or replace function public.reputation_topic_star_inserted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  topic_author uuid;
begin
  select author_id into topic_author from public.topics where id = new.topic_id;
  if topic_author is not null and topic_author is distinct from new.user_id then
    perform public.record_reputation_event(topic_author, new.user_id, 'topic_star_received', 5, 'topic_star', new.id, jsonb_build_object('topic_id', new.topic_id));
  end if;
  return new;
end;
$$;

create or replace function public.reputation_topic_star_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  topic_author uuid;
begin
  select author_id into topic_author from public.topics where id = old.topic_id;
  if topic_author is not null and topic_author is distinct from old.user_id then
    perform public.record_reputation_event(topic_author, old.user_id, 'topic_star_removed', -5, 'topic_star', old.id, jsonb_build_object('topic_id', old.topic_id));
  end if;
  return old;
end;
$$;

create or replace function public.reputation_reply_reaction_inserted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reply_author uuid;
  reply_topic uuid;
begin
  select author_id, topic_id into reply_author, reply_topic from public.replies where id = new.reply_id;
  if reply_author is not null and reply_author is distinct from new.user_id then
    perform public.record_reputation_event(reply_author, new.user_id, 'reply_reaction_received', 2, 'reply_reaction', new.id, jsonb_build_object('reply_id', new.reply_id, 'topic_id', reply_topic, 'emoji', new.emoji));
  end if;
  return new;
end;
$$;

create or replace function public.reputation_reply_reaction_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reply_author uuid;
  reply_topic uuid;
begin
  select author_id, topic_id into reply_author, reply_topic from public.replies where id = old.reply_id;
  if reply_author is not null and reply_author is distinct from old.user_id then
    perform public.record_reputation_event(reply_author, old.user_id, 'reply_reaction_removed', -2, 'reply_reaction', old.id, jsonb_build_object('reply_id', old.reply_id, 'topic_id', reply_topic, 'emoji', old.emoji));
  end if;
  return old;
end;
$$;

drop trigger if exists reputation_topic_created_trigger on public.topics;
create trigger reputation_topic_created_trigger
after insert on public.topics
for each row execute function public.reputation_topic_created();

drop trigger if exists reputation_topic_deleted_trigger on public.topics;
create trigger reputation_topic_deleted_trigger
before delete on public.topics
for each row execute function public.reputation_topic_deleted();

drop trigger if exists reputation_reply_created_trigger on public.replies;
create trigger reputation_reply_created_trigger
after insert on public.replies
for each row execute function public.reputation_reply_created();

drop trigger if exists reputation_reply_deleted_trigger on public.replies;
create trigger reputation_reply_deleted_trigger
before delete on public.replies
for each row execute function public.reputation_reply_deleted();

drop trigger if exists reputation_topic_star_inserted_trigger on public.topic_stars;
create trigger reputation_topic_star_inserted_trigger
after insert on public.topic_stars
for each row execute function public.reputation_topic_star_inserted();

drop trigger if exists reputation_topic_star_deleted_trigger on public.topic_stars;
create trigger reputation_topic_star_deleted_trigger
before delete on public.topic_stars
for each row execute function public.reputation_topic_star_deleted();

drop trigger if exists reputation_reply_reaction_inserted_trigger on public.reply_reactions;
create trigger reputation_reply_reaction_inserted_trigger
after insert on public.reply_reactions
for each row execute function public.reputation_reply_reaction_inserted();

drop trigger if exists reputation_reply_reaction_deleted_trigger on public.reply_reactions;
create trigger reputation_reply_reaction_deleted_trigger
before delete on public.reply_reactions
for each row execute function public.reputation_reply_reaction_deleted();

insert into public.user_reputation_events (target_user_id, actor_id, action, points, source_type, source_id, created_at)
select author_id, author_id, 'topic_created', 2, 'topic', id, created_at
from public.topics
on conflict (source_type, source_id, action, target_user_id) do nothing;

insert into public.user_reputation_events (target_user_id, actor_id, action, points, source_type, source_id, created_at, metadata)
select author_id, author_id, 'reply_created', 1, 'reply', id, created_at, jsonb_build_object('topic_id', topic_id)
from public.replies
on conflict (source_type, source_id, action, target_user_id) do nothing;

insert into public.user_reputation_events (target_user_id, actor_id, action, points, source_type, source_id, created_at, metadata)
select t.author_id, s.user_id, 'topic_star_received', 5, 'topic_star', s.id, s.created_at, jsonb_build_object('topic_id', s.topic_id)
from public.topic_stars s
join public.topics t on t.id = s.topic_id
where t.author_id is distinct from s.user_id
on conflict (source_type, source_id, action, target_user_id) do nothing;

insert into public.user_reputation_events (target_user_id, actor_id, action, points, source_type, source_id, created_at, metadata)
select r.author_id, rr.user_id, 'reply_reaction_received', 2, 'reply_reaction', rr.id, rr.created_at, jsonb_build_object('reply_id', rr.reply_id, 'topic_id', r.topic_id, 'emoji', rr.emoji)
from public.reply_reactions rr
join public.replies r on r.id = rr.reply_id
where r.author_id is distinct from rr.user_id
on conflict (source_type, source_id, action, target_user_id) do nothing;
