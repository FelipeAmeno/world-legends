# WORLD LEGENDS — ASSET CANDIDATE VALIDATION AND HUMAN APPROVAL

**Version:** 1.0 (Sprint 43C)
**Status:** Implemented and tested against the fake provider; Gemini real-QA is paused (see §8)
**Owner:** Creative Direction / Art Systems
**Project Owner:** Felipe Ameno
**Derived from:** `06-asset-studio-architecture.md` (job/attempt/candidate/review foundation), `07-gemini-image-provider.md` (generation), `05-artwork-schema-v2.md` (the artwork contract validated against)
**Language:** Portuguese
**Last updated:** 2026-07-16

---

## 0. Escopo

Este documento descreve a validação técnica e o fluxo de revisão humana de candidates do Asset Studio, adicionados na Sprint 43C sobre a fundação da Sprint 43A e a geração real da Sprint 43B/43B.1. Cobre: o pipeline de validação técnica determinístico, o contrato de validação visual (interface, sem implementação de IA), as regras do fluxo de revisão, a fronteira de publicação, e a UI.

**Não-objetivos desta sprint**: chamada real ao Gemini (Vision ou geração), OCR obrigatório, geração em lote, publicação real em `source/artworks`, execução de `cards:build`, aprovação automática de qualquer candidate.

## 1. Discovery — o que já existia

Auditoria antes de implementar (Sprint 43A/43B já tinham construído a maior parte da fundação):

- **Candidate records**: `asset_candidates` já tem `technical_validation`/`visual_validation` (jsonb), `checksum`, `perceptual_hash`, `review_status` — todos existentes desde a Sprint 43A, mas `technicalValidation`/`visualValidation` sempre `{}` (nunca um resultado tipado real) e `perceptualHash` sempre `null`.
- **Review actions**: `approveCandidate`/`rejectCandidate`/`requestRevision` já existiam (Sprint 43A), com reviews append-only via `submitReview`. Faltava: exigir validação técnica bem-sucedida pra aprovar, validar issue codes contra um vocabulário fechado, exigir notas/issue-codes pra pedir revisão, e checar elegibilidade de revisão **no servidor** (só existia na UI, Sprint 43B fix).
- **Publish action**: `markJobPublished` já só marca status + timestamp — nunca tocou arquivo, nunca chamou `cards:build`/git/deploy. Confirmado por auditoria de código e teste — não precisou de mudança de comportamento, só de rótulo mais claro na UI.
- **UI**: já mostrava thumbnail, `reviewStatus`, histórico de reviews (decisão + notas) — faltava dimensões/formato/tamanho/checksum, status de validação técnica, warnings/errors, issue codes, e um jeito de coletar notas/issue-codes ao rejeitar/pedir revisão (antes, esses parâmetros eram sempre `null`/`[]` fixos vindos da UI).

Nenhum mismatch estrutural sério foi encontrado — a fundação das Sprints 43A/43B já suportava tudo isso; era uma questão de completar a lógica de negócio e a UI, não de redesenhar schema.

## 2. Validação técnica (`lib/asset-studio/technical-validation.ts`)

Determinístico, sem IA, sem rede, **re-executável a qualquer momento** (botão "Rodar validação técnica" na UI — nunca só no momento da geração). Reusa `image-validation.ts` (Sprint 43B) como primeira camada (payload vazio/oversized/MIME/assinatura PNG/decodificação real via `sharp`) e estende com:

| Checagem | Severidade |
|---|---|
| Caminho de staging (`asset-studio/` prefix) | Erro (checado ANTES de qualquer leitura de bytes) |
| Bytes válidos (MIME/assinatura/decodificação) | Erro |
| Orientação vertical (altura > largura) | Erro |
| Proporção 2:3 (tolerância ±0.05) | Aviso, se vertical mas fora da tolerância |
| Resolução abaixo do mínimo absoluto (200×300) | Erro |
| Resolução abaixo do recomendado (800×1200) mas acima do mínimo | Aviso — **o fixture do fake provider (400×600) cai aqui de propósito**, pra QA poder exercitar o caminho de aviso sem precisar de imagem real |
| `artworkSchemaVersion !== 2` | Erro |
| Checksum duplicado (outro candidate com bytes idênticos) | Aviso |
| Prompt sem menção de "safe zone" | Aviso (heurística de texto, Schema V2 §3) |
| Prompt menciona vocabulário de stat-box legado (V1) | Aviso (heurística de texto, Schema V2 §3) |

Resultado persistido em `technicalValidation`:

```ts
type TechnicalValidationResult = {
  passed: boolean;
  warnings: string[];
  errors: string[];
  validatedAt: string;
  validatorVersion: string;
};
```

`passed` é `false` se e só se `errors.length > 0` — avisos nunca bloqueiam. Um perceptual hash (average-hash de 8×8 via `sharp`, sem IA) é computado e persistido junto — real, determinístico, mas não robusto a crop/rotação (documentado como limitação honesta).

