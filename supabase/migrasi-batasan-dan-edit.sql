-- HUMBA: batasan panjang nama/bio + edit kiriman sendiri
-- Jalankan di Supabase SQL Editor (satu kali).
-- Aman di-run ulang; tidak menghapus data.
-- Catatan: kalau ada bio yang sudah lebih dari 200 karakter atau
-- nama tampilan di luar 2–32 karakter, ADD CONSTRAINT akan gagal
-- dengan pesan check constraint — pendekkan dulu data itu, baru Run lagi.

-- 0) Cek data dulu (tidak mengubah apa-apa). Kalau salah satu
--    query di bawah mengembalikan baris, BERHENTI: pendekkan dulu
--    data itu, baru jalankan migrasi ini lagi.
select id, char_length(display_name) as len from public.humba_profiles
where char_length(display_name) not between 2 and 32;
select id, char_length(bio) as len from public.humba_profiles
where char_length(bio) > 200;

-- 1) Nama tampilan 2–32 karakter, bio maksimal 200 karakter.
alter table public.humba_profiles drop constraint if exists humba_profiles_nama_chk;
alter table public.humba_profiles add constraint humba_profiles_nama_chk
  check (char_length(display_name) between 2 and 32);
alter table public.humba_profiles drop constraint if exists humba_profiles_bio_chk;
alter table public.humba_profiles add constraint humba_profiles_bio_chk
  check (char_length(bio) <= 200);

-- 1b) Kolom updated_at + trigger (jejak kapan edit terjadi).
alter table public.humba_posts add column if not exists updated_at timestamptz;
alter table public.humba_comments add column if not exists updated_at timestamptz;
alter table public.humba_groups add column if not exists updated_at timestamptz;
alter table public.humba_group_posts add column if not exists updated_at timestamptz;
create or replace function public.humba_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists humba_posts_updated_at on public.humba_posts;
create trigger humba_posts_updated_at before update on public.humba_posts
  for each row execute function public.humba_set_updated_at();
drop trigger if exists humba_comments_updated_at on public.humba_comments;
create trigger humba_comments_updated_at before update on public.humba_comments
  for each row execute function public.humba_set_updated_at();
drop trigger if exists humba_groups_updated_at on public.humba_groups;
create trigger humba_groups_updated_at before update on public.humba_groups
  for each row execute function public.humba_set_updated_at();
drop trigger if exists humba_group_posts_updated_at on public.humba_group_posts;
create trigger humba_group_posts_updated_at before update on public.humba_group_posts
  for each row execute function public.humba_set_updated_at();

-- 2) Edit kiriman sendiri (dasar untuk tombol Edit di aplikasi;
--    tombolnya sendiri belum dibuat, tapi API sudah mengizinkan).
drop policy if exists "humba_posts_update_own" on public.humba_posts;
create policy "humba_posts_update_own" on public.humba_posts
  for update to authenticated using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (wall_user_id is null
      or wall_user_id = auth.uid()
      or exists (select 1 from public.humba_friends f where f.status = 'accepted'
        and ((f.requester_id = auth.uid() and f.addressee_id = wall_user_id)
          or (f.requester_id = wall_user_id and f.addressee_id = auth.uid()))))
  );
revoke update on public.humba_posts from authenticated;
grant update (body, image_url, video_url, updated_at) on public.humba_posts to authenticated;
drop policy if exists "humba_comments_update_own" on public.humba_comments;
create policy "humba_comments_update_own" on public.humba_comments
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.humba_comments from authenticated;
grant update (body, updated_at) on public.humba_comments to authenticated;
drop policy if exists "humba_groups_update_creator" on public.humba_groups;
create policy "humba_groups_update_creator" on public.humba_groups
  for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
revoke update on public.humba_groups from authenticated;
grant update (name, description, updated_at) on public.humba_groups to authenticated;
drop policy if exists "humba_group_posts_update_own" on public.humba_group_posts;
create policy "humba_group_posts_update_own" on public.humba_group_posts
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.humba_group_posts from authenticated;
grant update (body, updated_at) on public.humba_group_posts to authenticated;
