-- HUMBA — Migrasi privasi komentar & like (bagian 9 dari migrasi-semua.sql)
-- Tempel di SQL Editor dan Run. Aman di-run ulang.

-- ================= 9) Privasi komentar & like ikut postingan (review ChatGPT) =================
-- Selama ini humba_comments / humba_likes bisa dibaca SEMUA user login
-- (using (true)) dan dikomentari/dislike siapa saja yang tahu id-nya,
-- padahal postingannya "Teman saja". Sekarang SELECT + INSERT keduanya
-- mengikuti aturan visibility postingan induk (publik / pemilik / teman).
-- DELETE/UPDATE tidak berubah (hanya milik sendiri).

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

