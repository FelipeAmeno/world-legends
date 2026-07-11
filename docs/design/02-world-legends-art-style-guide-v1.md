# WORLD LEGENDS ART STYLE GUIDE

**Version:** 1.0  
**Status:** Released  
**Owner:** Creative Direction  
**Project Owner:** Felipe Ameno  
**Derived from:** World Legends Design Bible v1.0  
**Language:** Portuguese  
**Last updated:** 2026-07-10

---

## 0. Objetivo

Este documento transforma a visão da **World Legends Design Bible v1.0** em regras visuais práticas para cartas, packs, coleção, squad, interfaces, motion e produção de assets.

A Design Bible responde:

> O que o World Legends deve ser?

Este Art Style Guide responde:

> Como o World Legends deve parecer?

Este documento é obrigatório para:

- Gemini ou qualquer gerador de imagem;
- Claude ou qualquer implementação técnica;
- artistas;
- motion designers;
- designers de produto;
- revisores de QA;
- futuros colaboradores.

Nenhum asset deve ser aprovado apenas por “parecer bonito”. Ele deve obedecer ao sistema definido aqui.

---

# 1. NORTE VISUAL

## 1.1 Nome do estilo

O estilo visual oficial do World Legends é:

> **Cinematic Sports Collectible**

Ele combina:

- impacto esportivo;
- leitura rápida;
- acabamento premium;
- composição cinematográfica;
- profundidade de objeto colecionável;
- nostalgia de futebol histórico;
- energia de card game moderno.

---

## 1.2 O que o estilo deve transmitir

Cada peça visual deve comunicar pelo menos três destes atributos:

- valor;
- energia;
- história;
- grandeza;
- competição;
- raridade;
- domínio;
- descoberta;
- nostalgia;
- prestígio.

---

## 1.3 O que evitar

Evitar:

- visual corporativo;
- UI genérica de dashboard;
- excesso de blur;
- gradientes sem material;
- glow sem fonte de luz;
- fundo vazio;
- frame dominante;
- camisa isolada;
- jogador pequeno;
- excesso de texto;
- layout infantil;
- ícones genéricos;
- copy visual direta de EA FC;
- cards que parecem mockup de aplicativo.

---

# 2. SISTEMA DE COMPOSIÇÃO DAS CARTAS

## 2.1 Proporção oficial

A proporção recomendada para o card master é:

```text
2 : 3
```

Tamanho master sugerido:

```text
1600 × 2400 px
```

Outras escalas permitidas:

```text
1200 × 1800 px
800 × 1200 px
400 × 600 px
```

A implementação deve ser responsiva, mas o layout-base precisa preservar a proporção.

---

## 2.2 Grid mestre

A carta é dividida em cinco áreas:

```text
┌────────────────────────────┐
│ A — OVR / posição          │  14%
│                            │
│ B — rosto / tronco         │  26%
│                            │
│ C — corpo / ação           │  30%
│                            │
│ D — nome / identidade      │  14%
│                            │
│ E — stats / metadata       │  16%
└────────────────────────────┘
```

As porcentagens são aproximadas e podem variar por densidade.

---

## 2.3 Safe area

Margem segura mínima:

```text
5% da largura
4% da altura
```

Nenhum texto essencial pode encostar no frame.

Safe zones obrigatórias:

- OVR;
- posição;
- nome;
- stats;
- ícones;
- badges;
- país;
- era.

---

## 2.4 Hierarquia visual

A leitura deve seguir:

1. Jogador
2. OVR
3. Nome
4. Raridade
5. País
6. Era
7. Atributos
8. Efeitos secundários

Se o usuário perceber primeiro uma moldura, partícula ou textura, a composição precisa ser revista.

---

## 2.5 Escala do jogador

A arte central deve ocupar:

```text
60% a 75% da área interna
```

Regras:

- cabeça não pode parecer pequena demais;
- ombros devem sustentar presença;
- pernas podem ser cortadas;
- mãos podem sair levemente da área interna;
- o corpo pode romper parcialmente o frame em Showcase;
- o rosto ou silhueta não pode ser encoberto por stats.

---

# 3. DENSIDADES

## 3.1 Compact

Uso:

- Squad;
- grids densos;
- banco;
- seleção rápida;
- listagens.

Elementos:

- OVR;
- posição;
- nome curto;
- jogador;
- raridade;
- país opcional.

