-- Sprint 43B — Gemini Nano Banana Image Provider
--
-- Bucket de STAGING pros candidates gerados pelo Asset Studio — nunca
-- público, nunca acessível por anon/authenticated (mesmo padrão de RLS
-- sem policy das tabelas asset_* da Sprint 43A: só o client service_role,
-- via getServiceDb(), lê/escreve). Path determinístico por
-- job/attempt/variant (ver lib/asset-studio/storage-paths.ts), nunca por
-- nome de jogador.
--
-- Publicar um candidate aprovado em
-- public/assets/cards/source/artworks continua sendo um passo humano
-- separado, fora do Supabase Storage — este bucket nunca é lido pelo
-- pipeline de cards (scripts/cards/*.mts).

insert into storage.buckets (id, name, public)
values ('asset-studio', 'asset-studio', false)
on conflict (id) do nothing;

-- Nenhuma policy de storage.objects criada pra 'asset-studio' — sem
-- policy pra anon/authenticated significa acesso negado por padrão pra
-- esses roles; só service_role (que bypassa RLS) lê/escreve.
