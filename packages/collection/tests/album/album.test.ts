import type { CardId } from '@world-legends/cards';
import { describe, expect, it } from 'vitest';
import {
  completionPercent,
  createAlbumProgress,
  createCollectionSetDefinition,
  isAlbumComplete,
  recordCardAcquired,
} from '../../src/album/album';
import type { ProfileId } from '../../src/user-card/user-card';

const pid = 'profile-001' as ProfileId;
const cid = (s: string) => s as CardId;

function makeSet(cardIds: string[]) {
  return createCollectionSetDefinition({
    id: 'set-copa-70',
    name: 'Copa 1970',
    description: 'Lendas do Brasil tricampeão',
    requiredCards: cardIds.map(cid),
    reward: { fragments: 500, credits: 1000 },
  });
}

describe('CollectionSetDefinition — invariantes (doc 17 §7)', () => {
  it('cria um set válido', () => {
    const result = makeSet(['card-pele', 'card-carlos-alberto', 'card-rivelino']);
    expect(result.ok).toBe(true);
  });

  it('rejeita set com requiredCards vazio', () => {
    const result = makeSet([]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.field).toBe('requiredCards');
  });

  it('rejeita set com CardIds duplicados', () => {
    const result = makeSet(['card-pele', 'card-pele']);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.field).toBe('requiredCards');
  });

  it('rejeita recompensa negativa', () => {
    const result = createCollectionSetDefinition({
      id: 'set-x',
      name: 'Teste',
      description: '',
      requiredCards: [cid('card-a')],
      reward: { fragments: -10, credits: 0 },
    });
    expect(result.ok).toBe(false);
  });

  it('requiredCards é imutável após criação (doc 17 §7)', () => {
    const result = makeSet(['card-a', 'card-b']);
    if (!result.ok) throw new Error();
    expect(Object.isFrozen(result.value.requiredCards)).toBe(true);
  });
});

describe('AlbumProgress — completude e idempotência (doc 17 §7)', () => {
  it('começa com completionPercent = 0', () => {
    const setResult = makeSet(['card-a', 'card-b', 'card-c']);
    if (!setResult.ok) throw new Error();
    const set = setResult.value;
    const progress = createAlbumProgress(pid, set);
    expect(completionPercent(progress, set)).toBe(0);
    expect(isAlbumComplete(progress)).toBe(false);
  });

  it('recordCardAcquired incrementa o progresso', () => {
    const setResult = makeSet(['card-a', 'card-b', 'card-c']);
    if (!setResult.ok) throw new Error();
    const set = setResult.value;
    let progress = createAlbumProgress(pid, set);

    const { progress: p1 } = recordCardAcquired(progress, set, cid('card-a'));
    progress = p1;
    expect(completionPercent(progress, set)).toBeGreaterThan(0);
    expect(completionPercent(progress, set)).toBeLessThan(1);
  });

  it('ignora cartas que não pertencem ao set', () => {
    const setResult = makeSet(['card-a', 'card-b']);
    if (!setResult.ok) throw new Error();
    const set = setResult.value;
    const progress = createAlbumProgress(pid, set);
    const { progress: p1 } = recordCardAcquired(progress, set, cid('card-x'));
    expect(completionPercent(p1, set)).toBe(0);
  });

  it('ignora carta já registrada (sem regressão de percent)', () => {
    const setResult = makeSet(['card-a', 'card-b']);
    if (!setResult.ok) throw new Error();
    const set = setResult.value;
    const progress = createAlbumProgress(pid, set);
    const { progress: p1 } = recordCardAcquired(progress, set, cid('card-a'));
    const { progress: p2 } = recordCardAcquired(p1, set, cid('card-a')); // duplicata
    expect(completionPercent(p2, set)).toBe(completionPercent(p1, set));
  });

  it('completa o álbum quando todas as cartas são registradas', () => {
    const setResult = makeSet(['card-a', 'card-b', 'card-c']);
    if (!setResult.ok) throw new Error();
    const set = setResult.value;
    let progress = createAlbumProgress(pid, set);
    let justCompleted = false;

    for (const c of ['card-a', 'card-b', 'card-c']) {
      const r = recordCardAcquired(progress, set, cid(c));
      progress = r.progress;
      justCompleted = r.justCompleted;
    }

    expect(completionPercent(progress, set)).toBe(1);
    expect(isAlbumComplete(progress)).toBe(true);
    expect(justCompleted).toBe(true);
    expect(progress.completedAt).not.toBeNull();
  });

  it('idempotência: adicionar carta após completar não dispara segundo justCompleted (doc 17 §7)', () => {
    const setResult = makeSet(['card-a', 'card-b']);
    if (!setResult.ok) throw new Error();
    const set = setResult.value;
    const progress = createAlbumProgress(pid, set);

    const { progress: p1, justCompleted: jc1 } = recordCardAcquired(progress, set, cid('card-a'));
    const { progress: p2, justCompleted: jc2 } = recordCardAcquired(p1, set, cid('card-b'));
    // Tenta registrar uma carta "extra" após completar — não existe mais carta, mas força o caminho
    const { justCompleted: jc3 } = recordCardAcquired(p2, set, cid('card-a'));

    expect(jc1).toBe(false);
    expect(jc2).toBe(true);
    expect(jc3).toBe(false); // já completado, idempotente
  });
});
