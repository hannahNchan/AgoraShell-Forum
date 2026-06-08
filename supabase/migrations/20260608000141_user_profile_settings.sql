alter table public.profiles
add constraint profiles_username_format
check (username ~ '^[A-Za-z0-9_]{3,30}$'),
add constraint profiles_bio_length
check (char_length(coalesce(bio, '')) <= 280);

create unique index if not exists profiles_username_lower_key
on public.profiles (lower(username));
