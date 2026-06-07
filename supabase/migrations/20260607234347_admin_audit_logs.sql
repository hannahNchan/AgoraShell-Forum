create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text,
  action text not null,
  target_type text not null,
  target_id uuid,
  target_label text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

create index if not exists admin_audit_logs_actor_id_idx
  on public.admin_audit_logs (actor_id);

create index if not exists admin_audit_logs_action_idx
  on public.admin_audit_logs (action);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "Admins and moderators can read audit logs" on public.admin_audit_logs;
create policy "Admins and moderators can read audit logs"
on public.admin_audit_logs
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.role_id in (1, 2) or p.role in ('admin', 'moderator'))
  )
);

drop policy if exists "Admins and moderators can insert audit logs" on public.admin_audit_logs;
create policy "Admins and moderators can insert audit logs"
on public.admin_audit_logs
for insert
with check (
  actor_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.role_id in (1, 2) or p.role in ('admin', 'moderator'))
  )
);
