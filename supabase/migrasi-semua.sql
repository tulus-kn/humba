-- ============================================================
-- HUMBA — SEMUA MIGRASI DALAM SATU FILE
-- Cara pakai: dashboard Supabase → SQL Editor → New query →
-- HAPUS isi query lama → tempel SELURUH file ini → Run.
-- Jalankan SETELAH supabase/schema.sql (schema sudah jalan).
-- Aman di-run ulang; tidak ada DROP TABLE dan tidak menghapus data.
-- Kalau ada bio yang sudah lebih dari 200 karakter atau nama
-- tampilan di luar 2–32 karakter, bagian 5 akan gagal dengan
-- pesan check constraint — pendekkan dulu data itu, baru Run lagi.
-- ============================================================

-- ================= 1) Toko (tabel humba_produk) (dari migrasi-toko.sql) =================
-- ============================================================
-- HUMBA — Migrasi Toko (Market) v1.1
-- Cara pakai: buka dashboard Supabase proyek
-- https://ubuqxmxkseoslxzruugr.supabase.co
-- (proyek "tulus-kn's Project", sama dengan Pos-El / Andi Kore)
-- lalu SQL Editor → New query → HAPUS isi query lama → tempel
-- seluruh file ini → Run.
--
-- File ini HANYA menambah tabel humba_produk.
-- JANGAN jalankan file ini sebelum supabase/schema.sql.
-- Aman di-run ulang: CREATE TABLE IF NOT EXISTS dan
-- DROP POLICY IF EXISTS (tidak ada DROP TABLE).
--
-- Toko di aplikasi tetap jalan walau tabel ini belum ada
-- (Mode Lokal menyimpan produk di HP; di cloud tampil pesan
-- "jalankan migrasi-toko.sql"), jadi file ini opsional
-- sampai kamu mau mengaktifkan Toko antar HP.
-- ============================================================

-- ---------- Tabel barang Toko ----------
create table if not exists public.humba_produk (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.humba_profiles (id) on delete cascade,
  nama text not null,
  harga integer not null default 0,
  keterangan text not null default '',
  lokasi text not null default '',
  wa text not null default '',
  kategori text not null default 'Lainnya',
  created_at timestamptz not null default now(),
  constraint humba_produk_nama_chk check (char_length(nama) between 1 and 200),
  constraint humba_produk_harga_chk check (harga >= 0)
);
create index if not exists humba_produk_seller_idx on public.humba_produk (seller_id, created_at desc);
create index if not exists humba_produk_created_idx on public.humba_produk (created_at desc);

-- ============================================================
-- Row Level Security (pola sama seperti schema.sql)
-- ============================================================
alter table public.humba_produk enable row level security;

-- Barang: semua user login boleh melihat (supaya Toko bisa
-- dijelajahi); tulis/hapus hanya barang sendiri.
drop policy if exists "humba_produk_select_all" on public.humba_produk;
create policy "humba_produk_select_all" on public.humba_produk
  for select to authenticated using (true);
drop policy if exists "humba_produk_insert_own" on public.humba_produk;
create policy "humba_produk_insert_own" on public.humba_produk
  for insert to authenticated with check (seller_id = auth.uid());
drop policy if exists "humba_produk_update_own" on public.humba_produk;
create policy "humba_produk_update_own" on public.humba_produk
  for update to authenticated using (seller_id = auth.uid()) with check (seller_id = auth.uid());
drop policy if exists "humba_produk_delete_own" on public.humba_produk;
create policy "humba_produk_delete_own" on public.humba_produk
  for delete to authenticated using (seller_id = auth.uid());

-- Realtime: supaya barang baru langsung muncul di Toko.
do $$
begin
  alter publication supabase_realtime add table public.humba_produk;
exception when duplicate_object then
  null;
end
$$;


