# 🚀 Guia de Deploy — World Legends

## Opção 1: Vercel (Recomendado)

### Pré-requisitos
- Conta [Vercel](https://vercel.com)
- Conta [Supabase](https://supabase.com) (opcional)
- Conta [PostHog](https://posthog.com) (opcional)
- Conta [Sentry](https://sentry.io) (opcional)

---

### Passo 1: Banco de Dados (Supabase)

```bash
# 1. Criar projeto em supabase.com
# 2. Copiar: Project URL e Anon Key
# 3. Abrir SQL Editor e executar:
cat packages/persistence/src/schema/supabase-schema.sql
# Cole e execute no SQL Editor

# 4. Habilitar Auth Providers:
#    Authentication → Providers → Google (Client ID + Secret do GCP)
#    Authentication → Providers → Apple (Service ID + Key)
#    Authentication → URL Configuration:
#      Site URL: https://SEU_DOMINIO.com
#      Redirect URLs: https://SEU_DOMINIO.com/auth/callback
```

---

### Passo 2: Deploy na Vercel

```bash
# Via CLI:
npm i -g vercel
vercel login
vercel --prod

# Ou via GitHub:
# 1. Push para GitHub
# 2. vercel.com → Import Project
# 3. Framework: Next.js (auto-detectado)
# 4. Root Directory: . (raiz do monorepo)
# 5. Build Command: cd apps/web && pnpm build
# 6. Output Directory: apps/web/.next
```

---

### Passo 3: Variáveis de Ambiente na Vercel

No painel Vercel → **Project Settings → Environment Variables**:

```
NEXT_PUBLIC_APP_URL         = https://worldlegends.app
NEXT_PUBLIC_SUPABASE_URL    = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
NEXT_PUBLIC_POSTHOG_KEY     = phc_xxx
NEXT_PUBLIC_SENTRY_DSN      = https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN           = sntrys_xxx
SENTRY_ORG                  = world-legends
SENTRY_PROJECT              = world-legends-web
```

---

### Passo 4: Domínio Personalizado

```
Vercel Dashboard → Domains → Add Domain
↓
worldlegends.app (ou seu domínio)
↓
Adicionar DNS records conforme instruções da Vercel
```

---

### Passo 5: Gerar Ícones PWA

```bash
# Instalar sharp-cli
pnpm add -g sharp-cli

# Gerar todos os tamanhos a partir do SVG
for size in 72 96 128 144 152 192 384 512; do
  npx sharp-cli -i apps/web/public/icons/icon.svg \
    -o apps/web/public/icons/icon-${size}.png \
    resize $size $size
done

# Splash screen iOS (1x, 2x, 3x)
npx sharp-cli -i apps/web/public/icons/splash.svg \
  -o apps/web/public/icons/splash-390x844.png \
  resize 390 844
```

---

### Verificação pós-deploy

```bash
# Lighthouse
npx lighthouse https://worldlegends.app \
  --output=json \
  --chrome-flags="--headless"

# Service Worker
curl -I https://worldlegends.app/sw.js
# → Cache-Control: public, max-age=0

# Manifest
curl https://worldlegends.app/manifest.json | jq .name
# → "World Legends"

# Robots
curl https://worldlegends.app/robots.txt

# Sitemap
curl https://worldlegends.app/sitemap.xml
```

---

## Opção 2: Docker (Self-hosted)

```dockerfile
# Dockerfile (raiz do monorepo)
FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=base /app/apps/web/.next ./.next
COPY --from=base /app/apps/web/public ./public
COPY --from=base /app/apps/web/package.json ./package.json
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker build -t world-legends .
docker run -p 3000:3000 --env-file .env.production world-legends
```

---

## CI/CD com GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Rollback

```bash
# Via Vercel CLI
vercel rollback [DEPLOYMENT_URL]

# Via Dashboard
vercel.com → Deployments → Revert to previous
```
