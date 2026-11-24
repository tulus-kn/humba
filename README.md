# HUMBA

Jejaring sosial nostalgia ala Facebook 2009, tersambung ke Supabase supaya akun dan data saling terhubung antar HP dan bisa dibuka dari browser mana saja.

- **Situs live:** `https://tulus-kn.github.io/humba/`
- **Repo:** `https://github.com/tulus-kn/humba`
- **Backend:** Supabase proyek `tulus-kn's Project` (`https://ubuqxmxkseoslxzruugr.supabase.co`) — proyek yang sama dengan Pos-El dan Andi Kore.
- **Lisensi:** MIT (lihat file `LICENSE`).

## Fitur

- Daftar hanya pakai **username + nama + password** (tanpa email, tanpa nomor HP). Auth memakai email buatan `username@humba.local`.
- **Kabar Beranda:** tulis status, **foto & video di status** (ketuk `+` → Foto/Video dari Album atau dengan Kamera; foto diperkecil otomatis, video maks. 8 MB; boleh tanpa teks), suka (like), komentar, hapus status sendiri.
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

> Repo sudah ada: https://github.com/tulus-kn/humba — live di https://tulus-kn.github.io/humba/ dan https://humba-8x9.pages.dev/

1. Buka GitHub → New repository → nama **`humba`**, pilih **Public**, **jangan** centang "Add a README" (repo harus kosong).
2. Repo sudah dibuat dan live (lihat di atas). Push selanjutnya langsung ke `main`, GitHub Pages dan Cloudflare Pages ikut deploy otomatis.

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

6. **Mengaktifkan perbaikan keamanan (wajib, satu kali): SQL Editor → New query → tempel seluruh isi file `supabase/migrasi-perbaikan-keamanan.sql` → Run.** File ini memperbaiki policy teman (hanya penerima yang boleh menerima), pesan (penerima boleh menandai dibaca), dan dinding (hanya teman yang boleh menulis).

7. **Mengaktifkan foto & video di status (supaya tersimpan antar HP): SQL Editor → New query → tempel seluruh isi file `supabase/migrasi-foto-video-status.sql` → Run.** File ini hanya menambah dua kolom (`image_url`, `video_url`) di tabel `humba_posts` dan melonggarkan aturan supaya status boleh hanya foto/video tanpa teks. Tanpa langkah ini, status berfoto/video tetap jalan dalam Mode Lokal, tapi di cloud gagal dengan pesan migrasi — aplikasi tidak crash.

8. **Mengaktifkan batasan teks & edit sendiri (satu kali): SQL Editor → New query → tempel seluruh isi file `supabase/migrasi-batasan-dan-edit.sql` → Run.** Menambah batasan nama tampilan 2–32 karakter dan bio maks. 200 karakter di database, plus policy UPDATE supaya pengguna bisa mengedit status, komentar, grup, dan kiriman grup miliknya sendiri (tombol Ubah di aplikasi sudah ada untuk status dan komentar; grup dan kiriman grup menyusul).
9. **Mengaktifkan reset password pakai kode pemulihan (satu kali): SQL Editor → New query → tempel seluruh isi file `supabase/migrasi-reset-password.sql` → Run.** Menambah kolom `rc_hash` di `humba_profiles` dan dua fungsi database (`humba_reset_password`, `humba_ganti_kode`). Saat daftar, aplikasi membuat kode `HUMBA-XXXX-XXXX` dan hanya menyimpan hash-nya — kode aslinya tidak pernah disimpan. Kalau lupa password, klik "Lupa Password?" di halaman masuk, masukkan username + kode + password baru. 5x kode salah = blokir 15 menit. Akun lama yang dibuat sebelum fitur ini tidak punya kode — reset manual lewat dashboard Supabase.

