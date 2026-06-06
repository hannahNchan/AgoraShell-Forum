alter table public.profiles
add column suspended_until timestamptz,
add column suspension_reason text,
add column banned_reason text,
add column moderation_previous_role_id integer references public.roles(id),
add column moderation_updated_by uuid references public.profiles(id) on delete set null,
add column moderation_updated_at timestamptz;

alter table public.profiles
add constraint profiles_suspension_reason_length check (char_length(coalesce(suspension_reason, '')) <= 1000),
add constraint profiles_banned_reason_length check (char_length(coalesce(banned_reason, '')) <= 1000);

create or replace function public.prevent_invalid_profile_moderation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role_id integer;
begin
  select role_id into actor_role_id
  from public.profiles
  where id = auth.uid();

  if actor_role_id is distinct from 1 then
    if new.role_id is distinct from old.role_id
      or new.role is distinct from old.role
      or new.suspended_until is distinct from old.suspended_until
      or new.suspension_reason is distinct from old.suspension_reason
      or new.banned_reason is distinct from old.banned_reason
      or new.moderation_previous_role_id is distinct from old.moderation_previous_role_id
      or new.moderation_updated_by is distinct from old.moderation_updated_by
      or new.moderation_updated_at is distinct from old.moderation_updated_at then
      raise exception 'Only admins can moderate users';
    end if;
  end if;

  if old.role_id = 1 and (
    new.role_id = 4
    or new.suspended_until is not null
    or new.suspension_reason is not null
    or new.banned_reason is not null
  ) then
    raise exception 'Admins cannot ban or suspend other admins';
  end if;

  if new.role_id = 4 and nullif(trim(coalesce(new.banned_reason, '')), '') is null then
    raise exception 'Ban reason is required';
  end if;

  if new.suspended_until is not null and nullif(trim(coalesce(new.suspension_reason, '')), '') is null then
    raise exception 'Suspension reason is required';
  end if;

  if new.suspended_until is not null and new.suspended_until <= now() then
    raise exception 'Suspension must end in the future';
  end if;

  if new.role_id = 4 and new.moderation_previous_role_id is null then
    new.moderation_previous_role_id := old.role_id;
  end if;

  if new.role_id is distinct from old.role_id
    or new.suspended_until is distinct from old.suspended_until
    or new.suspension_reason is distinct from old.suspension_reason
    or new.banned_reason is distinct from old.banned_reason then
    new.moderation_updated_at := now();
    new.moderation_updated_by := auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_invalid_profile_moderation_trigger on public.profiles;
create trigger prevent_invalid_profile_moderation_trigger
before update on public.profiles
for each row
execute function public.prevent_invalid_profile_moderation();

create or replace function public.user_can_create_content(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role_id <> 4
      and (suspended_until is null or suspended_until <= now())
  );
$$;

create policy "restrictions_topics_insert"
on public.topics
as restrictive
for insert
to authenticated
with check (public.user_can_create_content(auth.uid()));

create policy "restrictions_replies_insert"
on public.replies
as restrictive
for insert
to authenticated
with check (public.user_can_create_content(auth.uid()));

create policy "restrictions_channels_insert"
on public.channels
as restrictive
for insert
to authenticated
with check (public.user_can_create_content(auth.uid()));

create policy "restrictions_tags_insert"
on public.tags
as restrictive
for insert
to authenticated
with check (public.user_can_create_content(auth.uid()));
