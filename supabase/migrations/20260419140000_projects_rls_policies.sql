-- Row level security: public site reads only visible projects; signed-in admins (authenticated) can CRUD everything.
-- Without policies on INSERT, creating projects returns 403/400-style errors from PostgREST depending on version.

alter table if exists public.projects enable row level security;
alter table if exists public.project_images enable row level security;

drop policy if exists "projects_anon_read_visible" on public.projects;
drop policy if exists "projects_authenticated_all" on public.projects;
drop policy if exists "project_images_anon_read_public" on public.project_images;
drop policy if exists "project_images_authenticated_all" on public.project_images;

create policy "projects_anon_read_visible"
  on public.projects for select to anon
  using (not is_hidden);

create policy "projects_authenticated_all"
  on public.projects for all to authenticated
  using (true) with check (true);

create policy "project_images_anon_read_public"
  on public.project_images for select to anon
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and not p.is_hidden
    )
  );

create policy "project_images_authenticated_all"
  on public.project_images for all to authenticated
  using (true) with check (true);
