import { describe, expect, it } from 'vitest';
// Teste de fumaça da Tarefa T001. Como `types` nunca contém lógica
// (docs/18-monorepo-architecture-master.md, §16), os testes futuros deste
// package são, em sua maioria, verificações de forma/compilação, não ciclos
// comportamentais Red-Green (docs/19-implementation-strategy-master.md, §12).
describe('bootstrap: packages/types', () => {
    it('está corretamente conectado ao pipeline de testes', () => {
        expect(true).toBe(true);
    });
});
//# sourceMappingURL=index.test.js.map