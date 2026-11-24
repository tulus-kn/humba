-- ============================================================
-- HUMBA — Skema Supabase (PostgreSQL) v1.0
-- Cara pakai: buka dashboard Supabase proyek
-- https://ubuqxmxkseoslxzruugr.supabase.co
-- (proyek "tulus-kn's Project", sama dengan Pos-El / Andi Kore)
-- lalu SQL Editor → New query → HAPUS isi query lama → tempel
-- seluruh file ini → Run.
--
-- Semua tabel HUMBA memakai prefix "humba_"
-- (humba_profiles, humba_posts, ...). Prefix ini WAJIB
-- supaya tidak bentrok dengan tabel yang sudah ada di proyek
-- ini: "profiles" milik Andi Kore (tanpa kolom-kolom Catatan
-- Harian) dan "posel_*" milik Pos-El. JANGAN ganti nama tabel
-- menjadi nama polos (profiles/posts/...) — CREATE TABLE IF
-- NOT EXISTS akan dilewati untuk tabel yang sudah ada, lalu
-- pembuatan index/policy akan gagal seperti yang pernah
-- terjadi di Pos-El (ERROR 42703).
--
-- File ini aman di-run ulang: tanpa DROP TABLE, semua CREATE
-- memakai IF NOT EXISTS, semua DROP POLICY memakai IF EXISTS,
-- dan penambahan ke publikasi Realtime dibungkus agar tidak
-- gagal kalau tabel sudah terdaftar.
--
-- HUMBA memakai auth yang SAMA dengan Pos-El:
--   1. Authentication → Settings → "Confirm email" SUDAH mati
--      (akun memakai email buatan username@humba.local,
--      jadi email konfirmasi tidak akan pernah sampai).
--      Tidak perlu diubah lagi.
--   2. Anon public key SUDAH tertanam di dalam aplikasi
--      (index.html, DEFAULT_ANON_KEY), jadi pengguna TIDAK
--      perlu menempel kunci apa pun. Buka saja aplikasinya
--      dan daftar.
-- ============================================================

-- ---------- Tabel profil (1 baris per akun) ----------
create table if not exists public.humba_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text not null,
  bio text not null default '',
  birthdate date,
  avatar_color text not null default '#d35400',
  avatar_url text,
  cover_url text,
  rc_hash text,
  reset_gagal int not null default 0,
  reset_blokir_sampai timestamptz,
  last_seen timestamptz,
  created_at timestamptz not null default now(),
  constraint humba_profiles_username_chk check (username ~ '^[a-z0-9._]{3,20}$'),
  constraint humba_profiles_nama_chk check (char_length(display_name) between 2 and 32),
  constraint humba_profiles_bio_chk check (char_length(bio) <= 200)
);

-- ---------- Tabel status Kabar Beranda ----------
create table if not exists public.humba_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.humba_profiles (id) on delete cascade,
  wall_user_id uuid references public.humba_profiles (id) on delete cascade,
  body text not null,
  image_url text,
  video_url text,
  visibility text not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint humba_posts_body_chk check (char_length(body) between 0 and 2000 and (char_length(body) >= 1 or image_url is not null or video_url is not null)),
  constraint humba_posts_visibility_chk check (visibility in ('public', 'friends'))
);
create index if not exists humba_posts_user_idx on public.humba_posts (user_id, created_at desc);
create index if not exists humba_posts_wall_idx on public.humba_posts (wall_user_id, created_at desc);
create index if not exists humba_posts_created_idx on public.humba_posts (created_at desc);

-- ---------- Tabel komentar status ----------
create table if not exists public.humba_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.humba_posts (id) on delete cascade,
  user_id uuid not null references public.humba_profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint humba_comments_body_chk check (char_length(body) between 1 and 500)
);
create index if not exists humba_comments_post_idx on public.humba_comments (post_id, created_at);

-- ---------- Tabel suka (like) ----------
create table if not exists public.humba_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.humba_posts (id) on delete cascade,
  user_id uuid not null references public.humba_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint humba_likes_pair_uniq unique (post_id, user_id)
);

-- ---------- Tabel pertemanan ----------
create table if not exists public.humba_friends (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.humba_profiles (id) on delete cascade,
  addressee_id uuid not null references public.humba_profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  constraint humba_friends_pair_uniq unique (requester_id, addressee_id),
  constraint humba_friends_self_chk check (requester_id <> addressee_id)
);
create index if not exists humba_friends_user_idx on public.humba_friends (requester_id, addressee_id);

