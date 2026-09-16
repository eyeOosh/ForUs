-- ============================================================
-- OUR LOVE STORY — SUPABASE SETUP
-- Run this in Supabase → SQL Editor.
--
-- BEFORE RUNNING:
-- Replace YOUR_ADMIN_EMAIL below with the exact email address
-- you will use to sign into the Admin page.
-- ============================================================

create table if not exists public.months (
  id uuid primary key default gen_random_uuid(),
  month_number integer not null unique check (month_number > 0),
  title text not null,
  date_label text,
  memory text not null,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.months enable row level security;

-- IMPORTANT: the entire site is behind Supabase Auth.
-- Only signed-in users can read the memories.
drop policy if exists "Public can view months" on public.months;
drop policy if exists "Signed-in users can view months" on public.months;
create policy "Signed-in users can view months"
on public.months
for select
to authenticated
using (true);

-- Only your admin email can create/edit/delete memories.
drop policy if exists "Admin can insert months" on public.months;
create policy "Admin can insert months"
on public.months
for insert
to authenticated
with check ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL');

drop policy if exists "Admin can update months" on public.months;
create policy "Admin can update months"
on public.months
for update
to authenticated
using ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL')
with check ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL');

drop policy if exists "Admin can delete months" on public.months;
create policy "Admin can delete months"
on public.months
for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL');


-- ============================================================
-- STORAGE
-- Create a bucket named exactly: month-photos
-- In Supabase Dashboard → Storage → New bucket.
-- Make the bucket PUBLIC so the photos can appear on the public site.
--
-- Then run these policies.
-- ============================================================

drop policy if exists "Public can view month photos" on storage.objects;
create policy "Public can view month photos"
on storage.objects
for select
to public
using (bucket_id = 'month-photos');

drop policy if exists "Admin can upload month photos" on storage.objects;
create policy "Admin can upload month photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'month-photos'
  and (auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL'
);

drop policy if exists "Admin can update month photos" on storage.objects;
create policy "Admin can update month photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'month-photos'
  and (auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL'
)
with check (
  bucket_id = 'month-photos'
  and (auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL'
);

drop policy if exists "Admin can delete month photos" on storage.objects;
create policy "Admin can delete month photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'month-photos'
  and (auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL'
);
