alter table public.reports
add column assigned_moderator_id uuid references public.profiles(id) on delete set null,
add column handled_by_id uuid references public.profiles(id) on delete set null,
add column handled_at timestamptz,
add column moderator_note text;

alter table public.reports
drop constraint reports_status_check;

alter table public.reports
add constraint reports_status_check check (status in ('pending', 'in_review', 'reviewed', 'dismissed'));

alter table public.reports
add constraint reports_moderator_note_length check (char_length(coalesce(moderator_note, '')) <= 1000);

create index reports_assigned_moderator_idx
on public.reports (assigned_moderator_id, status, updated_at desc);
