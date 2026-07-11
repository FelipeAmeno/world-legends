# WORLD LEGENDS DESIGN BIBLE

**Version:** 1.0  
**Status:** Released  
**Owner:** Creative Direction  
**Project Owner:** Felipe Ameno  
**Language:** Português  
**Last updated:** 2026-07-10

---

## 0. Propósito deste documento

Esta Design Bible é a fonte oficial de decisões de produto, direção criativa, experiência, identidade visual, comportamento, coleção, cartas, packs e jogabilidade do **World Legends**.

Ela existe para evitar:

- decisões visuais improvisadas;
- mudanças de direção a cada sprint;
- componentes que não conversam entre si;
- excesso de efeitos sem propósito;
- cópia direta de referências externas;
- inconsistência entre Collection, Squad, Match, Profile e Pack Reveal;
- reconstruções repetidas do Card Engine;
- divergências entre Claude, Gemini e qualquer futuro colaborador.

Sempre que houver conflito entre uma implementação e este documento, prevalece este documento, salvo decisão explícita do proprietário do projeto.

---

# 1. VISÃO DO PRODUTO

## 1.1 O que é World Legends

World Legends é um jogo digital de futebol centrado em quatro experiências:

1. **Colecionar**
2. **Montar**
3. **Competir**
4. **Evoluir**

Definição oficial:

> **World Legends é um jogo de coleção e estratégia de futebol em que o jogador constrói um elenco histórico, toma decisões em partidas rápidas e transforma cartas em peças de uma coleção pessoal viva.**

## 1.2 Fantasia central

A fantasia principal:

> “Eu montei um time impossível com lendas de diferentes eras e fiz esse time vencer.”

Fantasia secundária:

> “Eu encontrei uma carta rara que parece realmente valiosa.”

Terceira fantasia:

> “Meu elenco conta a minha história.”

## 1.3 Promessa emocional

O jogador deve sentir, nesta ordem:

1. Curiosidade
2. Tensão
3. Descoberta
4. Valor
5. Orgulho
6. Vontade de continuar

Essa sequência deve existir no pack opening, na evolução do squad, no desbloqueio de cartas e nos resultados das partidas.

## 1.4 Posicionamento

World Legends deve parecer:

- premium;
- acessível;
- rápido;
- colecionável;
- dramático;
- competitivo;
- nostálgico;
- moderno.

World Legends não deve parecer:

- dashboard corporativo;
- CRUD de cartas;
- clone direto de EA FC;
- álbum estático;
- jogo infantil;
- app genérico com gradientes;
- protótipo técnico;
- cassino disfarçado;
- simulador excessivamente lento.

---

# 2. PRINCÍPIOS DE DESIGN

## 2.1 O jogador vem antes do sistema

Sempre que houver disputa por atenção entre jogador, frame, efeitos, HUD e background, a prioridade é:

1. Jogador
2. OVR
3. Nome
4. Raridade
5. País/era
6. Atributos
7. Efeitos

Se o frame chamar mais atenção do que o jogador, a composição falhou.

## 2.2 Toda decisão precisa ter consequência

O jogador precisa perceber que:

- montar melhor muda a partida;
- química importa;
- traits importam;
- substituições importam;
- tática importa;
- dificuldade altera comportamento;
- raridade altera sensação, não apenas número.

## 2.3 Poucas escolhas, escolhas importantes

Em mobile, decisões devem ser rápidas.

Exemplo aceitável:

- contra-atacar;
- segurar a posse;
- inverter o jogo.

Exemplo ruim:

- abrir uma tela com 15 sliders durante a partida.

Regra:

> O jogador nunca deve ficar sobrecarregado, mas também nunca deve sentir que está apenas assistindo.

## 2.4 A raridade muda o material

Raridade nunca deve ser apenas cor.

Cada raridade altera:

- material;
- profundidade;
- movimento;
- áudio;
- partículas;
- intensidade;
- brilho;
- reveal;
- linguagem do frame.

## 2.5 A carta precisa funcionar parada

Uma carta deve ser bonita:

- na Collection;
- no Squad;
- no Profile;
- no Card Detail;
- no Match MVP;
- no Pack Reveal.

Animação não pode esconder uma composição fraca.

## 2.6 Mobile first

Toda decisão deve funcionar primeiro em telas pequenas.

