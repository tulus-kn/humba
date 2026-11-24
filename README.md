# HUMBA

Jejaring sosial nostalgia ala Facebook 2009, tersambung ke Supabase supaya akun dan data saling terhubung antar HP dan bisa dibuka dari browser mana saja.

- **Situs live:** `https://tulus-kn.github.io/humba/`
- **Repo:** `https://github.com/tulus-kn/humba`
- **Backend:** Supabase proyek `tulus-kn's Project` (`https://ubuqxmxkseoslxzruugr.supabase.co`) — proyek yang sama dengan Pos-El dan Andi Kore.

## Fitur

- Daftar hanya pakai **username + nama + password** (tanpa email, tanpa nomor HP). Auth memakai email buatan `username@humba.local`.
- **Kabar Beranda:** tulis status, suka (like), komentar, hapus status sendiri.
- **Teman:** cari pengguna, tambah teman, terima/tolak permintaan.
- **Profil:** bio, tanggal lahir, dinding (teman bisa menulis di dindingmu), **foto profil dan foto sampul** (ketuk foto/sampul di halaman Saya atau Profil untuk mengganti; foto diperkecil otomatis sebelum disimpan).
- **Grup:** buat grup, gabung grup, kirim kiriman di dalam grup.
- **Catatan (Notes):** tulis catatan pribadi atau publikasikan.
- **Pesan Masuk:** chat pribadi antar pengguna.
- **Poke:** poke teman dan poke balik.
- **Sedang Online** (aktif dalam 2 menit terakhir) dan **Ulang Tahun** (30 hari ke depan).
- **Tampilan ala RedNote (tema gelap):** bottom nav Beranda / Toko / + / Pesan / Saya; Beranda bertab Mengikuti / Jelajah / Terdekat (grid 2 kolom, klik kartu untuk detail status, suka, komentar, simpan); drawer menu (Tambah Teman, Creator Center, Draft, Riwayat, Pesanan, Keranjang, Dompet, Panduan Komunitas, Bantuan, Pengaturan).
- **Toko (Market):** grid barang, kategori, cari, Pasang Barang (nama, harga Rp, keterangan, lokasi, no. WA), detail barang dengan tombol "Hubungi via WA" dan "Chat di HUMBA", Keranjang, Wishlist, Pesanan, dan Dompet (semua Rp 0 — HUMBA bukan pembayaran sungguhan).
- **Saya:** profil + angka Mengikuti / Pengikut / Suka & Simpan, tab Catatan / Suka / Disimpan, Riwayat, dan Statistik (Creator Center, dihitung dari data asli saja — tanpa views karangan).
- **Mode Lokal (demo):** kalau Supabase belum dikonfigurasi, aplikasi tetap jalan dengan data yang tersimpan hanya di HP/browser itu — diberi label yang jelas.
- **Draft & Riwayat:** teks status yang belum terkirim tersimpan otomatis (Draft); status yang pernah dibuka tercatat di Riwayat (maksimal 50).

## Repo GitHub (sekali saja, pemilik)

> Repo belum ada — file di sini masih lokal saja.

1. Buka GitHub → New repository → nama **`humba`**, pilih **Public**, **jangan** centang "Add a README" (repo harus kosong).
2. Beri tahu saya begitu repo dibuat, lalu saya push semua file ini (`index.html`, `supabase/schema.sql`, `README.md`) ke `main` dan aktifkan GitHub Pages supaya live di `https://tulus-kn.github.io/humba/`.

## Langkah sekali saja (pemilik, di dashboard Supabase)

> Tanpa langkah ini, aplikasi jalan dalam Mode Lokal dan akun tidak akan sinkron antar HP.

1. Buka dashboard Supabase proyek `tulus-kn's Project`.
2. **SQL Editor → New query → hapus isi query lama → tempel seluruh isi file `supabase/schema.sql` → Run.**
   - Kalau muncul peringatan "destructive operations", aman: file ini hanya `CREATE TABLE IF NOT EXISTS` dan `DROP POLICY` (tidak ada `DROP TABLE`, tidak menghapus data).
   - Semua tabel memakai prefix `humba_` (`humba_profiles`, `humba_posts`, …) supaya tidak bentrok dengan tabel Andi Kore (`profiles`) dan Pos-El (`posel_*`).
3. **Authentication → Settings → "Confirm email" SUDAH mati** (akun memakai email buatan, jadi konfirmasi email tidak akan pernah sampai). Tidak perlu diubah lagi.
4. **Mengaktifkan Toko (opsional, kalau mau jualan antar HP): SQL Editor → New query → tempel seluruh isi file `supabase/migrasi-toko.sql` → Run.** File ini hanya menambah tabel `humba_produk` (tidak menyentuh tabel lama). Tanpa langkah ini, Toko tetap jalan dalam Mode Lokal (produk hanya di HP itu) dan di cloud tampil pesan "jalankan supabase/migrasi-toko.sql" — aplikasi tidak crash.
5. **Mengaktifkan foto profil & sampul (supaya tersimpan antar HP): SQL Editor → New query → tempel seluruh isi file `supabase/migrasi-foto-profil.sql` → Run.** File ini hanya menambah dua kolom (`avatar_url`, `cover_url`) di tabel `humba_profiles` (tidak menyentuh tabel lain, tidak mengubah RLS). Tanpa langkah ini, foto tetap bisa diganti dalam Mode Lokal (tersimpan di HP itu), tapi di cloud tampil pesan "jalankan supabase/migrasi-foto-profil.sql" — aplikasi tidak crash.
6. **Kunci anon SUDAH tertanam** di dalam aplikasi (`index.html`, `DEFAULT_ANON_KEY`). Pengguna tidak perlu menempel kunci apa pun — buka aplikasi dan langsung daftar.

## Cara pakai (pengguna)

1. Buka `https://tulus-kn.github.io/humba/`.
2. Tekan **Daftar Akun Baru**, isi username (huruf kecil, 3–20 karakter), nama tampilan, password (min. 6 karakter), dan tanggal lahir (opsional).
3. Tulis status di Kabar Beranda, cari teman lewat kolom pencarian, buat grup, tulis catatan, atau kirim pesan.

## Batasan yang jujur

- Butuh internet: aplikasi memuat Supabase lewat CDN dan menyimpan data di Supabase.
- Sinkron antar HP **belum teruji end-to-end dari server pembuat** (domain `*.supabase.co` diblokir dari sana). Uji penentunya: daftar 2 akun berbeda di 2 HP, tambah teman, kirim pesan, dan tulis status — semuanya harus muncul di HP satunya.
- Online dihitung dari `last_seen` (offline setelah ~2 menit tidak aktif).
- Tidak ada reset password mandiri: reset lewat dashboard Supabase → Authentication → Users.
