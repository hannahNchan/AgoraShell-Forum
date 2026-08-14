create table if not exists public.topic_map_places (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_by_email text not null,
  name text not null,
  activities text not null,
  description text not null,
  is_lgbt_friendly boolean not null default false,
  is_trans_inclusive boolean not null default false,
  observations text,
  longitude numeric(9, 6) not null,
  latitude numeric(8, 6) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint topic_map_places_name_length check (char_length(trim(name)) between 1 and 120),
  constraint topic_map_places_activities_length check (char_length(trim(activities)) between 1 and 500),
  constraint topic_map_places_description_length check (char_length(trim(description)) between 1 and 1200),
  constraint topic_map_places_observations_length check (char_length(coalesce(observations, '')) <= 1200),
  constraint topic_map_places_longitude_range check (longitude between -180 and 180),
  constraint topic_map_places_latitude_range check (latitude between -90 and 90)
);

create index if not exists topic_map_places_topic_created_idx
on public.topic_map_places (topic_id, created_at desc);

create index if not exists topic_map_places_created_by_idx
on public.topic_map_places (created_by);

create or replace function public.set_topic_map_place_actor()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.created_by := auth.uid();
  new.created_by_email := coalesce(auth.jwt() ->> 'email', '');
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_topic_map_place_actor_trigger on public.topic_map_places;

create trigger set_topic_map_place_actor_trigger
before insert on public.topic_map_places
for each row
execute function public.set_topic_map_place_actor();

create or replace function public.touch_topic_map_place_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_topic_map_place_updated_at_trigger on public.topic_map_places;

create trigger touch_topic_map_place_updated_at_trigger
before update on public.topic_map_places
for each row
execute function public.touch_topic_map_place_updated_at();

alter table public.topic_map_places enable row level security;

drop policy if exists "topic_map_places_select_public" on public.topic_map_places;

create policy "topic_map_places_select_public"
on public.topic_map_places
for select
using (true);

drop policy if exists "topic_map_places_insert_authenticated" on public.topic_map_places;

create policy "topic_map_places_insert_authenticated"
on public.topic_map_places
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id in (1, 2, 3)
      and (profiles.suspended_until is null or profiles.suspended_until <= now())
  )
);

drop policy if exists "topic_map_places_update_owner_or_moderator" on public.topic_map_places;

create policy "topic_map_places_update_owner_or_moderator"
on public.topic_map_places
for update
to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id in (1, 2)
      and (profiles.suspended_until is null or profiles.suspended_until <= now())
  )
)
with check (
  created_by = auth.uid()
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id in (1, 2)
      and (profiles.suspended_until is null or profiles.suspended_until <= now())
  )
);

drop policy if exists "topic_map_places_delete_owner_or_moderator" on public.topic_map_places;

create policy "topic_map_places_delete_owner_or_moderator"
on public.topic_map_places
for delete
to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id in (1, 2)
      and (profiles.suspended_until is null or profiles.suspended_until <= now())
  )
);

grant select on public.topic_map_places to anon;
grant select, insert, update, delete on public.topic_map_places to authenticated;