Remover:

- seis stats;
- era longa;
- texto secundário;
- partículas pesadas;
- reflection complexo.

Objetivo:

> reconhecimento em menos de um segundo.

---

## 3.2 Standard

Uso:

- Collection;
- Profile;
- resultados;
- comparação;
- progressão.

Elementos:

- OVR;
- posição;
- nome;
- país;
- raridade;
- atributos resumidos;
- arte completa;
- motion leve.

Objetivo:

> equilíbrio entre leitura e desejo.

---

## 3.3 Showcase

Uso:

- Pack Reveal;
- Card Detail;
- Spotlight;
- MVP;
- Hall of Legends.

Elementos:

- todos os dados;
- motion completo;
- partículas;
- brilho;
- material;
- era;
- traits;
- stats;
- efeitos premium.

Objetivo:

> máxima sensação de valor.

---

# 4. TIPOGRAFIA

## 4.1 Personalidade tipográfica

A tipografia deve ser:

- condensada;
- firme;
- atlética;
- premium;
- legível;
- contemporânea.

Evitar:

- serifas clássicas;
- fontes futuristas ilegíveis;
- letras muito largas;
- fontes arredondadas infantis;
- scripts;
- efeitos 3D em textos.

---

## 4.2 Famílias recomendadas

Para implementação, preferir fontes abertas e estáveis.

Sugestões:

- **Barlow Condensed**
- **Roboto Condensed**
- **Archivo Narrow**
- **Inter Tight**
- **Oswald**
- **Saira Condensed**

Escolha oficial recomendada para v1:

```text
Display / OVR / Nome: Barlow Condensed
UI / Corpo / Auxiliares: Inter
```

---

## 4.3 Pesos

```text
OVR: 800–900
Nome: 700–900
Posição: 700
Stats: 600–700
Labels: 500–600
Texto secundário: 400–500
```

---

## 4.4 Caixa alta

Usar caixa alta em:

- posição;
- raridade;
- labels curtos;
- stats;
- CTAs compactos.

Nome do jogador pode usar:

```text
CAIXA ALTA
```

ou title case, dependendo da densidade.

Nunca misturar estilos dentro do mesmo conjunto de cartas.

---

## 4.5 Regras de legibilidade

- OVR precisa ser legível em 80 px de largura do card.
- Nome precisa ser legível em Compact.
- Não aplicar blur em texto.
- Não rasterizar HUD dentro de asset.
- Não usar outline pesado.
- Sombras devem reforçar contraste, não substituir contraste.

---

# 5. PALETA GLOBAL

## 5.1 Base neutra

```text
Deep Black      #07090D
Graphite        #12161D
Steel           #242A33
Warm Gray       #8C8F96
Ivory           #F3F1EA
Pure White      #FFFFFF
```

---

## 5.2 Cores de energia

```text
Cyan Energy     #00C8FF
Blue Core       #2357FF
Violet Core     #7A3CFF
Magenta Pulse   #D945FF
Gold Core       #F5C64D
Amber Heat      #FF9B2F
Red Impact      #FF3B3B
Emerald Signal  #2DD881
```

Essas cores são referências, não licenças para saturar toda a interface.

---

## 5.3 Regra de saturação

Cada composição deve ter:

- 1 cor dominante;
- 1 cor de suporte;
- 1 cor de acento;
- neutros.

Evitar arco-íris em cartas que não sejam Ultra ou holográficas.

---

# 6. PALETA E MATERIAL POR RARIDADE

## 6.1 Common

### Paleta

```text
Graphite
Steel
Warm Gray
Ivory
```

### Material

- metal fosco;
- polímero técnico;
- escovado leve.

### Brilho

```text
0%–8%
```

### Glow

```text
0%–4%
```

### Background

- concreto;
- túnel;
- estádio desfocado;
- fumaça cinza;
- luz lateral.

### Motion

- breathing mínimo;
- reflection quase imperceptível.

---

## 6.2 Rare

### Paleta

```text
Navy
Blue Core
Cyan Energy
Steel
```

### Material

- metal anodizado;
- blue chrome;
- vidro frio.

### Brilho

```text
10%–18%
```

### Glow

```text
8%–14%
```

### Background

- energia azul;
- túnel iluminado;
- estádio noturno;
- linhas cinéticas.

### Motion

- shine diagonal lento;
- partículas leves.

