-- HUMBA: perbaikan keamanan RLS v1.2 (+ dinding)
-- Jalankan di Supabase SQL Editor (satu kali).
-- Aman di-run ulang; tidak ada DROP TABLE dan tidak menghapus data.
-- Menggabungkan: perbaikan RLS v1.2 (column grant) + dinding teman saja.
-- 1) Teman: hanya PENERIMA permintaan yang boleh menerimanya,
--    dan hanya mengubah kolom status dari 'pending' ke 'accepted'.
--    (Sebelumnya pengirim juga boleh update, sehingga bisa
--    menerima permintaannya sendiri lewat API.)
--    Column grant memastikan kolom lain (requester_id, addressee_id)
--    tidak bisa diubah lewat update.
-- 2) Pesan: penerima boleh menandai pesan sebagai sudah dibaca
--    (kolom read_at saja). Sebelumnya tidak ada policy UPDATE,
--    sehingga update read_at diam-diam gagal dan badge pesan
--    belum dibaca tidak pernah hilang.
-- 3) Dinding: hanya teman (atau diri sendiri) yang boleh menulis
--    di dinding orang lain. Sebelumnya siapa pun bisa lewat API.

drop policy if exists "humba_friends_update" on public.humba_friends;
create policy "humba_friends_update" on public.humba_friends
  for update to authenticated
  using (addressee_id = auth.uid() and status = 'pending')
  with check (addressee_id = auth.uid() and status = 'accepted');
revoke update on public.humba_friends from authenticated;
grant update (status) on public.humba_friends to authenticated;

drop policy if exists "humba_messages_update_recipient" on public.humba_messages;
create policy "humba_messages_update_recipient" on public.humba_messages
  for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());
revoke update on public.humba_messages from authenticated;
grant update (read_at) on public.humba_messages to authenticated;

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
