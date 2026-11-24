-- HUMBA: perbaikan dari review kedua migrasi-semua.sql
-- Jalankan di Supabase SQL Editor (satu kali). Aman di-run ulang.
-- Yang diperbaiki (temuan reviewer yang TERBUKTI benar setelah dicek
-- ke file saat ini; dua temuan kritis pertama ternyata SUDAH ada di
-- file — lihat catatan di bawah):
--  1) Column grant humba_produk — SELAMA INI TIDAK ADA. Penjual bisa
--     PATCH created_at/id barang sendiri lewat API, barang lama naik
--     ke puncak Toko. Sekarang hanya kolom yang boleh diedit.
--  2) Batas panjang teks produk (keterangan/lokasi/wa/kategori).
--  3) Kolom updated_at + trigger di 5 tabel yang bisa diedit
--     (posts, comments, groups, group_posts, produk) supaya ada
--     jejak kapan edit terjadi; updated_at ikut masuk column grant.
--  4) Column grant humba_profiles — aplikasi hanya update
--     display_name, bio, birthdate, avatar_url, cover_url,
--     last_seen, rc_hash. username/id tidak bisa diubah lewat API.
--  5) Column grant humba_notes (title, body, is_public, updated_at —
--     sama persis dengan yang di-update aplikasi).
--
-- Yang SUDAH benar di file (tidak perlu diperbaiki):
--  - UPDATE bypass dinding: policy humba_posts_update_own SUDAH
--    mencerminkan pengecekan INSERT (null/diri/teman) DAN column
--    grant (body, image_url, video_url) membuat wall_user_id tidak
--    bisa diubah sama sekali. Reviewer memegang salinan lama file.
--  - created_at di posts/comments/groups/group_posts SUDAH tidak
--    bisa diubah (column grant). Yang bolong hanya humba_produk.
--  - Tombol Tolak teman memakai DELETE, bukan UPDATE ke rejected.
--  - display_name/bio SUDAH NOT NULL di schema.sql.
--  - Nama constraint di migrasi sama dengan di schema.sql.
--  - Jumlah policy di database live = 41 (37 schema + 4 produk),
--    cocok persis — tidak ada policy UPDATE lain yang meng-OR.
--
-- Catatan: query SELECT di bawah hanya menampilkan data yang
-- melanggar batas baru. Kalau ada baris, pendekkan dulu data itu,
-- baru jalankan file ini lagi (file aman di-run ulang).

-- ---------- Cek data produk dulu ----------
select id, char_length(keterangan) as len from public.humba_produk where char_length(keterangan) > 2000;
select id, char_length(lokasi) as len from public.humba_produk where char_length(lokasi) > 100;
select id, char_length(wa) as len from public.humba_produk where char_length(wa) > 20 or wa !~ '^[0-9+ -]*$';
select id, char_length(kategori) as len from public.humba_produk where char_length(kategori) > 50;

-- ---------- 2) Batas panjang teks produk ----------
alter table public.humba_produk drop constraint if exists humba_produk_keterangan_chk;
alter table public.humba_produk add constraint humba_produk_keterangan_chk check (char_length(keterangan) <= 2000);
alter table public.humba_produk drop constraint if exists humba_produk_lokasi_chk;
alter table public.humba_produk add constraint humba_produk_lokasi_chk check (char_length(lokasi) <= 100);
alter table public.humba_produk drop constraint if exists humba_produk_wa_chk;
alter table public.humba_produk add constraint humba_produk_wa_chk check (char_length(wa) <= 20 and wa ~ '^[0-9+ -]*$');
alter table public.humba_produk drop constraint if exists humba_produk_kategori_chk;
alter table public.humba_produk add constraint humba_produk_kategori_chk check (char_length(kategori) <= 50);

-- ---------- 3) Kolom updated_at + trigger ----------
alter table public.humba_posts add column if not exists updated_at timestamptz;
alter table public.humba_comments add column if not exists updated_at timestamptz;
alter table public.humba_groups add column if not exists updated_at timestamptz;
alter table public.humba_group_posts add column if not exists updated_at timestamptz;
alter table public.humba_produk add column if not exists updated_at timestamptz;

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
drop trigger if exists humba_produk_updated_at on public.humba_produk;
create trigger humba_produk_updated_at before update on public.humba_produk
  for each row execute function public.humba_set_updated_at();

-- ---------- 1) + 3) Column grant (daftar lengkap, termasuk updated_at) ----------
revoke update on public.humba_posts from authenticated;
grant update (body, image_url, video_url, visibility, updated_at) on public.humba_posts to authenticated;
revoke update on public.humba_comments from authenticated;
grant update (body, updated_at) on public.humba_comments to authenticated;
revoke update on public.humba_groups from authenticated;
grant update (name, description, updated_at) on public.humba_groups to authenticated;
revoke update on public.humba_group_posts from authenticated;
grant update (body, updated_at) on public.humba_group_posts to authenticated;
revoke update on public.humba_produk from authenticated;
grant update (nama, harga, keterangan, lokasi, wa, kategori, updated_at) on public.humba_produk to authenticated;

-- ---------- 4) Column grant profil ----------
revoke update on public.humba_profiles from authenticated;
grant update (display_name, bio, birthdate, avatar_url, cover_url, last_seen, rc_hash) on public.humba_profiles to authenticated;

-- ---------- 5) Column grant catatan ----------
revoke update on public.humba_notes from authenticated;
grant update (title, body, is_public, updated_at) on public.humba_notes to authenticated;