---

## 6.3 Elite

### Paleta

```text
Deep Black
Violet Core
Magenta Pulse
Cyan Accent
```

### Material

- fibra de carbono;
- policarbonato;
- neon embutido.

### Brilho

```text
15%–25%
```

### Glow

```text
18%–30%
```

### Background

- arena violeta;
- energia elétrica;
- névoa escura;
- linhas de campo abstratas.

### Motion

- pulse;
- eletricidade discreta;
- shimmer.

---

## 6.4 Legendary

### Paleta

```text
Deep Black
Gold Core
Amber Heat
Ivory
```

### Material

- ouro lapidado;
- metal precioso;
- cristal âmbar.

### Brilho

```text
25%–40%
```

### Glow

```text
30%–45%
```

### Background

- estádio dourado;
- luz volumétrica;
- poeira;
- fumaça preta;
- brilho quente.

### Motion

- gold dust;
- lens flare;
- reflexão lenta.

---

## 6.5 Ultra

### Paleta

```text
Deep Black
Platinum
Cyan
Magenta
Red Impact
Prismatic White
```

### Material

- platina;
- cristal;
- cromado;
- holográfico.

### Brilho

```text
35%–55%
```

### Glow

```text
45%–70%
```

### Background

- prisma;
- aurora;
- energia quebrada;
- fractal;
- estádio abstrato.

### Motion

- refração;
- iridescência;
- energia viva.

---

## 6.6 World Cup Hero

### Paleta

```text
Ivory
Pearl
Champagne Gold
White
Deep Navy
```

### Material

- cerâmica branca;
- madrepérola;
- ouro claro;
- cristal.

### Brilho

```text
30%–50%
```

### Glow

```text
45%–75%
```

### Background

- luz celestial;
- confete;
- estádio de final;
- fumaça branca;
- celebração.

### Motion

- confete;
- halo;
- luz volumétrica;
- brilho solene.

---

# 7. FRAMES

## 7.1 Função

O frame deve:

- organizar;
- proteger leitura;
- comunicar raridade;
- sugerir material;
- dar profundidade;
- reforçar valor.

O frame não deve:

- competir com o jogador;
- esconder o nome;
- ser excessivamente grosso;
- parecer adesivo;
- parecer moldura medieval genérica.

---

## 7.2 Espessura

Faixa recomendada:

```text
5%–9% da largura do card
```

Compact:

```text
4%–6%
```

Showcase:

```text
7%–10%
```

---

## 7.3 Geometria

Características permitidas:

- cantos chanfrados;
- recortes diagonais;
- placas sobrepostas;
- filetes internos;
- material exposto;
- detalhes técnicos;
- microgravações.

Evitar:

- bordas arredondadas genéricas;
- excesso de pontas;
- ornamentos sem relação com futebol;
- formas que lembram fantasia medieval.

---

## 7.4 Profundidade

O frame deve ter pelo menos três planos:

1. borda externa;
2. estrutura principal;
3. filete interno.

Opcionalmente:

4. vidro;
5. reflection;
6. energia.

---

# 8. BACKGROUNDS

## 8.1 Objetivo

Backgrounds precisam criar ambiente e narrativa.

Todo background deve ter:

- profundidade;
- foco;
- direção de luz;
- área de respiro;
- perspectiva;
- contraste com o jogador.

---

## 8.2 Composição

Ideal:

```text
Foreground FX
Player
Midground atmosphere
Background stadium / architecture / energy
Far background light
```

---

## 8.3 Tipos

### Estádio

- arquibancadas abstratas;
- holofotes;
- fumaça;
- túnel;
- campo sugerido.

### Energia

- linhas;
- partículas;
- aurora;
- fractais;
- pulsos.

### Histórico

- textura de papel;
- fotografia reinterpretada;
- grão;
- luz quente;
- memória.

### Nacional

- cores;
- ritmo visual;
- padrões;
- atmosfera cultural abstrata.

---

## 8.4 Regras

Não usar:

- bandeira inteira;
- escudo;
- logo;
- estádio oficial identificável;
- patrocinadores;
- texto;
- placar;
- multidão detalhada demais.

---

# 9. ARTE DO JOGADOR

## 9.1 Estilo

A arte deve ser:

> semi-realista cinematográfica

Ela pode parecer pintura digital premium, mas precisa preservar:

