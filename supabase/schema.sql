-- =========================================================
-- GAOS KINEMATIC WEBSITE SUPABASE SETUP
-- Run this in Supabase SQL Editor.
-- =========================================================

create extension if not exists pgcrypto;

-- 1. Reviews table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  project_type text not null,
  rating int not null check (rating between 1 and 5),
  message text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists "Public can submit reviews" on public.reviews;
create policy "Public can submit reviews"
on public.reviews for insert
to anon, authenticated
with check (true);

drop policy if exists "Public can read approved reviews" on public.reviews;
create policy "Public can read approved reviews"
on public.reviews for select
to anon, authenticated
using (is_public = true);

drop policy if exists "Authenticated admins can manage reviews" on public.reviews;
create policy "Authenticated admins can manage reviews"
on public.reviews for all
to authenticated
using (true)
with check (true);

-- 2. Live site photos table
create table if not exists public.live_site_photos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  survey_type text not null,
  location text not null,
  caption text not null,
  image_url text not null,
  storage_path text not null,
  is_public boolean not null default true,
  uploaded_by uuid references auth.users(id) on delete set null,
  captured_at timestamptz not null default now()
);

alter table public.live_site_photos enable row level security;

drop policy if exists "Public can read public live photos" on public.live_site_photos;
create policy "Public can read public live photos"
on public.live_site_photos for select
to anon, authenticated
using (is_public = true or auth.role() = 'authenticated');

drop policy if exists "Authenticated users can upload live photos" on public.live_site_photos;
create policy "Authenticated users can upload live photos"
on public.live_site_photos for insert
to authenticated
with check (uploaded_by = auth.uid());

drop policy if exists "Authenticated users can update live photos" on public.live_site_photos;
create policy "Authenticated users can update live photos"
on public.live_site_photos for update
to authenticated
using (uploaded_by = auth.uid())
with check (uploaded_by = auth.uid());

-- 3. Storage bucket for live photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'live-site-photos',
  'live-site-photos',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies
drop policy if exists "Public can view live site photos" on storage.objects;
create policy "Public can view live site photos"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'live-site-photos');

drop policy if exists "Authenticated users can upload live site photos" on storage.objects;
create policy "Authenticated users can upload live site photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'live-site-photos');

drop policy if exists "Authenticated users can update own live site photos" on storage.objects;
create policy "Authenticated users can update own live site photos"
on storage.objects for update
to authenticated
using (bucket_id = 'live-site-photos' and owner = auth.uid())
with check (bucket_id = 'live-site-photos' and owner = auth.uid());
