-- HUMBA: kolom visibility per postingan (public / friends)
-- Jalankan di Supabase SQL Editor (satu kali). Aman di-run ulang.
-- Default public, jadi feed Jelajah tidak berubah. Pengguna bisa
-- memilih "Teman saja" saat menulis status; status itu hanya bisa
-- dibaca penulisnya dan teman-temannya (diperiksa RLS di bawah).
-- Status lama otomatis jadi public. Tulisan di dinding tetap public.

alter table public.humba_posts add column if not exists visibility text not null default 'public';
alter table public.humba_posts drop constraint if exists humba_posts_visibility_chk;
alter table public.humba_posts add constraint humba_posts_visibility_chk
  check (visibility in ('public', 'friends'));

drop policy if exists "humba_posts_select_all" on public.humba_posts;
create policy "humba_posts_select_all" on public.humba_posts
  for select to authenticated using (
    visibility = 'public'
    or user_id = auth.uid()
    or exists (select 1 from public.humba_friends f where f.status = 'accepted'
      and ((f.requester_id = auth.uid() and f.addressee_id = humba_posts.user_id)
        or (f.requester_id = humba_posts.user_id and f.addressee_id = auth.uid())))
  );

revoke update on public.humba_posts from authenticated;
grant update (body, image_url, video_url, visibility) on public.humba_posts to authenticated;