- anatomia;
- volume;
- roupa;
- gesto;
- presença;
- luz coerente.

---

## 9.2 Rosto

Regras:

- não depender de hiper-realismo;
- evitar aparência fotográfica;
- evitar uncanny valley;
- aceitar 3/4;
- aceitar perfil;
- aceitar costas;
- aceitar silhueta.

Para atletas muito reconhecíveis, priorizar:

- postura;
- cabelo;
- físico;
- gesto;
- número;
- era;
- cores.

---

## 9.3 Camisa

A camisa é parte integral do jogador.

Ela deve:

- envolver o corpo;
- responder à iluminação;
- ter tecido e volume;
- carregar cores temáticas;
- ajudar no reconhecimento;
- funcionar sem logo.

Ela não deve:

- flutuar;
- parecer mockup;
- ser o único objeto central;
- usar patrocinador;
- usar escudo;
- copiar kit oficial integralmente.

---

## 9.4 Poses

### Celebração

- braços abertos;
- punho erguido;
- joelhos no chão;
- costas para a câmera;
- salto;
- corrida.

### Ação ofensiva

- chute;
- voleio;
- domínio;
- drible;
- cabeçada;
- sprint.

### Meio-campo

- passe;
- visão de jogo;
- condução;
- lançamento;
- controle orientado.

### Defesa

- carrinho;
- disputa;
- liderança;
- bloqueio;
- interceptação.

### Goleiro

- defesa;
- voo;
- saída;
- comemoração;
- posicionamento.

---

## 9.5 Cortes permitidos

Permitido cortar:

- pés;
- parte das pernas;
- uma das mãos;
- ponta do cabelo;
- parte da bola.

Não cortar:

- rosto;
- OVR;
- nome;
- mãos importantes na pose;
- cabeça em poses de costas.

---

# 10. ILUMINAÇÃO

## 10.1 Modelo base

Toda composição deve ter:

1. key light;
2. rim light;
3. ambient light;
4. accent light opcional.

---

## 10.2 Key light

Responsável por:

- forma;
- rosto;
- tronco;
- foco.

Não deve vir de direção incoerente com o background.

---

## 10.3 Rim light

Responsável por separar o jogador do fundo.

Pode usar cor de raridade.

Exemplos:

- Rare: ciano;
- Elite: violeta;
- Legendary: ouro;
- Ultra: prisma;
- WCH: branco dourado.

---

## 10.4 God rays

Reservados para:

- Legendary;
- Ultra;
- World Cup Hero;
- GOAT moments.

Não usar em Common.

---

# 11. PARTICLES E FX

## 11.1 Categorias

- dust;
- sparks;
- shards;
- confetti;
- smoke;
- embers;
- crystal fragments;
- aurora;
- rain;
- snow;
- field debris.

---

## 11.2 Densidade

Common:

```text
0–5 partículas visíveis
```

Rare:

```text
5–12
```

Elite:

```text
10–20
```

Legendary:

```text
15–30
```

Ultra:

```text
20–40
```

World Cup Hero:

```text
20–50
```

Os números são visuais, não necessariamente partículas reais no runtime.

---

## 11.3 Regra de profundidade

Partículas devem existir em pelo menos dois planos:

- atrás do jogador;
- à frente do jogador.

Evitar partículas uniformemente distribuídas.

---

# 12. PATTERNS NACIONAIS

## 12.1 Abordagem

Patterns nacionais devem usar:

- geometria;
- ritmo;
- cor;
- textura;
- abstração.

Exemplos:

Brasil:

- curvas;
- diagonais;
- verde;
- amarelo;
- azul;
- energia tropical abstrata.

Argentina:

- faixas luminosas;
- azul claro;
- branco;
- vento.

França:

- arquitetura geométrica;
- azul marinho;
- branco;
- vermelho em acento.

Portugal:

- diagonais;
- vermelho profundo;
- ouro;
- verde em detalhe.

---

## 12.2 Intensidade

O pattern deve ficar entre:

```text
4% e 18% de opacidade
```

Ele deve ser percebido, não dominar.

---

# 13. GLASS, SHINE E REFLECTION

## 13.1 Glass

O vidro fornece:

- acabamento;
- profundidade;
- premium feel;
- reflexo;
- resposta ao movimento.

---

## 13.2 Shine

Tipos:

