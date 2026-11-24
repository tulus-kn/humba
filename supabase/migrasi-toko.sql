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
alter table public.humba_produk add column if not exists updated_at timestamptz;
alter table public.humba_produk drop constraint if exists humba_produk_keterangan_chk;
alter table public.humba_produk add constraint humba_produk_keterangan_chk check (char_length(keterangan) <= 2000);
alter table public.humba_produk drop constraint if exists humba_produk_lokasi_chk;
alter table public.humba_produk add constraint humba_produk_lokasi_chk check (char_length(lokasi) <= 100);
alter table public.humba_produk drop constraint if exists humba_produk_wa_chk;
alter table public.humba_produk add constraint humba_produk_wa_chk check (char_length(wa) <= 20 and wa ~ '^[0-9+ -]*$');
alter table public.humba_produk drop constraint if exists humba_produk_kategori_chk;
alter table public.humba_produk add constraint humba_produk_kategori_chk check (char_length(kategori) <= 50);
create or replace function public.humba_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists humba_produk_updated_at on public.humba_produk;
create trigger humba_produk_updated_at before update on public.humba_produk
  for each row execute function public.humba_set_updated_at();

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
revoke update on public.humba_produk from authenticated;
grant update (nama, harga, keterangan, lokasi, wa, kategori, updated_at) on public.humba_produk to authenticated;

-- Realtime: supaya barang baru langsung muncul di Toko.
do $$
begin
  alter publication supabase_realtime add table public.humba_produk;
exception when duplicate_object then
  null;
end
$$;