10. **Mengaktifkan visibility per postingan (satu kali): SQL Editor → New query → tempel seluruh isi file `supabase/migrasi-visibility.sql` → Run.** Menambah kolom `visibility` (`public`/`friends`, default `public`) di `humba_posts` dan mengubah policy SELECT supaya status "Teman saja" hanya bisa dibaca penulisnya dan teman-temannya. Tanpa langkah ini, status baru gagal terkirim di cloud dengan pesan migrasi — aplikasi tidak crash.

11. **Perbaikan review kedua (satu kali): SQL Editor → New query → tempel seluruh isi file `supabase/migrasi-semua.sql` (sudah berisi bagian 8) → Run.** File aman di-run ulang, jadi menempel ulang seluruh file tidak masalah. Isinya: column grant produk (penjual tidak bisa lagi mengubah `created_at` barang sendiri), batas panjang teks produk, kolom `updated_at` + trigger di 5 tabel yang bisa diedit, dan column grant profil + catatan.

12. **Update keamanan v1.2 (satu kali): refresh dulu aplikasi di HP sampai kartu Tentang menampilkan v1.2, BARU tempel seluruh isi file `supabase/migrasi-semua.sql` (sudah berisi bagian 9 dan 10) → Run.** Urutannya penting: bagian 10 mencabut hak baca kolom reset (`rc_hash`, `reset_gagal`, `reset_blokir_sampai`) dari profil, dan aplikasi lama masih memakai `select("*")` sehingga akan error kalau SQL-nya dijalankan duluan. Isi bagian 9: komentar dan like kini mengikuti privasi postingan induknya (status "Teman saja" tidak bisa lagi dikomentari/disukai orang luar). Isi bagian 10: kolom reset tidak bisa lagi dibaca pengguna lain. Di aplikasi: celah reset password lewat kode NULL sudah ditutup, kode pemulihan kini dibuat dengan `crypto.getRandomValues`, draft/riwayat/keranjang/wishlist/pesanan kini tersimpan per akun (data lama dipindah otomatis), tombol Hapus Cache tidak lagi menghapus database Mode Lokal, dan detail status kini diambil langsung by id (status lama tidak lagi "tidak ditemukan").

**Jalan pintas:** langkah 4–11 sudah digabung dalam **satu file `supabase/migrasi-semua.sql`** — tempel file itu saja, tidak perlu tempel satu-satu.

## Cara pakai (pengguna)

1. Buka `https://tulus-kn.github.io/humba/`.
2. Tekan **Daftar Akun Baru**, isi username (huruf kecil, 3–20 karakter), nama tampilan, password (min. 6 karakter), dan tanggal lahir (opsional).
3. Tulis status di Kabar Beranda, cari teman lewat kolom pencarian, buat grup, tulis catatan, atau kirim pesan.

## Batasan yang jujur

- Butuh internet: aplikasi memuat Supabase lewat CDN dan menyimpan data di Supabase.
- Sinkron antar HP **belum teruji end-to-end dari server pembuat** (domain `*.supabase.co` diblokir dari sana). Uji penentunya: daftar 2 akun berbeda di 2 HP, tambah teman, kirim pesan, dan tulis status — semuanya harus muncul di HP satunya.
- Online dihitung dari `last_seen` (diperbarui tiap 60 detik selama aplikasi terbuka; offline setelah ~2 menit tidak aktif).
- Ganti password bisa dari Pengaturan → Keamanan Akun. Kalau **lupa password**, klik "Lupa Password?" di halaman masuk lalu masukkan username + kode pemulihan + password baru (kode dibuat saat daftar dan hanya tampil sekali; kalau hilang, buat kode baru di Pengaturan → Keamanan Akun). Tidak ada reset lewat email karena auth memakai email buatan. Akun lama tanpa kode pemulihan tetap harus direset manual lewat dashboard Supabase → Authentication → Users.
- Setiap push ke `main` diperiksa otomatis oleh GitHub Actions (`.github/workflows/check.yml`): sintaks JavaScript di `index.html` harus lolos `node --check`.
