# WORLD LEGENDS — GEMINI NANO BANANA IMAGE PROVIDER

**Version:** 1.0 (Sprint 43B)
**Status:** Implemented and tested; Gemini adapter never exercised against the real API (no credential exists in this environment, `ASSET_STUDIO_GEMINI_ENABLED=false` by default)
**Owner:** Creative Direction / Art Systems
**Project Owner:** Felipe Ameno
**Derived from:** `06-asset-studio-architecture.md` (the job/attempt/candidate workflow this provider plugs into); `05-artwork-schema-v2.md` (the artwork contract every prompt enforces)
**Language:** Portuguese
**Last updated:** 2026-07-14

---

## 0. Escopo

Este documento descreve a integração real de geração de imagem do Asset Studio, adicionada na Sprint 43B sobre a fundação da Sprint 43A (`06-asset-studio-architecture.md`). Cobre: a abstração de provedor, segurança server-only, variáveis de ambiente, o ciclo de vida de uma requisição de geração, snapshots de prompt/reference, storage de staging, estratégia de retry, classificação de erros, idempotência/concorrência, o provedor fake de desenvolvimento, observabilidade, considerações de custo, a política explícita de não-publicação, e o procedimento de rotação de chave.

**Não-objetivos desta sprint** (ver também `06-asset-studio-architecture.md` §11): Batch API, validação visual automática via IA, OCR, aprovação/publicação automática, promoção pra `source/artworks`, `cards:build` automático, APIs de dados de futebol.

## 1. Abstração de provedor

`lib/asset-studio/image-provider.ts` define o único contrato que o resto do Asset Studio conhece:

```ts
type GenerateArtworkRequest = {
  jobId: string;
  attemptId: string;
  prompt: string;
  requestedVariants: number;
  referenceImages: ProviderReferenceImage[];
  artworkSchemaVersion: 2;
  output: { aspectRatio: '2:3'; mimeType: 'image/png' };
};

type GeneratedArtworkCandidate = {
  variantIndex: number;
  bytes: Uint8Array;
  mimeType: string;
  providerMetadata: Record<string, unknown>;
};

interface ImageGenerationProvider {
  readonly name: string;
  generate(request: GenerateArtworkRequest, signal?: AbortSignal): Promise<GeneratedArtworkCandidate[]>;
}
```

Duas implementações:
- **`providers/fake-image-provider.ts`** — determinística, sem custo, sem rede (ver §9).
- **`providers/gemini-image-provider.ts`** — adapter REST real sobre a Gemini API (ver §2).

Nenhum tipo específico do Gemini (`GeminiGenerateContentResponse`, `inlineData`, `responseModalities`, etc.) escapa do segundo arquivo — provado por teste de fronteira (`tests/lib/asset-studio-gemini-boundaries.test.ts`, cenário 80).

## 2. Implementação Gemini — REST direto, sem SDK novo

Discovery desta sprint confirmou: nenhum SDK do Google (`@google/generative-ai`, `@google/genai`) já existia no projeto, e nenhum client HTTP genérico reutilizável existia pra chamadas externas. Seguindo a instrução do brief de "menor superfície de dependência estável", o adapter usa `fetch` nativo direto contra `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`, com a chave enviada exclusivamente no header `x-goog-api-key` (nunca no corpo, nunca na URL, nunca logada).

O request envia o prompt final (texto) mais cada imagem de referência resolvida como `inlineData` (base64), e pede `responseModalities: ['IMAGE']` com `candidateCount` igual ao número de variantes pedidas. A resposta é convertida pra `GeneratedArtworkCandidate[]` — um candidate individual bloqueado por segurança (`finishReason === 'SAFETY'`) é omitido sem derrubar os outros; um `promptFeedback.blockReason` no nível do request inteiro lança `ProviderError('provider-safety-block', ..., false)`.

**Limitação honesta:** este adapter nunca foi exercitado contra a API real — nenhuma credencial existe neste ambiente. Os testes (`tests/lib/asset-studio-gemini-provider.test.ts`) mockam `fetch` pra validar o contrato de request/response, a classificação de erro por status HTTP, e que a chave nunca vaza — mas não substituem um teste de integração real contra a API, que fica pra quando uma chave de projeto for provisionada.

## 3. Segurança — credencial nunca sai do server

| Env var | Onde é lida | Nunca aparece em |
|---|---|---|
| `GEMINI_API_KEY` | Só `lib/asset-studio/provider-config.ts` | `NEXT_PUBLIC_*`, Client Components, retorno de server action, snapshot de attempt, log, git |
| `GEMINI_IMAGE_MODEL` | Só `lib/asset-studio/provider-config.ts` | idem (o nome do modelo em si é exibido na UI como rótulo seguro — não é segredo) |
| `ASSET_STUDIO_GEMINI_ENABLED` | Só `lib/asset-studio/provider-config.ts` | idem |
| `ASSET_STUDIO_IMAGE_PROVIDER` | Só `lib/asset-studio/provider-config.ts` | idem |

