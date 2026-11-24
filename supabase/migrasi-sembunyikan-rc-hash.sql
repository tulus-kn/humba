-- HUMBA — Migrasi sembunyikan kolom reset (bagian 10 dari migrasi-semua.sql)
-- Tempel di SQL Editor dan Run. Aman di-run ulang.
-- PENTING: jalankan SETELAH aplikasi v1.2 termuat di HP.

-- ================= 10) Sembunyikan kolom reset dari pembacaan (review ChatGPT) =================
-- rc_hash / reset_gagal / reset_blokir_sampai selama ini bisa dibaca
-- semua user login lewat select("*") profil. Sekarang dicabut hak
-- bacanya; yang boleh menyentuh ketiganya hanya RPC security-definer
-- (reset/ganti kode) dan UPDATE rc_hash saat daftar (grant tetap ada).
-- PENTING: jalankan bagian ini SETELAH aplikasi v1.2 termuat di HP.

revoke select (rc_hash, reset_gagal, reset_blokir_sampai) on public.humba_profiles from authenticated, anon;

