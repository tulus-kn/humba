-- HUMBA: perbaikan keamanan (hasil review statis)
-- Jalankan di Supabase SQL Editor (satu kali).
-- 1) Teman: hanya penerima permintaan yang boleh menerima/menolak.
--    Sebelumnya pengirim bisa mengubah statusnya sendiri jadi 'accepted'.
-- 2) Pesan: penerima boleh menandai sudah dibaca (update read_at).
--    Sebelumnya tidak ada policy UPDATE, jadi badge pesan belum dibaca
--    tidak pernah hilang di mode cloud. Trigger membatasi update
--    hanya ke read_at (isi/pengirim/penerima tidak bisa diubah).
-- 3) Dinding: hanya teman (atau diri sendiri) yang boleh menulis
--    di dinding orang lain. Sebelumnya siapa pun bisa lewat API.

drop policy if exists "humba_friends_update" on public.humba_friends;
create policy "humba_friends_update" on public.humba_friends
  for update to authenticated
  using (addressee_id = auth.uid())
  with check (addressee_id = auth.uid() and status in ('accepted', 'rejected'));

drop policy if exists "humba_messages_update_recipient" on public.humba_messages;
create policy "humba_messages_update_recipient" on public.humba_messages
  for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());
create or replace function public.humba_messages_hanya_read_at()
returns trigger language plpgsql as $$
begin
  if new.sender_id is distinct from old.sender_id
    or new.recipient_id is distinct from old.recipient_id
    or new.body is distinct from old.body
    or new.created_at is distinct from old.created_at then
    raise exception 'Hanya read_at yang boleh diubah.';
  end if;
  return new;
end;
$$;
drop trigger if exists humba_messages_hanya_read_at_trg on public.humba_messages;
create trigger humba_messages_hanya_read_at_trg
  before update on public.humba_messages
  for each row execute function public.humba_messages_hanya_read_at();

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
