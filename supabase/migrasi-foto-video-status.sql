-- HUMBA: foto + video di status
-- Jalankan di Supabase SQL Editor (satu kali).
-- Menambah kolom image_url dan video_url ke humba_posts,
-- dan melonggarkan aturan body supaya status boleh hanya foto/video tanpa teks.
alter table public.humba_posts add column if not exists image_url text;
alter table public.humba_posts add column if not exists video_url text;
alter table public.humba_posts drop constraint if exists humba_posts_body_chk;
alter table public.humba_posts add constraint humba_posts_body_chk
  check (char_length(body) between 0 and 2000 and (char_length(body) >= 1 or image_url is not null or video_url is not null));