- diagonal;
- radial;
- edge shine;
- moving highlight;
- soft bloom.

Common:

- quase nenhum.

Rare:

- diagonal leve.

Elite:

- pulse + diagonal.

Legendary:

- gold reflection.

Ultra:

- holographic sweep.

WCH:

- pearl shimmer.

---

## 13.3 Reflexo

Nunca refletir o HUD inteiro.

Reflection deve afetar:

- vidro;
- frame;
- material;
- highlights.

Texto deve permanecer legível e estável.

---

# 14. HUD

## 14.1 OVR

Características:

- grande;
- firme;
- imediatamente legível;
- alinhado ao topo esquerdo;
- contraste alto.

Nunca:

- inclinar demais;
- colocar atrás do jogador;
- aplicar textura que prejudique leitura.

---

## 14.2 Posição

Abaixo ou próxima do OVR.

Exemplos:

```text
ST
LW
CAM
CM
CB
GK
```

---

## 14.3 Nome

O nome deve ficar na base, com prioridade alta.

Regras:

- máximo recomendado de 14 caracteres em uma linha;
- nomes longos podem reduzir fonte;
- evitar duas linhas em Compact;
- manter área limpa.

---

## 14.4 Stats

Linha:

```text
PAC SHO PAS DRI DEF PHY
```

Goleiro:

```text
DIV HAN KIC REF SPD POS
```

Stats devem ter:

- label;
- valor;
- alinhamento;
- espaçamento consistente.

---

# 15. PACK ART

## 15.1 Forma

Packs devem parecer:

- cápsula;
- envelope premium;
- cofre;
- relicário;
- embalagem técnica;
- item colecionável.

Evitar:

- caixa genérica;
- barril;
- saco;
- emoji;
- gift box comum.

---

## 15.2 Hierarquia

1. nome do pack;
2. raridade/tema;
3. objeto;
4. iluminação;
5. metadata;
6. CTA.

---

## 15.3 Pack por tier

Starter:

- acessível;
- limpo;
- metal fosco.

Rare:

- blue chrome;
- brilho ciano.

Elite:

- cápsula violeta;
- energia.

Legendary:

- relicário dourado;
- profundidade.

GOAT:

- cofre preto;
- platina;
- halo.

---

# 16. COLLECTION

## 16.1 Visual

A Collection deve parecer:

- museu;
- álbum;
- galeria;
- cofre.

---

## 16.2 Grid

Espaçamento recomendado:

```text
12–20 px mobile
20–28 px desktop
```

Cards devem manter proporção.

---

## 16.3 Estado bloqueado

Carta não obtida:

- silhueta;
- baixa saturação;
- pattern preservado;
- nome opcionalmente oculto;
- progresso claro.

Não usar apenas opacidade 20% em toda a carta.

---

# 17. SQUAD

## 17.1 Campo

O pitch precisa:

- ser legível;
- respeitar proporção;
- manter cards visíveis;
- não virar fundo decorativo.

---

## 17.2 Cards em campo

Preferir Compact.

Mostrar:

- OVR;
- posição;
- nome curto;
- raridade;
- jogador.

---

# 18. MOTION

## 18.1 Curvas

Padrão recomendado:

```text
ease-out
cubic-bezier(0.22, 1, 0.36, 1)
```

---

## 18.2 Duração

Microinteração:

```text
120–220 ms
```

Hover:

```text
180–260 ms
```

Reveal leve:

```text
500–900 ms
```

Reveal lendário:

```text
1200–2400 ms
```

---

## 18.3 Interação

Tilt máximo recomendado:

```text
4°–8°
```

Parallax máximo:

```text
8–16 px
```

Não usar tilt agressivo em mobile.

---

# 19. SOM

## 19.1 Material sonoro

Common:

- click;
- metal seco.

Rare:

- whoosh;
- brilho metálico.

Elite:

- descarga elétrica.

Legendary:

- impacto grave;
- harmônico dourado.

Ultra:

- refração;
- energia.

WCH:

- torcida;
- acorde triunfal;
- confete.

---

# 20. ÍCONES

## 20.1 Estilo

Ícones devem ser:

- simples;
- geométricos;
- esportivos;
- legíveis;
- monocromáticos ou duotone.

Evitar:

- emoji;
- ícones 3D genéricos;
- mistura de estilos;
- excesso de detalhe.

---

# 21. ESPAÇAMENTO

