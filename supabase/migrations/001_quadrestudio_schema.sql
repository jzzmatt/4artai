-- QuadreStudio schema for the self-hosted Supabase instance.
-- Run in the Supabase Studio SQL editor as the database owner.
-- Authorization uses public.profiles.role. Do not use auth.users.raw_user_meta_data.
-- Promote an operator with:
--   update public.profiles set role = 'admin' where email = 'person@example.com';

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role, credits_remaining)
  values (new.id, new.email, 'user', 5)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'user' constraint profiles_role_check check (role in ('user', 'admin')),
  credits_remaining integer not null default 5 constraint profiles_credits_check check (credits_remaining >= 0),
  created_at timestamptz not null default now()
);

create table public.style_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  image_url text not null,
  prompt_instruction text not null,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.quadres (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  original_url text,
  fusion_url text,
  style_url text,
  frame_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index style_templates_created_idx on public.style_templates (created_at desc);
create index quadres_user_created_idx on public.quadres (user_id, created_at desc);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.style_templates enable row level security;
alter table public.quadres enable row level security;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (
    id = (select auth.uid())
    and role = 'user'
    and credits_remaining = 5
  );

create policy profiles_delete_own
  on public.profiles
  for delete
  to authenticated
  using (id = (select auth.uid()));

create policy style_templates_select
  on public.style_templates
  for select
  to anon, authenticated
  using (is_active = true or (select private.is_admin()));

create policy style_templates_insert_admin
  on public.style_templates
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy style_templates_update_admin
  on public.style_templates
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy style_templates_delete_admin
  on public.style_templates
  for delete
  to authenticated
  using ((select private.is_admin()));

create policy quadres_select_own
  on public.quadres
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy quadres_insert_own
  on public.quadres
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy quadres_delete_own
  on public.quadres
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, delete on public.profiles to authenticated;
grant select on public.style_templates to anon, authenticated;
grant insert, update, delete on public.style_templates to authenticated;
grant select, insert, delete on public.quadres to authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();

insert into public.style_templates (title, category, image_url, prompt_instruction, is_active)
values
  (
    'Synthetic Cubism No. 12',
    'cubism',
    '/stitch/style-cubism.jpg',
    'Cubist guitar and still-life archetype. Fracture the subject into overlapping transparent planes, charcoal contour, and muted ochre, slate, and cream.',
    true
  ),
  (
    'African Cubism',
    'cubism',
    '/stitch/african-cubism.jpg',
    'Editorial museum lighting cubist geometric portrait composed of segmented terracotta, deep cerulean blue, and polished bronze facets. Sharp architectural angular edges with raw textured oil paint impasto on linen ground.',
    true
  ),
  (
    'Bauhaus Portrait',
    'bauhaus',
    '/stitch/bauhaus-portrait.jpg',
    'High modernist Bauhaus portrait composed of pure geometric primaries: cadmium red circle, ultramarine square, and chrome yellow diagonal beam intersecting a sculpted off-white profile. Clean lithograph texture on archival newsprint.',
    true
  ),
  (
    'Golden Impasto',
    'impasto',
    '/stitch/golden-impasto.jpg',
    'Extreme close-up macro portrait in heavy golden impasto oil paint. Luscious sculptural palette knife strokes with raw burnt umber shadows, metallic leaf flecks, and deep varnished specular reflections.',
    true
  ),
  (
    'Neo-Expressionism',
    'neo-expressionism',
    '/stitch/neo-expressionism.jpg',
    'Raw Neo-Expressionist portrait painting with feverish charcoal contours, bold crimson slashes, primitive mask motifs, and spontaneous chalk scribbles across a distressed concrete background.',
    true
  ),
  (
    'Stained Glass',
    'abstract',
    '/stitch/stained-glass.jpg',
    'Luminescent cathedral stained glass abstract figure with thick dark leaded cames enclosing jewel-tone emerald, cobalt, and amber glass segments. Soft diffused god-rays scattering spectral refractions.',
    false
  ),
  (
    'Afro-Pop Geometry',
    'afrofuturism',
    '/stitch/afro-pop.jpg',
    'Afrofuturistic portrait radiating high-contrast geometric neon patterns, Ankara textile vector details, polished obsidian skin highlights, and floating gold holographic rings against deep space black.',
    true
  );
