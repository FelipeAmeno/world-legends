import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

describe('Sprint 43B — ação "criar draft job" na lista (regressão 2026-07-15: confirmar visibilidade)', () => {
  it('92. o botão "+ Criar draft job" existe e é renderizado incondicionalmente (nenhum gate de elegibilidade)', () => {
    const src = readSource('components/dev/asset-studio/AssetStudioExperience.tsx');
    expect(src).toContain('+ Criar draft job');
    // O botão fica no MESMO bloco incondicional do filtro de status (nunca
    // dentro de um `{condição && (...)}`) — confirma que não há gate.
    const filterBlockStart = src.indexOf('<div className="flex items-center gap-3 flex-wrap">');
    const buttonIndex = src.indexOf('+ Criar draft job');
    const formBlockStart = src.indexOf('{formOpen && (');
    expect(filterBlockStart).toBeGreaterThan(-1);
    expect(buttonIndex).toBeGreaterThan(filterBlockStart);
    expect(buttonIndex).toBeLessThan(formBlockStart);
  });

  it('93. o botão de criar draft fica ANTES do bloco de lista/estado-vazio — visível mesmo com jobs existentes', () => {
    const src = readSource('components/dev/asset-studio/AssetStudioExperience.tsx');
    const buttonIndex = src.indexOf('+ Criar draft job');
    const emptyStateIndex = src.indexOf('Nenhum job encontrado');
    const listMapIndex = src.indexOf('{filtered.map((job) =>');
    expect(buttonIndex).toBeLessThan(emptyStateIndex);
    expect(buttonIndex).toBeLessThan(listMapIndex);
    // O botão não está dentro do `{filtered.length === 0 && (...)}` nem do
    // `.map` da lista — são blocos JSX totalmente separados e posteriores.
    expect(src.indexOf('{filtered.length === 0 &&')).toBeGreaterThan(buttonIndex);
  });

  it('94. usuário não autorizado nunca alcança <AssetStudioExperience> — a página retorna "Acesso negado" antes', () => {
    const src = readSource('app/dev/asset-studio/page.tsx');
    const authCheckIndex = src.indexOf('if (!auth.authorized)');
    const acessoNegadoIndex = src.indexOf('Acesso negado');
    const experienceRenderIndex = src.indexOf('<AssetStudioExperience');
    expect(authCheckIndex).toBeGreaterThan(-1);
    expect(authCheckIndex).toBeLessThan(acessoNegadoIndex);
    expect(acessoNegadoIndex).toBeLessThan(experienceRenderIndex);
  });

  it('95. criar/abrir o formulário de draft job nunca chama o orquestrador de geração ou o adapter Gemini', () => {
    const src = readSource('components/dev/asset-studio/AssetStudioExperience.tsx');
    expect(src).not.toContain('generateAttemptAction');
    expect(src).not.toContain('generation-orchestrator');
    expect(src).not.toContain('gemini-image-provider');
    // `handleCreate` só chama `createDraftJobAction` — nunca gera nada.
    const handleCreateBody = src.slice(
      src.indexOf('async function handleCreate'),
      src.indexOf('return (', src.indexOf('async function handleCreate')),
    );
    expect(handleCreateBody).toContain('createDraftJobAction');
    expect(handleCreateBody).not.toContain('generate');
  });

  it('createDraftJobAction (server action) exige autorização antes de criar o job, igual toda outra ação', () => {
    const src = readSource('lib/actions/asset-studio.ts');
    const fnBody = src.slice(
      src.indexOf('export async function createDraftJobAction'),
      src.indexOf('export async function updateDraftJobAction'),
    );
    expect(fnBody.indexOf('authorizeOrFail()')).toBeLessThan(fnBody.indexOf('service.createJob'));
  });
});
