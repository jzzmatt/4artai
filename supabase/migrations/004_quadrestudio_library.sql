-- Personal library flags. Users may mark their own fusion as saved and rename it.
-- The image path and owner stay fixed.

alter table public.quadres add column if not exists title text;
alter table public.quadres add column if not exists is_saved boolean not null default false;

create or replace function private.protect_quadre_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.original_url is distinct from old.original_url
     or new.fusion_url is distinct from old.fusion_url
     or new.style_url is distinct from old.style_url
     or new.created_at is distinct from old.created_at
  then
    raise exception 'Only the title and saved state can change';
  end if;
  return new;
end;
$$;

revoke all on function private.protect_quadre_update() from public, anon, authenticated;

drop trigger if exists quadres_protect_update on public.quadres;
create trigger quadres_protect_update
  before update on public.quadres
  for each row
  execute function private.protect_quadre_update();

drop policy if exists quadres_update_own on public.quadres;
create policy quadres_update_own
  on public.quadres
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant update on public.quadres to authenticated;