-- ---------- Tabel grup ----------
create table if not exists public.humba_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  created_by uuid not null references public.humba_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create table if not exists public.humba_group_members (
  group_id uuid not null references public.humba_groups (id) on delete cascade,
  user_id uuid not null references public.humba_profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- ---------- Tabel kiriman di dalam grup ----------
create table if not exists public.humba_group_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.humba_groups (id) on delete cascade,
  user_id uuid not null references public.humba_profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint humba_group_posts_body_chk check (char_length(body) between 1 and 2000)
);
create index if not exists humba_group_posts_group_idx on public.humba_group_posts (group_id, created_at desc);

-- ---------- Tabel catatan pribadi (Notes) ----------
create table if not exists public.humba_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.humba_profiles (id) on delete cascade,
  title text not null default '',
  body text not null default '',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists humba_notes_user_idx on public.humba_notes (user_id, updated_at desc);

-- ---------- Tabel pesan pribadi ----------
create table if not exists public.humba_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.humba_profiles (id) on delete cascade,
  recipient_id uuid not null references public.humba_profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint humba_messages_body_chk check (char_length(body) between 1 and 2000)
);
create index if not exists humba_messages_pair_idx on public.humba_messages (sender_id, recipient_id, created_at);
create index if not exists humba_messages_recipient_idx on public.humba_messages (recipient_id, created_at);

-- ---------- Tabel poke ----------
create table if not exists public.humba_pokes (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.humba_profiles (id) on delete cascade,
  to_id uuid not null references public.humba_profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists humba_pokes_to_idx on public.humba_pokes (to_id, created_at desc);

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
  updated_at timestamptz,
  constraint humba_produk_nama_chk check (char_length(nama) between 1 and 200),
  constraint humba_produk_harga_chk check (harga >= 0),
  constraint humba_produk_keterangan_chk check (char_length(keterangan) <= 2000),
  constraint humba_produk_lokasi_chk check (char_length(lokasi) <= 100),
  constraint humba_produk_wa_chk check (char_length(wa) <= 20 and wa ~ '^[0-9+ -]*$'),
  constraint humba_produk_kategori_chk check (char_length(kategori) <= 50)
);
create index if not exists humba_produk_seller_idx on public.humba_produk (seller_id, created_at desc);
create index if not exists humba_produk_created_idx on public.humba_produk (created_at desc);


-- Trigger: isi updated_at otomatis saat ada edit.
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

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.humba_profiles enable row level security;
alter table public.humba_posts enable row level security;
alter table public.humba_comments enable row level security;
alter table public.humba_likes enable row level security;
alter table public.humba_friends enable row level security;
alter table public.humba_groups enable row level security;
alter table public.humba_group_members enable row level security;
alter table public.humba_group_posts enable row level security;
alter table public.humba_notes enable row level security;
alter table public.humba_messages enable row level security;
alter table public.humba_pokes enable row level security;
alter table public.humba_produk enable row level security;

-- Profil: semua user login boleh membaca profil (perlu untuk
-- cari teman, dinding, ulang tahun, dan daftar online);
-- hanya boleh tulis barisnya sendiri.
drop policy if exists "humba_profiles_select_all" on public.humba_profiles;
create policy "humba_profiles_select_all" on public.humba_profiles
  for select to authenticated using (true);
drop policy if exists "humba_profiles_insert_own" on public.humba_profiles;
create policy "humba_profiles_insert_own" on public.humba_profiles
  for insert to authenticated with check (id = auth.uid());
drop policy if exists "humba_profiles_update_own" on public.humba_profiles;
create policy "humba_profiles_update_own" on public.humba_profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.humba_profiles from authenticated;
grant update (display_name, bio, birthdate, avatar_url, cover_url, last_seen, rc_hash) on public.humba_profiles to authenticated;

-- Kolom reset hanya boleh dibaca RPC (lihat migrasi-sembunyikan-rc-hash.sql).
revoke select (rc_hash, reset_gagal, reset_blokir_sampai) on public.humba_profiles from authenticated, anon;

-- Status: Kabar Beranda dibaca semua user login; tulis/hapus
-- hanya status sendiri (atau status di dinding sendiri).
drop policy if exists "humba_posts_select_all" on public.humba_posts;
create policy "humba_posts_select_all" on public.humba_posts
  for select to authenticated using (
    visibility = 'public'
    or user_id = auth.uid()
    or exists (select 1 from public.humba_friends f where f.status = 'accepted'
      and ((f.requester_id = auth.uid() and f.addressee_id = humba_posts.user_id)
        or (f.requester_id = humba_posts.user_id and f.addressee_id = auth.uid())))
  );
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
drop policy if exists "humba_posts_delete_own" on public.humba_posts;
create policy "humba_posts_delete_own" on public.humba_posts
  for delete to authenticated using (user_id = auth.uid() or wall_user_id = auth.uid());
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
grant update (body, image_url, video_url, visibility, updated_at) on public.humba_posts to authenticated;