`provider-config.ts` é o **único** lugar do módulo que lê essas quatro variáveis — nem o orquestrador, nem a UI, nem o adapter Gemini leem `process.env` diretamente (o adapter recebe `apiKey`/`model` já resolvidos via construtor). Provado por teste de fronteira (cenário 81).

**Regras de fail-closed:**
- `ASSET_STUDIO_IMAGE_PROVIDER` ausente ou diferente de `"gemini"` → sempre usa o fake, mesmo com todas as outras vars setadas.
- Modo `"gemini"` sem `ASSET_STUDIO_GEMINI_ENABLED=true` → status `"disabled"`, `createImageProvider()` retorna `{ ok: false }`.
- Modo `"gemini"` habilitado mas sem `GEMINI_API_KEY` ou sem `GEMINI_IMAGE_MODEL` → status `"unavailable"`, `createImageProvider()` retorna `{ ok: false }`.
- **Nunca** existe um caminho onde `ASSET_STUDIO_IMAGE_PROVIDER=gemini` mal configurado cai silenciosamente pro fake — a produção sempre falha explicitamente nesse caso (cenário 51 do teste de `provider-config.ts`).

A UI (`/dev/asset-studio` e `/dev/asset-studio/[jobId]`) mostra só um indicador seguro — "Provider configured (nome · modelo)" / "Provider disabled" / "Provider unavailable" — nunca o valor da chave (`getProviderStatus()` nunca inclui a chave em nenhum campo do objeto retornado; provado pelo cenário 52).

## 4. Ciclo de vida de uma geração

`lib/asset-studio/generation-orchestrator.ts::generateJobAttempt(repo, storage, provider, jobId)`, chamado só por `generateAttemptAction` (autorização já checada pelo caller):

1. Carrega o job; precisa estar `queued` (senão falha sem tocar nada).
2. Resolve e valida o prompt template (existe, ativo, `schemaVersion` compatível).
3. Resolve e valida o reference set (existe, ativo, `schemaVersion`+`rarity` compatíveis).
4. Resolve os arquivos de referência do disco (`reference-resolution.ts`) — falha se algum arquivo obrigatório estiver ausente/ilegível.
5. Resolve o prompt final (`resolvePromptTemplateContent`) — falha se faltar algum placeholder obrigatório.
6. **Só a partir daqui existe risco de estado inconsistente** — reivindica o job atomicamente (`repo.claimJobForGenerating`, ver §7).
7. Cria o attempt (snapshot de prompt + reference já resolvidos, nunca recalculados depois).
8. Invoca `provider.generate(...)` sob `withTimeoutAndRetry` (§6).
9. Valida os bytes de cada variante retornada (`image-validation.ts`) — se qualquer uma for inválida, o attempt inteiro falha (§5).
10. Salva cada variante válida em staging (`storage.putObject`).
11. Persiste os candidates e transiciona o job `generating → generated → validating → needs_review` (reaproveitando `service.attachCandidates`, inalterado desde a Sprint 43A).

Qualquer falha depois do passo 6 marca o attempt `failed` e transiciona o job pra `failed` — nunca deixa um job preso em `generating`, nunca apaga o attempt anterior.

## 5. Validação de imagem — tudo-ou-nada

`lib/asset-studio/image-validation.ts::validateAndDeriveImageMetadata` roda em CADA variante antes de qualquer persistência: rejeita payload vazio, acima de 15MB, MIME diferente de `image/png`, assinatura de arquivo PNG ausente, ou imagem que o `sharp` não consegue decodificar. Width/height/checksum(SHA-256)/tamanho são sempre **derivados dos bytes reais** — a `providerMetadata` que o provedor afirma nunca é usada como fonte de verdade dessas propriedades.

Decisão explícita desta sprint: se **qualquer** variante de um attempt multi-variante falhar validação, o attempt inteiro é tratado como falho — nenhuma persistência parcial de candidates. Simplifica a semântica de retry (uma nova tentativa sempre gera um attempt limpo) às custas de descartar variantes boas junto com a ruim; aceitável dado que retries são baratos com o fake provider e o volume esperado é baixo.

## 6. Timeout e retry

`lib/asset-studio/retry.ts::withTimeoutAndRetry` — timeout de 45s por chamada (`AbortController`), até 2 retries com backoff exponencial + jitter (base 500ms, teto 4000ms). Só re-tenta erros marcados `retryable` no `ProviderError`:

| Código | Retryable? |
|---|---|
| `provider-authentication` | Não |
| `provider-rate-limit` | Sim |
| `provider-timeout` | Sim |
| `provider-safety-block` | Não |
| `provider-invalid-response` | Depende (5xx do provedor: sim; 4xx/prompt inválido: não) |
| `storage-failure` | Não (erro de infraestrutura própria, não do provedor) |
| `configuration-error` | Não (nunca chega a invocar o provedor) |
| `internal-error` | Não (qualquer erro não classificado — nunca re-tenta algo desconhecido indefinidamente) |

## 7. Idempotência e concorrência

- **Duas gerações concorrentes pro mesmo job:** `repo.claimJobForGenerating(jobId)` faz um `UPDATE ... WHERE status = 'queued'` condicional (Supabase) / check-then-set síncrono (in-memory) — só uma chamada consegue reivindicar; a outra recebe `{ ok: false }` sem criar attempt/candidate nenhum. Testado (cenário 74) com duas chamadas concorrentes reais via `Promise.all`.
- **Retry após falha:** sempre cria um **novo** attempt (`attempt_number` incrementado) — o attempt falho anterior nunca é sobrescrito, permanece no histórico pra sempre (cenário 76).
- **`attempt_number` único por job / `variant_index` único por attempt:** garantido pelas constraints já existentes desde a Sprint 43A (`unique(job_id, attempt_number)`, `unique(attempt_id, variant_index)`).

## 8. Storage de staging

Bucket privado `asset-studio` (`supabase/migrations/20260714211734_asset_studio_storage_bucket.sql`, sem policy pra `anon`/`authenticated` — só `service_role`). Caminho determinístico: `asset-studio/candidates/<jobId>/<attemptId>/<variantIndex>.png` (`storage-paths.ts::buildCandidateStoragePath`, inalterado desde a Sprint 43A). **Nunca** escreve em `apps/web/public/assets/cards/source/artworks`; nenhum script `cards:build`/`cards:validate` referencia qualquer tabela do Asset Studio.

Miniaturas são servidas pra UI via `getCandidateImageDataUrlAction` — um data URL (`data:image/png;base64,...`) montado no server a partir do `storagePath` já persistido, nunca uma URL pública/assinada nova.

## 9. Provedor fake — desenvolvimento local e todo teste

`ASSET_STUDIO_IMAGE_PROVIDER=fake` (padrão quando ausente) usa `FakeImageProvider`: gera PNGs reais e válidos via `sharp` (mesma lib do pipeline de cards), uma cor sólida distinta por `variantIndex`, sempre com `providerMetadata.fixture = true`. **Todo teste automatizado usa exclusivamente este provedor** — nenhum teste toca a API real do Gemini nem faz uma chamada de rede real. Produção configurada pra `gemini` nunca cai silenciosamente pro fake (§3).

## 10. Observabilidade

`generation-orchestrator.ts` persiste em `asset_generation_attempts.usage_metadata`: `provider`, `model`, a `providerMetadata` de cada variante, e `durationMs` — nunca a chave de API, headers de autorização, os bytes completos da imagem, ou a resposta bruta completa do provedor. Custo (`estimated_cost`/`actual_cost`) é uma coluna já existente desde a Sprint 43A, disponível pra um provedor preencher no futuro se a API do Gemini expuser uso/custo por chamada — nenhum valor é inventado nesta sprint.

## 11. Custo

O fake provider tem custo zero (sem rede, sem chamada de API). O provedor Gemini real, quando habilitado, tem custo por variante gerada — nenhuma automação desta sprint (sem batch, sem retry infinito, sem geração automática de jobs) dispara chamadas sem uma ação humana explícita (clique em Generate na UI). O limite de 2 retries com timeout de 45s por tentativa bound o custo máximo de uma única chamada de geração.

## 12. Política de não-publicação (explícita)

Nenhum candidate gerado por este provedor é aprovado ou publicado automaticamente — `attachCandidates` sempre deixa o job em `needs_review`; aprovação (`approveCandidate`) e publicação (`markJobPublished`) continuam exigindo ação humana explícita via UI, exatamente como na Sprint 43A. Nenhum artwork de produção (`public/assets/cards/`) é alterado por este provedor.

## 13. Rotação de chave

1. Gerar uma nova chave em [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (projeto Google Cloud correto).
2. Atualizar `GEMINI_API_KEY` nas variáveis de ambiente do Vercel (Production/Preview conforme aplicável) — nunca commitar a chave em nenhum arquivo do repositório.
3. Revogar a chave antiga no Google AI Studio depois de confirmar que o novo deploy está saudável (`getProviderStatus()` retornando `"configured"`).
4. Nenhum attempt/job/candidate existente referencia a chave diretamente (ela nunca é persistida) — a rotação não exige nenhuma migração ou reprocessamento de dados.