Prioridades:

- leitura rápida;
- toque confortável;
- contraste;
- scroll previsível;
- safe area;
- performance;
- ausência de overflow;
- zero texto espelhado;
- zero elementos cortados.

---

# 3. PILARES DO PRODUTO

## 3.1 Coleção com significado

A coleção não é uma lista.

Ela deve representar:

- história;
- progressão;
- raridade;
- descoberta;
- orgulho;
- completude;
- identidade pessoal.

A Collection deve se comportar como:

- álbum;
- museu;
- inventário;
- vitrine.

## 3.2 Squad com consequência

O squad precisa afetar:

- OVR;
- setores;
- química;
- moral;
- estilo de jogo;
- chance de eventos;
- desempenho individual;
- resultado.

Nunca utilizar time fixo hardcoded em partidas reais.

## 3.3 Partidas com decisão

A partida deve ser rápida, mas não vazia.

Fluxo ideal:

1. Pré-jogo
2. Primeiro tempo
3. Eventos decisivos
4. Intervalo
5. Substituições/tática
6. Segundo tempo
7. Resultado
8. Recompensas
9. Próxima ação

## 3.4 Recompensa visível

Toda recompensa precisa ter feedback.

Exemplos:

- créditos voam;
- fragmentos brilham;
- XP progride;
- conquista aparece;
- país completo celebra;
- raridade alta muda a tela.

---

# 4. IDENTIDADE VISUAL

## 4.1 Estilo oficial

Nome interno:

> **Cinematic Sports Collectible**

Combinação conceitual:

- legibilidade esportiva;
- composição cinematográfica;
- materialidade de item premium;
- energia de card game;
- nostalgia de álbum histórico;
- profundidade de objeto digital.

Não copiar layouts externos.

Referências servem apenas para princípios:

- EA FC: leitura esportiva;
- Pokémon: valor de coleção;
- Marvel Snap: impacto visual;
- Panini: nostalgia e jogador como protagonista;
- Clash Royale: clareza e ritmo.

## 4.2 Linguagem visual

A linguagem oficial usa:

- metal;
- vidro;
- carbono;
- cerâmica;
- luz de estádio;
- fumaça;
- partículas;
- padrões nacionais abstratos;
- backgrounds profundos;
- contrastes fortes;
- tipografia condensada;
- composição vertical.

## 4.3 Regras de composição

A carta deve obedecer:

- proporção vertical;
- arte central ocupando 60%–75%;
- safe zone para OVR;
- safe zone para nome;
- leitura imediata em 300 px;
- jogador central claramente reconhecível;
- fundo apoiando, nunca competindo;
- efeitos reduzidos em Compact.

---

# 5. SISTEMA DE RARIDADES

## 5.1 Common

**Fantasia:** peça funcional de coleção.  
**Material:** metal fosco / plástico técnico.  
**Paleta:** grafite, cinza, aço.  
**Movimento:** quase estático.  
**FX:** poeira mínima.  
**Reveal:** simples.  
**Som:** clique seco.  
**Regra:** não parecer lixo; parecer básico.

## 5.2 Rare

**Fantasia:** descoberta especial.  
**Material:** metal anodizado azul.  
**Paleta:** azul cobalto, ciano, navy.  
**Movimento:** shine leve.  
**FX:** partículas pequenas.  
**Reveal:** flash azul.  
**Som:** whoosh curto.

## 5.3 Elite

**Fantasia:** carta competitiva desejável.  
**Material:** carbono e policarbonato roxo.  
**Paleta:** roxo, violeta, magenta.  
**Movimento:** pulso energético.  
**FX:** linhas elétricas e faíscas.  
**Reveal:** antecipação média.  
**Som:** impacto elétrico.

## 5.4 Legendary

**Fantasia:** peça histórica de alto valor.  
**Material:** ouro lapidado.  
**Paleta:** ouro quente, âmbar, preto profundo.  
**Movimento:** gold dust / luz volumétrica.  
**FX:** fragmentos dourados.  
**Reveal:** suspense, flash dourado, pausa curta.  
**Som:** impacto grave + coro leve.

## 5.5 Ultra

**Fantasia:** item máximo e agressivo.  
**Material:** platina cromada / iridescência.  
**Paleta:** preto, vermelho, prisma, ciano, magenta.  
**Movimento:** aurora e refração.  
**FX:** energia prismática.  
**Reveal:** sequência longa, tela reativa.  
**Som:** carga crescente + impacto.

