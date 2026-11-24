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
