create table public.topic_rules (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  body text not null,
  position integer not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint topic_rules_body_length check (
    char_length(trim(body)) between 1 and 240
  ),
  constraint topic_rules_position_range check (
    position between 1 and 10
  )
);

create unique index topic_rules_topic_position_key
on public.topic_rules (topic_id, position);

create index topic_rules_topic_id_idx
on public.topic_rules (topic_id, position);

alter table public.topic_rules enable row level security;

create policy "topic_rules_select_public"
on public.topic_rules
for select
using (true);

create policy "topic_rules_insert_moderator"
on public.topic_rules
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id in (1, 2)
      and (profiles.suspended_until is null or profiles.suspended_until <= now())
  )
);

create policy "topic_rules_update_moderator"
on public.topic_rules
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id in (1, 2)
      and (profiles.suspended_until is null or profiles.suspended_until <= now())
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id in (1, 2)
      and (profiles.suspended_until is null or profiles.suspended_until <= now())
  )
);

create policy "topic_rules_delete_moderator"
on public.topic_rules
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id in (1, 2)
      and (profiles.suspended_until is null or profiles.suspended_until <= now())
  )
);