## 5.6 World Cup Hero

**Fantasia:** glória histórica e troféu.  
**Material:** cerâmica branca, ouro e pérola.  
**Paleta:** branco, marfim, champagne, dourado.  
**Movimento:** confete e brilho celestial.  
**FX:** partículas festivas e luz de estádio.  
**Reveal:** solene, celebrativo, luminoso.  
**Som:** torcida + acorde triunfal.

---

# 6. CARD SYSTEM

## 6.1 Função da carta

A carta precisa comunicar:

- quem é;
- quão rara é;
- qual seu papel;
- qual seu valor;
- como joga;
- por que vale a pena mantê-la.

## 6.2 Árvore visual oficial

```text
CardRoot
├── CinematicBackgroundLayer
├── RearLightLayer
├── NationalPatternLayer
├── PlayerPoseLayer
├── FrontParticleLayer
├── FrameLayer
├── ReflectionLayer
├── ShineLayer
├── HudLayer
└── InteractionLayer
```

Não utilizar:

- card antigo dentro do novo;
- JerseyLayer como protagonista;
- textos dentro das imagens;
- frames que encobrem nome;
- transforms corretivos com espelhamento.

## 6.3 Densidades

### Compact

Uso:

- Squad;
- grids densos;
- banco;
- seletores.

Exibe:

- OVR;
- posição;
- nome curto;
- imagem;
- raridade.

Oculta:

- stats completos;
- efeitos pesados;
- textos secundários.

### Standard

Uso:

- Collection;
- Profile;
- resultados.

Exibe:

- OVR;
- posição;
- nome;
- país;
- raridade;
- stats resumidos.

### Showcase

Uso:

- Pack Reveal;
- Spotlight;
- Card Detail;
- MVP.

Exibe:

- HUD completo;
- partículas;
- reflection;
- efeitos máximos;
- stats;
- era;
- traits;
- metadata visual.

## 6.4 HUD oficial

Topo esquerdo:

- OVR;
- posição.

Centro:

- jogador.

Base:

- nome;
- país/era;
- atributos.

Jogadores de linha:

- PAC
- SHO
- PAS
- DRI
- DEF
- PHY

Goleiros:

- DIV
- HAN
- KIC
- REF
- SPD
- POS

## 6.5 Tipografia da carta

Características:

- condensada;
- pesada;
- esportiva;
- legível;
- sem ornamento excessivo.

Regras:

- OVR: Black;
- nome: Bold/Black;
- posição: Bold;
- atributos: Medium/Semibold;
- textos secundários: Regular/Medium.

Nunca usar fonte decorativa em stats.

---

# 7. ARTE DO JOGADOR

## 7.1 Princípio

O jogador é sempre o foco.

A arte central pode usar:

- costas;
- 3/4;
- silhueta estilizada;
- ação;
- celebração;
- pose heroica.

Evitar:

- rosto hiper-realista;
- reprodução de fotografia;
- uniformes oficiais copiados;
- escudos;
- patrocinadores;
- logos;
- marcas.

## 7.2 Camisa

A camisa não é proibida.

Ela é parte do corpo e da narrativa.

A camisa funciona quando:

- está integrada à pose;
- possui volume;
- participa da iluminação;
- carrega cores nacionais;
- ajuda no reconhecimento.

A camisa falha quando:

- flutua sozinha;
- parece ícone;
- é pequena;
- substitui o jogador;
- ocupa o centro sem ação.

## 7.3 Biblioteca inicial de poses

Categorias:

- comemoração;
- corrida;
- chute;
- controle;
- passe;
- liderança;
- defesa;
- goleiro.

Quantidade inicial recomendada:

- 5 comemorações;
- 5 ações ofensivas;
- 5 meias;
- 5 defensivas;
- 5 goleiros.

Primeira validação: 25 poses.

Não produzir 100 antes de validar.

---

# 8. BACKGROUNDS

## 8.1 Objetivo

Backgrounds fornecem:

- contexto;
- profundidade;
- cor;
- atmosfera;
- raridade;
- identidade nacional.

Nunca devem parecer apenas gradientes.

## 8.2 Categorias