-- Komentar: dibaca semua; tulis sebagai diri sendiri;
-- hapus hanya komentar sendiri atau komentar di status sendiri.
drop policy if exists "humba_comments_select_all" on public.humba_comments;
create policy "humba_comments_select_all" on public.humba_comments
  for select to authenticated using (
    exists (select 1 from public.humba_posts p where p.id = humba_comments.post_id
      and (p.visibility = 'public' or p.user_id = auth.uid()
        or exists (select 1 from public.humba_friends f where f.status = 'accepted'
          and ((f.requester_id = auth.uid() and f.addressee_id = p.user_id)
            or (f.requester_id = p.user_id and f.addressee_id = auth.uid())))))
  );
drop policy if exists "humba_comments_insert_own" on public.humba_comments;
create policy "humba_comments_insert_own" on public.humba_comments
  for insert to authenticated with check (user_id = auth.uid()
    and exists (select 1 from public.humba_posts p where p.id = humba_comments.post_id
      and (p.visibility = 'public' or p.user_id = auth.uid()
        or exists (select 1 from public.humba_friends f where f.status = 'accepted'
          and ((f.requester_id = auth.uid() and f.addressee_id = p.user_id)
            or (f.requester_id = p.user_id and f.addressee_id = auth.uid()))))));
drop policy if exists "humba_comments_delete_own" on public.humba_comments;
create policy "humba_comments_delete_own" on public.humba_comments
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.humba_posts p where p.id = humba_comments.post_id and p.user_id = auth.uid())
  );
drop policy if exists "humba_comments_update_own" on public.humba_comments;
create policy "humba_comments_update_own" on public.humba_comments
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.humba_comments from authenticated;
grant update (body, updated_at) on public.humba_comments to authenticated;

-- Suka: dibaca semua; tambah/hapus hanya sebagai diri sendiri.
drop policy if exists "humba_likes_select_all" on public.humba_likes;
create policy "humba_likes_select_all" on public.humba_likes
  for select to authenticated using (
    exists (select 1 from public.humba_posts p where p.id = humba_likes.post_id
      and (p.visibility = 'public' or p.user_id = auth.uid()
        or exists (select 1 from public.humba_friends f where f.status = 'accepted'
          and ((f.requester_id = auth.uid() and f.addressee_id = p.user_id)
            or (f.requester_id = p.user_id and f.addressee_id = auth.uid())))))
  );
drop policy if exists "humba_likes_insert_own" on public.humba_likes;
create policy "humba_likes_insert_own" on public.humba_likes
  for insert to authenticated with check (user_id = auth.uid()
    and exists (select 1 from public.humba_posts p where p.id = humba_likes.post_id
      and (p.visibility = 'public' or p.user_id = auth.uid()
        or exists (select 1 from public.humba_friends f where f.status = 'accepted'
          and ((f.requester_id = auth.uid() and f.addressee_id = p.user_id)
            or (f.requester_id = p.user_id and f.addressee_id = auth.uid()))))));
drop policy if exists "humba_likes_delete_own" on public.humba_likes;
create policy "humba_likes_delete_own" on public.humba_likes
  for delete to authenticated using (user_id = auth.uid());

-- Pertemanan: hanya kedua belah pihak yang boleh melihat/mengubah.
-- INSERT dipecah supaya status 'accepted' tidak bisa dipalsukan
-- saat mengirim permintaan (permintaan baru harus 'pending'
-- dan pengirim harus diri sendiri).
drop policy if exists "humba_friends_party" on public.humba_friends;
create policy "humba_friends_party" on public.humba_friends
  for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());
drop policy if exists "humba_friends_insert" on public.humba_friends;
create policy "humba_friends_insert" on public.humba_friends
  for insert to authenticated
  with check (requester_id = auth.uid() and status = 'pending');
drop policy if exists "humba_friends_update" on public.humba_friends;
create policy "humba_friends_update" on public.humba_friends
  for update to authenticated
  using (addressee_id = auth.uid() and status = 'pending')
  with check (addressee_id = auth.uid() and status = 'accepted');
