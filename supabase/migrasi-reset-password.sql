-- HUMBA: reset password pakai kode pemulihan (meniru Pos-El v4.1)
-- Jalankan di Supabase SQL Editor (satu kali). Aman di-run ulang.
-- Cara kerja:
--   * Saat daftar, aplikasi membuat kode "HUMBA-XXXX-XXXX" dan hanya
--     menyimpan HASH-nya (SHA-256) di humba_profiles.rc_hash.
--     Kode aslinya tidak pernah disimpan di database.
--   * Kalau lupa password, pengguna masukkan username + kode pemulihan
--     + password baru di halaman masuk. RPC humba_reset_password
--     memeriksa hash kode, lalu mengganti password di auth.users.
--   * Kode bisa dibuat ulang di Pengaturan (RPC humba_ganti_kode).
--   * Akun lama yang dibuat sebelum fitur ini tidak punya rc_hash:
--     reset mengembalikan 'belum_ada_kode' — minta reset manual ke admin.
--   * 5x kode salah = blokir 15 menit (anti brute-force).

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
  select id, rc_hash, reset_gagal, reset_blokir_sampai
    into v_id, v_hash, v_gagal, v_blokir
    from public.humba_profiles where username = lower(p_username);
  if v_id is null then return 'tidak_ada'; end if;
  if v_hash is null then return 'belum_ada_kode'; end if;
  if v_blokir is not null and v_blokir > now() then return 'terlalu_banyak'; end if;
  v_hitung := encode(digest(upper(regexp_replace(p_kode, '[^A-Z0-9]', '', 'g')), 'sha256'), 'hex');
  if v_hitung <> v_hash then
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
  update public.humba_profiles set rc_hash = p_hash, reset_gagal = 0, reset_blokir_sampai = null where id = auth.uid();
  return 'ok';
end;
$$;
revoke all on function public.humba_ganti_kode(text) from public;
grant execute on function public.humba_ganti_kode(text) to authenticated;