- estádio noturno;
- estádio dourado;
- túnel;
- chuva;
- fumaça;
- aurora;
- energia;
- celebração;
- arena;
- final;
- névoa;
- industrial.

## 8.3 Background por raridade

Common: industrial e contido.  
Rare: energia azul.  
Elite: arena violeta.  
Legendary: luz dourada.  
Ultra: prisma e tensão.  
World Cup Hero: glória e luminosidade.

---

# 9. PADRÕES NACIONAIS

Patterns precisam ser abstratos.

Usar:

- cor;
- geometria;
- ritmo;
- textura;
- cultura visual indireta.

Não usar:

- escudo;
- brasão;
- logo;
- símbolo protegido;
- bandeira inteira como wallpaper.

---

# 10. MATERIAIS

Materiais oficiais:

- aço escovado;
- titânio;
- carbono;
- policarbonato;
- ouro;
- platina;
- cerâmica;
- vidro;
- cristal;
- holográfico.

A diferença entre raridades precisa ser perceptível sem texto.

---

# 11. MOTION DESIGN

## 11.1 Princípios

Movimento deve:

- reforçar raridade;
- responder ao toque;
- criar tensão;
- comunicar valor;
- respeitar performance.

Movimento não deve:

- cansar;
- competir com leitura;
- existir apenas porque é possível;
- rodar fora da viewport.

## 11.2 Presets

Common: quase estático.  
Rare: shine leve.  
Elite: pulso.  
Legendary: gold dust.  
Ultra: aurora.  
World Cup Hero: confete.

## 11.3 Reduced motion

Com `prefers-reduced-motion`:

- remover breathing;
- remover parallax contínuo;
- reduzir partículas;
- manter apenas transições essenciais;
- não remover feedback de sucesso.

---

# 12. PACK SYSTEM

## 12.1 O pack como produto

Cada pack deve parecer um objeto premium.

Nunca usar:

- barril genérico;
- caixa de papelão;
- emoji como arte principal;
- ícone flutuando em gradiente.

## 12.2 Identidades

Starter: simples e acessível.  
Classic: metal padrão premium.  
Brazil: nacional, vibrante.  
Elite: cápsula energética.  
Hero: cristal e evento.  
Legend: relicário dourado.  
GOAT: cofre preto e platina.

## 12.3 Pack Opening

Fluxo:

1. Seleção
2. Suspense
3. Carregamento visual
4. Ruptura do pack
5. Luz de raridade
6. Carta
7. HUD
8. Nome
9. Recompensa
10. Resumo

---

# 13. COLLECTION

A Collection deve parecer museu + álbum.

Estados:

- adquirido;
- faltando;
- favorito;
- Dream Team;
- novo;
- completo.

Recursos:

- filtros;
- progresso;
- raridade;
- país;
- posição;
- spotlight;
- comparação;
- conquistas;
- completude.

---

# 14. SQUAD

O Squad deve ser:

- funcional;
- legível;
- tático;
- rápido.

Princípios:

- o campo nunca pode ser comprimido;
- a coleção não pode esconder o pitch;
- troca precisa mostrar antes/depois;
- química precisa ser compreensível;
- o time salvo precisa entrar em campo.

---

# 15. MATCH EXPERIENCE

## 15.1 Objetivo

Partidas devem ser rápidas e participativas.

Duração alvo inicial:

- 60 a 90 segundos.

## 15.2 Estrutura

- Intro
- Primeiro tempo
- Evento
- Intervalo
- Substituição
- Segundo tempo
- Resultado
- Recompensas

## 15.3 Decisões rápidas

### Falta

- colocada;
- forte;
- ensaiada.

### Contra-ataque

- acelerar;
- inverter;
- segurar.

### Escanteio

- primeiro pau;
- segundo pau;
- curto.

### Pênalti

- forte;
- colocado;
- cavadinha.

---

# 16. ECONOMIA VISUAL

O jogo deve comunicar:

- custo;
- risco;
- raridade;
- valor;
- progresso.

Regras:

- Legendary não pode parecer comum;
- GOAT não pode parecer acessível demais;
- preço do pack precisa combinar com sua apresentação;
- odds precisam ser testadas;
- QA nunca altera odds de produção.

---

# 17. ÁUDIO

Categorias:

- click;
- hover;
- open;
- reveal;
- reward;
- legendary;
- ultra;
- world cup hero;
- victory;
- goal;
- level up.