revoke update on public.humba_friends from authenticated;
grant update (status) on public.humba_friends to authenticated;
drop policy if exists "humba_friends_delete" on public.humba_friends;
create policy "humba_friends_delete" on public.humba_friends
  for delete to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- Grup: semua user login boleh melihat daftar grup (supaya bisa
-- bergabung); hanya pembuat yang boleh membuat grup.
drop policy if exists "humba_groups_select_all" on public.humba_groups;
create policy "humba_groups_select_all" on public.humba_groups
  for select to authenticated using (true);
drop policy if exists "humba_groups_insert_creator" on public.humba_groups;
create policy "humba_groups_insert_creator" on public.humba_groups
  for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "humba_groups_update_creator" on public.humba_groups;
create policy "humba_groups_update_creator" on public.humba_groups
  for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
revoke update on public.humba_groups from authenticated;
grant update (name, description, updated_at) on public.humba_groups to authenticated;

-- Anggota grup: semua boleh membaca daftar anggota; gabung
-- hanya sebagai diri sendiri.
drop policy if exists "humba_group_members_select_all" on public.humba_group_members;
create policy "humba_group_members_select_all" on public.humba_group_members
  for select to authenticated using (true);
drop policy if exists "humba_group_members_insert_own" on public.humba_group_members;
create policy "humba_group_members_insert_own" on public.humba_group_members
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "humba_group_members_delete_own" on public.humba_group_members;
create policy "humba_group_members_delete_own" on public.humba_group_members
  for delete to authenticated using (user_id = auth.uid());

-- Kiriman grup: anggota grup boleh membaca; tulis hanya sebagai
-- diri sendiri dan hanya kalau anggota grup itu.
drop policy if exists "humba_group_posts_select_member" on public.humba_group_posts;
create policy "humba_group_posts_select_member" on public.humba_group_posts
  for select to authenticated using (
    exists (select 1 from public.humba_group_members m where m.group_id = humba_group_posts.group_id and m.user_id = auth.uid())
  );
drop policy if exists "humba_group_posts_insert_member" on public.humba_group_posts;
create policy "humba_group_posts_insert_member" on public.humba_group_posts
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.humba_group_members m where m.group_id = humba_group_posts.group_id and m.user_id = auth.uid())
  );
drop policy if exists "humba_group_posts_delete_own" on public.humba_group_posts;
create policy "humba_group_posts_delete_own" on public.humba_group_posts
  for delete to authenticated using (user_id = auth.uid());
drop policy if exists "humba_group_posts_update_own" on public.humba_group_posts;
create policy "humba_group_posts_update_own" on public.humba_group_posts
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.humba_group_posts from authenticated;
grant update (body, updated_at) on public.humba_group_posts to authenticated;

-- Catatan (Notes): catatan pribadi hanya pemiliknya; catatan
-- publik (is_public) dibaca semua user login.
drop policy if exists "humba_notes_select" on public.humba_notes;
create policy "humba_notes_select" on public.humba_notes
  for select to authenticated using (user_id = auth.uid() or is_public = true);
drop policy if exists "humba_notes_insert_own" on public.humba_notes;
create policy "humba_notes_insert_own" on public.humba_notes
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "humba_notes_update_own" on public.humba_notes;
create policy "humba_notes_update_own" on public.humba_notes
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.humba_notes from authenticated;
grant update (title, body, is_public, updated_at) on public.humba_notes to authenticated;
drop policy if exists "humba_notes_delete_own" on public.humba_notes;
create policy "humba_notes_delete_own" on public.humba_notes
  for delete to authenticated using (user_id = auth.uid());

-- Pesan: pengirim & penerima saja yang boleh membaca.
-- Kirim hanya sebagai diri sendiri.
drop policy if exists "humba_messages_select_party" on public.humba_messages;
create policy "humba_messages_select_party" on public.humba_messages
  for select to authenticated using (sender_id = auth.uid() or recipient_id = auth.uid());
drop policy if exists "humba_messages_insert_own" on public.humba_messages;
create policy "humba_messages_insert_own" on public.humba_messages
  for insert to authenticated with check (sender_id = auth.uid());
drop policy if exists "humba_messages_update_recipient" on public.humba_messages;
create policy "humba_messages_update_recipient" on public.humba_messages
  for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());
revoke update on public.humba_messages from authenticated;
grant update (read_at) on public.humba_messages to authenticated;

-- Poke: pengirim & penerima saja yang boleh membaca.
-- Kirim hanya sebagai diri sendiri, bukan ke diri sendiri
-- (dicek di aplikasi).
drop policy if exists "humba_pokes_select_party" on public.humba_pokes;
create policy "humba_pokes_select_party" on public.humba_pokes
  for select to authenticated using (from_id = auth.uid() or to_id = auth.uid());
