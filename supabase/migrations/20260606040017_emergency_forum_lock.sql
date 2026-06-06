do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'app_settings'
  ) then
    alter publication supabase_realtime add table public.app_settings;
  end if;
end $$;

create policy "emergency_lock_channels_insert"
on public.channels
as restrictive
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id = 1
  )
  or not coalesce((select foro_bloqueado from public.app_settings where id = 1), false)
);

create policy "emergency_lock_topics_insert"
on public.topics
as restrictive
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id = 1
  )
  or not coalesce((select foro_bloqueado from public.app_settings where id = 1), false)
);

create policy "emergency_lock_replies_insert"
on public.replies
as restrictive
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id = 1
  )
  or not coalesce((select foro_bloqueado from public.app_settings where id = 1), false)
);
