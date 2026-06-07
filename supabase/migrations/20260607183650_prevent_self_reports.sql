create or replace function public.prevent_self_reports()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.reported_user_id is not null and new.reporter_id = new.reported_user_id then
    raise exception 'Users cannot report themselves';
  end if;

  if new.target_user_id is not null and new.reporter_id = new.target_user_id then
    raise exception 'Users cannot report themselves';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_self_reports_trigger on public.reports;
create trigger prevent_self_reports_trigger
before insert or update on public.reports
for each row
execute function public.prevent_self_reports();