drop policy if exists "humba_pokes_insert_own" on public.humba_pokes;
create policy "humba_pokes_insert_own" on public.humba_pokes
  for insert to authenticated with check (from_id = auth.uid());

-- Barang Toko: semua user login boleh melihat; tulis/hapus hanya
-- barang sendiri.
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


-- ============================================================
-- Realtime: izinkan Postgres mengirim perubahan tabel ini
-- ke client yang berlangganan (status, pesan, dan poke
-- langsung masuk tanpa refresh).
-- Dibungkus DO block supaya run ulang tidak gagal kalau tabel
-- sudah terdaftar di publikasi (duplicate_object).
-- ============================================================
do $$
begin
  alter publication supabase_realtime add table public.humba_posts;
exception when duplicate_object then
  null;
end
$$;
do $$
begin
  alter publication supabase_realtime add table public.humba_comments;
exception when duplicate_object then
  null;
end
$$;
do $$
begin
  alter publication supabase_realtime add table public.humba_likes;
exception when duplicate_object then
  null;
end
$$;
do $$
begin
  alter publication supabase_realtime add table public.humba_messages;
exception when duplicate_object then
  null;
end
$$;
do $$
begin
  alter publication supabase_realtime add table public.humba_pokes;
exception when duplicate_object then
  null;
end
$$;
do $$
begin
  alter publication supabase_realtime add table public.humba_friends;
exception when duplicate_object then
  null;
end
$$;
do $$
begin
  alter publication supabase_realtime add table public.humba_profiles;
exception when duplicate_object then
  null;
end
$$;
do $$
begin
  alter publication supabase_realtime add table public.humba_produk;
exception when duplicate_object then
  null;
end
$$;

-- ============================================================
-- Reset password pakai kode pemulihan (meniru Pos-El v4.1).
-- Fungsi di bawah sudah diperbaiki: kode NULL ditolak dan
-- perbandingan hash memakai IS DISTINCT FROM (tidak bisa lolos
-- lewat NULL). Lihat migrasi-reset-password.sql.
-- ============================================================
create extension if not exists pgcrypto;

alter table public.humba_profiles add column if not exists rc_hash text;
alter table public.humba_profiles add column if not exists reset_gagal int not null default 0;
alter table public.humba_profiles add column if not exists reset_blokir_sampai timestamptz;

create or replace function public.humba_reset_password(p_username text, p_kode text, p_baru text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_hash text;
  v_gagal int;
  v_blokir timestamptz;
  v_hitung text;
begin
  if p_username is null or p_baru is null or char_length(p_baru) < 6 then
    return 'password_pendek';
  end if;
  if p_kode is null then return 'kode_salah'; end if;
  select id, rc_hash, reset_gagal, reset_blokir_sampai
    into v_id, v_hash, v_gagal, v_blokir
    from public.humba_profiles where username = lower(p_username);
  if v_id is null then return 'tidak_ada'; end if;
  if v_hash is null then return 'belum_ada_kode'; end if;
  if v_blokir is not null and v_blokir > now() then return 'terlalu_banyak'; end if;
  v_hitung := encode(digest(upper(regexp_replace(p_kode, '[^A-Z0-9]', '', 'g')), 'sha256'), 'hex');
  if v_hitung is distinct from v_hash then
    v_gagal := coalesce(v_gagal, 0) + 1;
    if v_gagal >= 5 then
      update public.humba_profiles set reset_gagal = 0, reset_blokir_sampai = now() + interval '15 minutes' where id = v_id;
    else
      update public.humba_profiles set reset_gagal = v_gagal where id = v_id;
    end if;
    return 'kode_salah';
  end if;
  update auth.users set encrypted_password = crypt(p_baru, gen_salt('bf'))
    where email = lower(p_username) || '@humba.local';
  update public.humba_profiles set reset_gagal = 0, reset_blokir_sampai = null where id = v_id;
  return 'ok';
end;
$$;
revoke all on function public.humba_reset_password(text, text, text) from public;
grant execute on function public.humba_reset_password(text, text, text) to anon, authenticated;

create or replace function public.humba_ganti_kode(p_hash text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return 'tidak_masuk'; end if;
  if p_hash is null then return 'kode_salah'; end if;
  update public.humba_profiles set rc_hash = p_hash, reset_gagal = 0, reset_blokir_sampai = null where id = auth.uid();
  return 'ok';
end;
$$;
revoke all on function public.humba_ganti_kode(text) from public;
grant execute on function public.humba_ganti_kode(text) to authenticated;