-- ================= 2) Foto profil & sampul (kolom avatar_url, cover_url) (dari migrasi-foto-profil.sql) =================
-- HUMBA: tambah kolom foto profil & sampul
-- Jalankan file ini di Supabase Dashboard → SQL Editor → New query → Run.
-- Aman diulang: kolom hanya ditambahkan kalau belum ada.
-- Tidak mengubah tabel lain dan tidak mengubah RLS
-- (policy humba_profiles_update_own sudah mengizinkan tiap user
--  mengubah baris profilnya sendiri, termasuk kedua kolom baru ini).

alter table public.humba_profiles
  add column if not exists avatar_url text;

alter table public.humba_profiles
  add column if not exists cover_url text;


-- ================= 3) Foto & video di status (kolom image_url, video_url) (dari migrasi-foto-video-status.sql) =================
-- HUMBA: foto + video di status
-- Jalankan di Supabase SQL Editor (satu kali).
-- Menambah kolom image_url dan video_url ke humba_posts,
-- dan melonggarkan aturan body supaya status boleh hanya foto/video tanpa teks.
alter table public.humba_posts add column if not exists image_url text;
alter table public.humba_posts add column if not exists video_url text;
alter table public.humba_posts drop constraint if exists humba_posts_body_chk;
alter table public.humba_posts add constraint humba_posts_body_chk
  check (char_length(body) between 0 and 2000 and (char_length(body) >= 1 or image_url is not null or video_url is not null));


-- ================= 4) Perbaikan keamanan RLS (teman, pesan dibaca, dinding) (dari migrasi-perbaikan-keamanan.sql) =================
-- HUMBA: perbaikan keamanan RLS v1.2 (+ dinding)
-- Jalankan di Supabase SQL Editor (satu kali).
-- Aman di-run ulang; tidak ada DROP TABLE dan tidak menghapus data.
-- Menggabungkan: perbaikan RLS v1.2 (column grant) + dinding teman saja.
-- 1) Teman: hanya PENERIMA permintaan yang boleh menerimanya,
--    dan hanya mengubah kolom status dari 'pending' ke 'accepted'.
--    (Sebelumnya pengirim juga boleh update, sehingga bisa
--    menerima permintaannya sendiri lewat API.)
--    Column grant memastikan kolom lain (requester_id, addressee_id)
--    tidak bisa diubah lewat update.
-- 2) Pesan: penerima boleh menandai pesan sebagai sudah dibaca
--    (kolom read_at saja). Sebelumnya tidak ada policy UPDATE,
--    sehingga update read_at diam-diam gagal dan badge pesan
--    belum dibaca tidak pernah hilang.
-- 3) Dinding: hanya teman (atau diri sendiri) yang boleh menulis
--    di dinding orang lain. Sebelumnya siapa pun bisa lewat API.

drop policy if exists "humba_friends_update" on public.humba_friends;
create policy "humba_friends_update" on public.humba_friends
  for update to authenticated
  using (addressee_id = auth.uid() and status = 'pending')
  with check (addressee_id = auth.uid() and status = 'accepted');
revoke update on public.humba_friends from authenticated;
grant update (status) on public.humba_friends to authenticated;

drop policy if exists "humba_messages_update_recipient" on public.humba_messages;
create policy "humba_messages_update_recipient" on public.humba_messages
  for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());
revoke update on public.humba_messages from authenticated;
grant update (read_at) on public.humba_messages to authenticated;

drop policy if exists "humba_posts_insert_own" on public.humba_posts;
create policy "humba_posts_insert_own" on public.humba_posts
  for insert to authenticated with check (
    user_id = auth.uid()
    and (wall_user_id is null
      or wall_user_id = auth.uid()
      or exists (select 1 from public.humba_friends f where f.status = 'accepted'
        and ((f.requester_id = auth.uid() and f.addressee_id = wall_user_id)
          or (f.requester_id = wall_user_id and f.addressee_id = auth.uid()))))
  );


-- ================= 5) Batasan nama/bio + edit kiriman sendiri (dari migrasi-batasan-dan-edit.sql) =================
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

-- SELESAI. Kalau muncul "Success. No rows returned", semua migrasi jalan.