## 3. Contrato de validação visual (`lib/asset-studio/visual-validation.ts`)

Interface pra uma futura validação visual automatizada (composição, texto legível, identidade do jogador) — nenhuma implementação real existe nesta sprint. `FakeVisualValidator` é o único validador usado (sempre `passed: true`, nota deixando claro que é fixture). O vocabulário de issue codes que um humano atribui manualmente é fechado:

```
readable-text, stat-boxes, logo-or-sponsor, watermark, incomplete-frame,
player-identity-problem, upper-left-zone-blocked, lower-identity-zone-blocked,
incorrect-aspect-ratio, low-resolution, malformed-image, duplicate-artwork, other
```

`rejectCandidate`/`requestRevision` validam qualquer `issueCodes[]` recebido contra este vocabulário — um código desconhecido falha a chamada inteira antes de qualquer mutação.

## 4. Fluxo de revisão

Estados de candidate: `pending → approved | rejected | needs_revision`.

- **Elegibilidade de revisão** (`ui-eligibility.ts::canReviewCandidate`, reusada tanto pela UI quanto pelo servidor): só um candidate `pending` OU `needs_revision` com o job em `needs_review` pode ser aprovado/rejeitado/receber pedido de revisão. Checado **duas vezes** — na UI (esconde os botões) e no servidor (`service.ts::assertReviewEligible`, chamado por `approveCandidate`/`rejectCandidate`/`requestRevision`) — esconder um botão nunca é a garantia real.
- **Aprovar exige validação técnica bem-sucedida**: `approveCandidate` falha explicitamente se `candidate.technicalValidation.passed !== true`. Rodar a validação e reprovar (erros presentes) também bloqueia a aprovação até uma nova geração.
- **Rejeitar preserva a imagem**: nunca deleta bytes do storage, só marca `reviewStatus: 'rejected'` + review append-only.
- **Pedir revisão exige notas OU issue codes**: nunca uma revisão "muda sem dizer o quê".
- **Reviews são append-only**: nenhuma review é editada/apagada — `submitReview` sempre insere uma nova linha.
- **Um candidate aprovado por vez, substituição sempre explícita**: `approvedCandidateId` é um campo único no job; a máquina de estados (`status-transitions.ts`) só permite `needs_review → approved` — depois de aprovado, uma segunda aprovação (do mesmo ou outro candidate) exigiria primeiro `approved → queued` (via pedido de revisão) e uma nova geração, nunca uma segunda chamada direta a `approveCandidate`. Isso não precisou de código novo — já era garantido pela máquina de estados da Sprint 43A; só precisava de um teste provando.

## 5. Fronteira de publicação

`markJobPublished` continua **só** marcando `status: 'published'` + `completedAt` no banco — auditado de novo nesta sprint, confirmado que nunca escreve arquivo, nunca roda `cards:build`, nunca executa Git, nunca faz deploy. A UI agora rotula o botão explicitamente como **"placeholder de status — não publica de verdade"**, com um `title` explicando que o jogo não vê nenhuma mudança — evita a impressão de que marcar published no Asset Studio publica arte de verdade no jogo. A promoção real pra `source/artworks` continua uma sprint futura, inteiramente manual.

## 6. UI (`/dev/asset-studio/[jobId]`)

Cada `CandidateCard` agora mostra: thumbnail (já existia), dimensões, formato, tamanho, prévia do checksum, status de validação técnica (`não rodada` / `tecnicamente válido` / `válido com avisos` / `falhou`, cor-codificado), lista de erros/avisos, botão "Rodar validação técnica" (sempre disponível, não é uma transição de estado — só recomputa e persiste), botões Aprovar/Rejeitar/Revisão (só quando elegível), um formulário inline de notas + checkboxes de issue code ao rejeitar/pedir revisão, e o histórico de reviews com issue codes. Múltiplas variantes já ficam lado a lado na mesma grade — usado como o mecanismo de "comparação visual" desta sprint (nenhum modal dedicado foi construído, decisão deliberada de escopo).

## 7. Testes

38 novos testes (`asset-studio-technical-validation.test.ts`, `asset-studio-visual-validation.test.ts`, `asset-studio-review-workflow.test.ts`, mais ajustes em `asset-studio-service.test.ts`/`asset-studio-ui-eligibility.test.ts`) — nenhum toca Gemini, todos usam `FakeImageProvider`/`InMemoryAssetStudioRepository`/`InMemoryAssetStudioStorage`. Suite completa: 626/626.

## 8. Status do QA real do Gemini (bloqueio externo, não desta sprint)

Real Gemini generation QA is paused because the current Google project cannot enable billing/image quota. Implementation remains ready for retesting with a future Google project. Nada da Sprint 43B/43B.1 foi revertido — o provedor, os diagnósticos, a migration do bucket, os testes e a documentação continuam intactos. Batch Generation (Sprint 43D) fica deferida até o QA real do provedor suceder com um projeto Google novo.