Áudio precisa reforçar o material.

Exemplo:

- Common: seco;
- Rare: metálico;
- Elite: elétrico;
- Legendary: grave;
- Ultra: prismático;
- WCH: triunfal.

---

# 18. PERFORMANCE

Metas:

- 1 Showcase: 60 fps;
- 10 cards: próximo de 60 fps;
- 50 cards: experiência estável;
- 200 cards: virtualização e animação reduzida.

Regras:

- cards fora da viewport não animam;
- compact reduz FX;
- assets pesados usam lazy load;
- preloads apenas para assets prioritários;
- cursor movement sem re-render React.

---

# 19. ACESSIBILIDADE

Obrigatório:

- contraste;
- estados de foco;
- labels;
- feedback sem depender só de cor;
- reduced motion;
- áreas de toque adequadas;
- texto mínimo legível;
- não bloquear navegação por teclado.

---

# 20. DIRETRIZES DE DIREITOS E IDENTIDADE

World Legends deve usar:

- ilustrações originais;
- padrões abstratos;
- roupas inspiradas em cores nacionais;
- poses genéricas;
- dados e nomes apenas quando legalmente permitido;
- zero logos e escudos oficiais sem licença;
- zero reprodução direta de arte externa.

---

# 21. CRITÉRIOS DE QUALIDADE

Uma carta só é aprovada se:

- o jogador domina;
- a raridade é clara;
- o HUD é legível;
- a composição funciona pequena;
- não há texto espelhado;
- não há camada duplicada;
- não há camisa isolada;
- o frame não encobre;
- a performance é aceitável.

---

# 22. ANTI-PATTERNS

Proibido:

- fundo simples com ícone;
- gradiente genérico;
- camisa flutuante;
- frame colocado sobre card antigo;
- texto dentro do asset;
- raridade só por cor;
- usar emojis como pack art;
- criar 500 assets antes de validar 5;
- reescrever engine sem auditoria;
- alterar odds para facilitar QA.

---

# 23. PIPELINE DE APROVAÇÃO

Fluxo oficial:

1. Brief
2. Concept
3. Validação
4. Asset isolado
5. Integração dev
6. QA visual
7. QA técnico
8. Aprovação
9. Escala

---

# 24. ROADMAP RECOMENDADO

## Fase 1 — Card V3

- validar 5 cartas;
- validar 3 densidades;
- corrigir fallback;
- corrigir reveal.

## Fase 2 — Starter Art Pack

- 5 poses;
- 5 backgrounds;
- 5 lights;
- 5 particles;
- 5 materials.

## Fase 3 — Asset Studio

- gallery;
- presets;
- metadata;
- export;
- preview.

## Fase 4 — Catálogo

- 574 cartas;
- batch QA;
- coverage;
- performance.

## Fase 5 — Gameplay

- squad real;
- substituições;
- tática;
- decisões;
- IA.

---

# 25. GOVERNANÇA

Owner do documento: Creative Direction.  
Aprovador final: Felipe Ameno.  
Implementação: Claude / equipe técnica.  
Produção de asset: ferramenta de imagem ou artista.  
Auditoria visual: direção criativa + owner.

Mudanças devem registrar:

- data;
- versão;
- motivo;
- impacto.

---

# 26. CHECKLIST FINAL DE SPRINT VISUAL

- [ ] Referência oficial usada
- [ ] Sem duplicação
- [ ] Sem conteúdo legado
- [ ] Sem texto espelhado
- [ ] Compact validado
- [ ] Standard validado
- [ ] Showcase validado
- [ ] Pack Reveal validado
- [ ] Collection validada
- [ ] Squad validado
- [ ] Profile validado
- [ ] Performance medida
- [ ] Reduced motion testado
- [ ] Screenshots salvos
- [ ] Build limpo
- [ ] Deploy Ready

---

# 27. CONCLUSÃO

World Legends deve ser reconhecido por três coisas:

1. **Cartas que parecem valiosas**
2. **Partidas rápidas com decisões**
3. **Uma coleção que conta história**

A tecnologia deve servir a essa visão.

O produto está correto quando o jogador pensa:

> “Quero abrir mais um pack, melhorar meu time e jogar mais uma partida.”

---

**Fim — World Legends Design Bible v1.0**
