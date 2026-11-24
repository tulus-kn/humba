-- HUMBA: batasan panjang nama/bio + edit kiriman sendiri
-- Jalankan di Supabase SQL Editor (satu kali).
-- Aman di-run ulang; tidak menghapus data.
-- Catatan: kalau ada bio yang sudah lebih dari 200 karakter atau
-- nama tampilan di luar 2–32 karakter, ADD CONSTRAINT akan gagal
-- dengan pesan check constraint — pendekkan dulu data itu, baru Run lagi.

-- 1) Nama tampilan 2–32 karakter, bio maksimal 200 karakter.
alter table public.humba_profiles drop constraint if exists humba_profiles_nama_chk;
alter table public.humba_profiles add constraint humba_profiles_nama_chk
  check (char_length(display_name) between 2 and 32);
alter table public.humba_profiles drop constraint if exists humba_profiles_bio_chk;
alter table public.humba_profiles add constraint humba_profiles_bio_chk
  check (char_length(bio) <= 200);

-- 2) Edit kiriman sendiri (dasar untuk tombol Edit di aplikasi;
--    tombolnya sendiri belum dibuat, tapi API sudah mengizinkan).
drop policy if exists "humba_posts_update_own" on public.humba_posts;
create policy "humba_posts_update_own" on public.humba_posts
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "humba_comments_update_own" on public.humba_comments;
create policy "humba_comments_update_own" on public.humba_comments
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "humba_groups_update_creator" on public.humba_groups;
create policy "humba_groups_update_creator" on public.humba_groups
  for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
drop policy if exists "humba_group_posts_update_own" on public.humba_group_posts;
create policy "humba_group_posts_update_own" on public.humba_group_posts
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
