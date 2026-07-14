# Reference Sets — Artwork Schema V2

Convenção de pastas para as referências visuais aprovadas de cada raridade do Artwork Schema V2 (ver `docs/design/05-artwork-schema-v2.md` e `lib/asset-studio/reference-set.ts`).

## Status atual

Nenhuma imagem de referência final existe ainda. As 6 entradas em `REFERENCE_SETS` (`lib/asset-studio/reference-set.ts`) são contratos — todas com `active: false` e `files: []`. Isso é esperado nesta sprint (42B): o objetivo é o *contrato*, não o conteúdo aprovado.

## Estrutura esperada (quando referências reais existirem)

```
lib/asset-studio/reference-sets/
├── README.md              (este arquivo)
├── common-v2/
├── rare-v2/
├── elite-v2/
├── legendary-v2/
├── goat-v2/
└── world-cup-hero-v2/
```

Cada pasta `<id>/` deve conter, quando aprovada:

- referências de estilo aprovadas;
- referência estrutural (frame + composição);
- máscara de safe zone (visualização das duas zonas obrigatórias: `upperLeftHudZone`, `lowerIdentityZone`);
- referência de material de raridade;
- referências de identidade do jogador (opcional, por preset específico).

## Regras

1. **Nunca commitar imagens de referência externas sem aprovação explícita** — nenhuma imagem com direitos autorais não aprovados deve entrar neste diretório.
2. Um reference set só pode virar `active: true` em `lib/asset-studio/reference-set.ts` depois que as referências reais forem aprovadas por decisão humana — nunca automaticamente.
3. `getActiveReferenceSet(rarity)` retorna `null` para qualquer raridade sem conjunto ativo — isso é o comportamento correto hoje para as 6 raridades.
4. Adicionar arquivos reais a uma pasta não torna o conjunto ativo sozinho — `active` precisa ser alterado manualmente no registro.