Escala recomendada:

```text
4
8
12
16
20
24
32
40
48
64
```

Não inventar espaçamentos fora da escala sem justificativa.

---

# 22. SOMBRAS

## 22.1 Card

Sombra base:

```text
0 8px 24px rgba(0,0,0,0.28)
```

Showcase:

```text
0 18px 48px rgba(0,0,0,0.42)
```

Não usar sombras duras e negras sem blur.

---

# 23. RESPONSIVIDADE

## 23.1 Mobile

- HUD simplificado;
- partículas reduzidas;
- nomes responsivos;
- sem overflow;
- áreas de toque mínimas;
- card central dominante.

---

## 23.2 Desktop

- mais espaço;
- efeitos completos;
- galeria;
- comparações;
- hover;
- parallax opcional.

---

# 24. ACESSIBILIDADE VISUAL

Obrigatório:

- contraste mínimo adequado;
- raridade não depender só de cor;
- ícone + texto;
- foco visível;
- motion reduzido;
- estados não dependerem de glow.

---

# 25. REGRAS PARA IA

## 25.1 O que a IA pode gerar

- background;
- pose;
- roupa sem marca;
- partículas;
- luz;
- pattern;
- textura;
- material;
- atmosfera.

---

## 25.2 O que a IA não deve gerar

- HUD final;
- nome;
- stats;
- posição;
- logo;
- escudo;
- patrocinador;
- texto;
- card completo pronto para produção.

---

## 25.3 Prompt base de estilo

```text
Create a premium cinematic football collectible asset for World Legends.
Semi-realistic digital painting, dramatic sports lighting, strong silhouette,
high material definition, premium card-game atmosphere, no text, no logos,
no sponsors, no badges, no watermark, isolated asset or clean background
according to the requested layer.
```

---

# 26. EXEMPLOS DE APROVAÇÃO

## 26.1 Carta aprovada

- jogador domina;
- fundo possui profundidade;
- material é claro;
- HUD é limpo;
- frame organiza;
- raridade é perceptível;
- sem elementos protegidos;
- funciona pequena.

---

## 26.2 Carta reprovada

- rosto artificial;
- camisa flutuante;
- frame excessivo;
- fundo vazio;
- glow sem luz;
- texto rasterizado;
- excesso de informação;
- raridade baseada apenas em cor.

---

# 27. CHECKLIST DE ASSET

Antes de aceitar um asset:

- [ ] Sem texto
- [ ] Sem logo
- [ ] Sem escudo
- [ ] Sem patrocinador
- [ ] Sem watermark
- [ ] Resolução correta
- [ ] Fundo/transparência correta
- [ ] Luz coerente
- [ ] Composição compatível
- [ ] Arquivo nomeado corretamente
- [ ] Raridade correta
- [ ] Uso definido
- [ ] Preview aprovado
- [ ] Performance adequada

---

# 28. CHECKLIST DE CARTA

- [ ] Jogador ocupa 60%–75%
- [ ] OVR legível
- [ ] Nome legível
- [ ] Frame não compete
- [ ] Raridade reconhecível
- [ ] Material perceptível
- [ ] Fundo possui profundidade
- [ ] Stats corretos
- [ ] Compact validado
- [ ] Standard validado
- [ ] Showcase validado
- [ ] Reduced motion validado
- [ ] Sem duplicação
- [ ] Sem espelhamento
- [ ] Sem legado

---

# 29. CRITÉRIOS DE ACEITE DO STYLE GUIDE

Este guia está corretamente implementado quando:

1. As raridades podem ser reconhecidas sem label.
2. Common ainda parece digno.
3. Legendary e Ultra parecem significativamente superiores.
4. O jogador é sempre o foco.
5. O HUD permanece nítido.
6. Os backgrounds contam contexto.
7. As cartas funcionam em três densidades.
8. Gemini produz assets, não cards finais.
9. Claude monta a composição via engine.
10. O jogo mantém identidade em todas as telas.

---

# 30. CONCLUSÃO

O World Legends não deve parecer uma coleção de efeitos independentes.

Ele deve parecer um sistema visual único.

A regra final é:

> **O jogador cria o desejo.  
> O frame comunica valor.  
> O background conta a história.  
> O HUD entrega clareza.  
> A raridade transforma a experiência.**

---

**Fim — World Legends Art Style Guide v1.0**
