-- Storage buckets
insert into storage.buckets (id, name, public) values
  ('avatars',       'avatars',       true),
  ('card-artwork',  'card-artwork',   true),
  ('match-replays', 'match-replays',  false)
on conflict (id) do nothing;

-- Avatars: upload pelo próprio usuário, leitura pública
create policy "Avatars leitura pública"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Avatar upload próprio"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Avatar update próprio"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Card artwork: leitura pública, escrita só service_role
create policy "Card artwork leitura pública"
  on storage.objects for select
  using (bucket_id = 'card-artwork');

-- Match replays: acesso privado por usuário
create policy "Match replays acesso próprio"
  on storage.objects for all
  using (bucket_id = 'match-replays' and auth.uid()::text = (storage.foldername(name))[1]);
