# ✅ Checklist de Publicação — World Legends Beta

Execute este checklist antes de publicar.
Marque cada item com `[x]` ao concluir.

---

## 1. Configuração

- [ ] `.env.production` preenchido com valores reais
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Supabase URL e Anon Key válidos
- [ ] Schema SQL executado no Supabase (`supabase-schema.sql`)
- [ ] RLS habilitado em todas as tabelas (`supabase.com → Auth → Policies`)
- [ ] Auth providers configurados (Google e/ou Apple)
- [ ] Redirect URLs configuradas no Supabase (`/auth/callback`)
- [ ] `NEXT_PUBLIC_APP_URL` apontando para o domínio real

## 2. Build

```bash
# Executar e verificar se passa sem erros:
cd apps/web
pnpm type-check          # zero erros TypeScript
pnpm lint                # zero erros ESLint
pnpm build               # build completo
```

- [ ] `pnpm type-check` passa sem erros
- [ ] `pnpm build` completo sem erros
- [ ] Bundle size JS < 500KB (verificar com `ANALYZE=true pnpm build`)
- [ ] Nenhum `console.log` em produção (ver compiler config)

## 3. PWA

- [ ] `manifest.json` válido (`/manifest.json` retorna 200)
- [ ] Ícones PNG gerados em todos os tamanhos (72/96/128/144/152/192/384/512)
- [ ] `sw.js` registrado e funcionando (DevTools → Application → Service Workers)
- [ ] Instalável em Android (Chrome → "Adicionar à tela inicial")
- [ ] Instalável em iOS (Safari → Compartilhar → "Adicionar à Tela Inicial")
- [ ] Página `/offline` renderiza corretamente sem internet

## 4. Performance (Lighthouse)

```bash
# Rodar Lighthouse em produção:
npx lighthouse https://worldlegends.app --chrome-flags="--headless"
```

- [ ] Performance ≥ 90
- [ ] Acessibilidade ≥ 90
- [ ] Melhores Práticas ≥ 95
- [ ] SEO ≥ 95
- [ ] PWA: todas as categorias verdes
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] FCP < 1.8s

## 5. SEO

- [ ] `robots.txt` acessível em `/robots.txt`
- [ ] `sitemap.xml` acessível em `/sitemap.xml`
- [ ] Título e descrição em todas as rotas públicas
- [ ] OpenGraph tags (`og:title`, `og:description`)
- [ ] `theme-color` no manifest e meta tag

## 6. Segurança

- [ ] Headers de segurança presentes:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security` (HTTPS)
  - `Referrer-Policy`
- [ ] HTTPS funcionando (Vercel automático)
- [ ] API keys não expostas no bundle cliente
- [ ] RLS no Supabase: usuário só acessa seus dados
- [ ] Source maps não expostos publicamente (Sentry only)

## 7. Auth

- [ ] Login com Google funciona (redirect + callback)
- [ ] Login com Email funciona
- [ ] Magic Link funciona
- [ ] Logout limpa sessão e redireciona
- [ ] Middleware redireciona rotas protegidas para `/login`
- [ ] `/auth/callback` processa código OAuth corretamente

## 8. Persistência

- [ ] Criar conta → perfil criado via trigger Supabase
- [ ] Jogar partida → `match_history` salvo
- [ ] Abrir pack → `pack_openings` salvo + `owned_cards` atualizado
- [ ] Salvar squad → `squads` salvo
- [ ] Cloud Save: mudanças aparecem em outra sessão/dispositivo
- [ ] Modo offline: fila persiste em `localStorage`
- [ ] Volta online: fila é processada automaticamente

## 9. Analytics

- [ ] PostHog inicializando (ver `posthog.config.js` no console dev)
- [ ] `session_started` sendo enviado
- [ ] `onboarding_started` ao entrar pela primeira vez
- [ ] Events chegando no dashboard PostHog

## 10. Crash Reports

- [ ] Sentry inicializando (sem erros no console)
- [ ] Erro de teste chega no Sentry:
  ```javascript
  // No console do browser em produção:
  import('@/lib/crash/sentry').then(m => m.crash.captureMessage('Teste T070'))
  ```
- [ ] Source maps funcionando (stack traces legíveis no Sentry)
- [ ] `global-error.tsx` funcionando (testar com erro forçado)

## 11. Notificações

- [ ] Toast aparece para notificações de alta prioridade
- [ ] Badge mostra contagem correta
- [ ] Gaveta abre/fecha corretamente
- [ ] "Marcar todas como lidas" funciona
- [ ] Notificações persistem após refresh (localStorage)

## 12. Content & UX

- [ ] Fluxo completo: onboarding → coleção → squad → partida → recompensas
- [ ] Pack opening: animação completa + GOAT reveal (testar)
- [ ] Partida: todos os 6 fases (SELECT→PRE→LIVE→HT→RESULT)
- [ ] Missões: claim de missão diária funciona
- [ ] Ranking: tabs funcionando + usuário visível no bottom
- [ ] Eventos: countdown correto + requisitos verificados

## 13. Deploy Final

```bash
# Build e deploy:
vercel --prod

# Verificar URL de produção:
curl -I https://worldlegends.app
# → HTTP/2 200

# Verificar headers de segurança:
curl -I https://worldlegends.app | grep -E "x-frame|x-content|strict-transport"
```

- [ ] Deploy para produção concluído
- [ ] URL de produção acessível publicamente
- [ ] DNS configurado corretamente (sem redirect loops)
- [ ] SSL certificado válido (HTTPS)
- [ ] CDN funcionando (assets em `cdn.worldlegends.app` ou `/_next/static/`)

---

## 📊 Métricas de Sucesso da Beta

Monitorar no PostHog nas primeiras 48h:

| Métrica | Meta Beta |
|---|---|
| DAU | > 50 usuários/dia |
| Taxa de conclusão onboarding | > 80% |
| Partidas por sessão | > 2 |
| Packs abertos por usuário/dia | > 1 |
| Crash rate | < 1% das sessões |
| LCP mediano | < 2s |

---

*Versão do checklist: T070 · World Legends Beta*
