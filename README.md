# Fachada Interativa — WR Barão do Rio Branco

Galeria de imagens/plantas/vídeo + fachada interativa para injeção via script no 3DVista,
hospedada no AWS S3.

**Empreendimento:** WR Barão do Rio Branco
**Incorporadora:** WR Construtora
**Tema:** off-white + petróleo (`#F6EFE2` / `#0B4F59`)

---

## URLs de produção

| Arquivo | URL |
|---------|-----|
| Galeria | `https://skylineip.s3.sa-east-1.amazonaws.com/Tour+Virtual/wr-construtora/ferramentas/fachada-barao-do-rio-branco/index.html` |
| Vídeo   | `https://skylineip.s3.sa-east-1.amazonaws.com/Tour+Virtual/wr-construtora/ferramentas/fachada-barao-do-rio-branco/video-gallery.html` |
| Fachada Interativa | `https://skylineip.s3.sa-east-1.amazonaws.com/Tour+Virtual/wr-construtora/ferramentas/fachada-barao-do-rio-branco/fachada-interativa.html` |
| Script  | `https://skylineip.s3.sa-east-1.amazonaws.com/Tour+Virtual/wr-construtora/ferramentas/fachada-barao-do-rio-branco/inject.js` |

**S3 path:** `s3://skylineip/Tour Virtual/wr-construtora/ferramentas/fachada-barao-do-rio-branco/`

---

## Estrutura de arquivos

```
galeria/  (kahhu / veridian-patamares)
├── index.html              ← galeria de imagens + plantas (auto-suficiente)
├── video-gallery.html      ← player do vídeo teaser
├── fachada-interativa.html ← fachada 3D interativa por faixa de andares (auto-suficiente)
├── inject.js               ← loader leve para injeção no 3DVista
├── deploy.ps1              ← deploy para o S3 (Windows; normaliza case + sync)
├── generate_thumbs.ps1     ← gerador de thumbnails (Windows/GDI+, sem deps)
├── generate_thumbs.py      ← gerador alternativo (Python + Pillow)
└── assets/
    ├── fachada/             ← torre + acessos (diurno/noturno)
    ├── aereas/              ← fotomontagens de inserção urbana + rooftop aéreo
    ├── areas-comuns/        ← térreo, mezanino e rooftop (categorizados no index.html)
    ├── apartamentos/
    │   ├── t2/              ← interiores 2 suítes  (serena · aires · lumina)
    │   └── t3/              ← interiores 3 quartos (native · aurora · vereda · sollari · zen)
    ├── plantas/             ← implantações (3 níveis) + plantas batizadas
    │                          (`<nome>-<tipologia>-<variante>.png`, ex.: serena-2suites-padrao)
    ├── design/              ← logo e fundos da interface (fora do gerador de thumbs)
    ├── fachada-interativa-assets/   ← PNGs da fachada interativa (ver seção abaixo)
    │   └── partes-separadas/        ← recortes das faixas que deslizam no destaque
    ├── video/               ← teaser (gitignored; sobe ao S3 com -WithVideo)
    └── thumbs/              ← gerado automaticamente (espelha a árvore, .jpg)
```

> **Nomenclatura = book comercial.** Os nomes de arquivo e os títulos em `GALLERY_CONFIG`
> seguem o book digital do empreendimento (PDF, gitignored). Cada foto de interior leva o
> nome da planta a que pertence (`serena-living`, `zen-varanda`), e cada ambiente comum usa
> o nome do book / da legenda da implantação — ex.: *Lounge Externo* (não "estar externo"),
> *Quadra de Areia*, *Quadra Recreativa*, *Beauty Center*, *Sala de Jogos*, *Espaço Gourmet*.
> Ao trocar imagens, confira o book antes de batizar o arquivo.

> **Pastas = categorias.** Mantenha os nomes **minúsculos, sem espaços e sem acentos**
> (o S3 é case-sensitive e nomes acentuados quebram a URL).

---

## Categorias da galeria

### Modo `imagens`

| Categoria | Label | Sub-categorias | Pasta |
|-----------|-------|----------------|-------|
| `fachada` | Fachada | — | `assets/fachada/` |
| `aereas` | Aéreas | — | `assets/aereas/` |
| `areas-comuns` | Áreas Comuns | Térreo · Mezanino · Rooftop | `assets/areas-comuns/` |
| `apartamentos` | Apartamentos | 2 Quartos · 3 Quartos | `assets/apartamentos/*` |

> As áreas comuns ficam todas na mesma pasta; o nível (térreo/mezanino/rooftop) é
> definido pelo campo `subCategory` de cada item em `GALLERY_CONFIG`.

### Modo `plantas`

| Tipologia | Label | Formato |
|-----------|-------|---------|
| `pl-comuns` | Áreas Comuns | card de abas — Térreo · Mezanino · Rooftop |
| `pl-t2` | 2 Quartos | card de abas — Padrão · Opção 01 · Opção 02 |
| `pl-t3` | 3 Quartos | card de abas — Padrão · Opção 01–04 |

No modo `plantas` o filtro principal **é** a tipologia (as `subs` da categoria `plantas`
viram o filtro), e cada card ocupa a largura toda.

### Cards de abas (`cobertura-plan`)

Plantas que são variantes do mesmo conjunto ficam num único card com abas. Campos úteis:

| Campo | Efeito |
|-------|--------|
| `floors[]` | as variantes (label + src + thumb) |
| `badge` | texto da tarja (padrão: `Planta`) |
| `hint` | texto do rodapé quando há ≠ 2 variantes |
| `notice` | aviso exibido no lightbox |
| `viewBothLabel` | rótulo do botão de sobreposição — **só aparece com exatamente 2 variantes** |

> **Plantas T2/T3 normalizadas.** As 8 plantas de tipologia foram recortadas e
> centralizadas num canvas comum de **2240 × 2180**, mantendo a escala 1:1 original.
> Assim a planta não "pula" de tamanho ao alternar entre as abas.

---

## Fachada Interativa (`fachada-interativa.html`)

Tela auto-suficiente (HTML + CSS + JS inline, sem build) que apresenta a torre em 3D e
permite explorar as vistas 360° por **faixa de andares**. Abre como overlay do 3DVista
(via `AbrirFachada`) e, ao escolher um andar, navega o tour para o panorama correspondente
por `setMediaByIndex` — sem recarregar.

### Assets — `assets/fachada-interativa-assets/` (WebP, 1380 × 1080)

| Arquivo | Papel |
|---------|-------|
| `fachada-padrao.webp` | Torre inteira sólida — **estado normal** (repouso). |
| `{16-20,11-15,6-10,2-5}-selected.webp` | Torre com a faixa **destacada por uma lâmina de vidro** (o resto continua sólido). Camadas de **cross-fade**, mesmo quadro 1380 × 1080. |
| `partes-separadas/{16-20,11-15,6-10,2-5}.webp` | Recorte isolado de cada faixa — a peça que **desliza para fora** ao destacar. Reescalados para a mesma escala da base. |

> **Peso.** A tela injeta os 9 assets no carregamento, então o peso é todo inicial.
> Em PNG somavam 9,15 MB; em WebP q85 somam **0,62 MB** (−93 %), e a página inteira
> fica em ~675 KB. Reencodar exige apenas ffmpeg:
> `ffmpeg -i x.png -c:v libwebp -quality 85 -compression_level 6 x.webp`
> (o canal alfa é preservado).

As camadas ficam empilhadas no mesmo quadro (a torre ocupa a metade esquerda; o vão
direito é o espaço para onde a peça desliza). A troca é por opacidade.

> A posição de cada recorte (`.fi-band-img[data-band]` no CSS) foi calibrada por
> *template matching* contra a `fachada-padrao`:
>
> | Faixa | left | top | width |
> |-------|------|-----|-------|
> | `b16-20` | 15,29 % | 0,00 % | 34,71 % |
> | `b11-15` | 15,81 % | 29,97 % | 33,60 % |
> | `b6-10` | 15,81 % | 48,55 % | 33,57 % |
> | `b2-5` | 15,91 % | 65,07 % | 34,09 % |
>
> Os quatro recortes têm largura equivalente (~34 % do quadro) e cobrem só a torre —
> a vegetação do primeiro plano fica na `fachada-padrao`, não na peça que desliza.

### Setores e mapeamento pavimento → índice do panorama

Os `idx` são passados para `setMediaByIndex(idx)` do 3DVista. **Rooftop = 6** e, daí para
baixo, **passo de 3**, sempre listados do mais alto para o mais baixo:

| Setor | Pavimentos (label → idx) |
|-------|--------------------------|
| **D** · Rooftop \| 16º ao 20º | Rooftop=6 · 20º=9 · 19º=12 · 18º=15 · 17º=18 · 16º=21 |
| **C** · 11º ao 15º | 15º=24 · 14º=27 · 13º=30 · 12º=33 · 11º=36 |
| **B** · 6º ao 10º | 10º=39 · 9º=42 · 8º=45 · 7º=48 · 6º=51 |
| **A** · 2º ao 5º | 5º=54 · 4º=57 · 3º=60 · 2º=63 |

> Os índices vivem no objeto `FI.bands[].floors` no topo do `<script>` de
> `fachada-interativa.html`. Se uma vista abrir deslocada, ajuste ali.
>
> **`var LOC_IDX = 3;`** (logo acima de `FI`) é a **Vista Geral diurna**, destino do botão
> "Conheça a localização". Recebe o deslocamento de período, caindo em 3/4/5 conforme o
> visitante esteja em diurno/entardecer/noturno.

### Período do dia (diurno · entardecer · noturno)

O tour inteiro é montado em **trincas consecutivas, começando do zero** (confirmado na
lista de mídias do projeto):

| índices | cena | diurno · entardecer · noturno |
|---|---|---|
| 0-2 | BG (backgrounds de período) | 0 · 1 · 2 |
| 3-5 | Vista Geral | 3 · 4 · 5 |
| 6-8 | Rooftop | 6 · 7 · 8 |
| 9-11 | 20º | 9 · 10 · 11 |
| … | … (passo de 3) | … |
| 63-65 | 2º | 63 · 64 · 65 |

Em todo bloco a variante diurna cai num múltiplo de 3, então **o período é sempre
`índice % 3`** — vale para BG, vista geral e pavimentos, sem exceção.

A fachada manda sempre o índice **diurno**; quem soma o período é o `inject.js`, em
`_goToPanorama`. A detecção do período tenta, nesta ordem:

1. `window.VERIDIAN_PERIODO` (0/1/2) — override manual, tem prioridade
2. `player.get('mainPlayList').get('selectedIndex')` — padrão do 3DVista
3. qualquer outra `PlayList` do projeto (`getByClassName`)
4. `getCurrentMediaIndex()` / `getMediaIndex()` — se o tour tiver um helper próprio
5. o último índice que o próprio script trocou nesta sessão
6. `?media-index=` na URL
7. sem nada disso → **diurno**

> Toda leitura é validada (inteiro entre 0 e 99); nulo, negativo, fracionário ou absurdo
> é descartado, então uma sondagem que devolva lixo não vira um período errado.

**Conferir no tour** — cole no console ou numa action:

```js
VeridianPeriodo()       // { indiceAtual, via, periodo, nome, forcado, detectou }
VeridianPeriodo(1)      // força entardecer
VeridianPeriodo(null)   // volta para automático
VeridianDebug()         // relatório do que o tour expõe (playlists, APIs)
```

> A URL do tour **não muda** ao navegar — é esperado: significa que o `setMediaByIndex`
> funcionou e o fallback de `?media-index=` não foi necessário.

Se `detectou: false`, o tour não expõe o índice atual: defina o período nas actions dos
botões do menu (`VeridianPeriodo(0|1|2)`) e a detecção deixa de ser necessária.

> O botão **"Conheça a localização"** também recebe o deslocamento: `LOC_IDX = 3` + período,
> caindo na vista geral do momento do dia em que o visitante está.

### Responsividade

Auditado em 320, 360, 390, 430, 768 px e no celular deitado (844 × 390), nas quatro
telas (galeria, plantas, fachada, vídeo): sem rolagem horizontal e sem elemento vazando.

- Alvos de toque com no mínimo 40 px de altura (44 px nos botões redondos) até 900 px.
- Nenhum texto abaixo de 10 px em tela pequena.
- O selo do piso nos cards de planta some no toque — a aba ativa já traz a informação e,
  em cards baixos, ele colidia com o desenho.

> **Ao testar com screenshot:** o Chrome tem largura mínima de janela (~518 px), então
> `--window-size=390` renderiza a 518 px e corta a imagem, dando falsa impressão de
> conteúdo cortado. Meça dentro de um `<iframe>` com a largura desejada.

### Interação

- **Desktop** — hover num setor faz cross-fade `padrao → -selected`; o clique **trava**
  o setor e o recorte **desliza para fora** como destaque. O painel lateral lista as vistas
  360°; o botão **"Conheça a localização"** fica fixo no rodapé do painel.
- **Mobile (≤ 820 px)** — fachada em **tela cheia**; toca-se direto nas **regiões da torre**
  (rótulos visíveis) → destaque + um **popup (bottom-sheet)** com os pavimentos daquele setor.
  A torre ocupa só ~37 % da largura do quadro, então no toque o quadro preenche a **altura**
  e desloca para a esquerda (`margin-left: -35%`), deixando-a grande e centralizada. Como o
  vão lateral fica fora da tela, a peça **levanta no lugar** em vez de deslizar, e a torre
  sobe (`panTower`) para a faixa escolhida não ficar atrás do popup.

### Comunicação com o tour (`postMessage`)

| Mensagem | Efeito no `inject.js` |
|----------|-----------------------|
| `{ action:'goToPanorama', mediaIndex:N }` | `setMediaByIndex(N)` + `toggleAny(hide/show)` + fecha a fachada |
| `{ action:'closeGallery' }` | Fecha o overlay |

---

## Thumbnails

Todo `src` da grade usa um `thumb` leve (**900 px, JPEG q82**, achatado sobre branco).
Geração **sem dependências** no Windows via GDI+:

```powershell
./generate_thumbs.ps1          # gera apenas os que faltam / desatualizados
./generate_thumbs.ps1 -Force   # regenera todos
```

O script espelha `assets/` em `assets/thumbs/` (sempre `.jpg`, caminho minúsculo) e ignora
`thumbs/`, `videos/` e `fachada-interativa-assets/` (esta é usada em tamanho real).
Última geração: **85 MB → 5,4 MB** (57 imagens).

> Alternativa multiplataforma: `python generate_thumbs.py` (requer Python + Pillow).

---

## Deploy AWS S3

> **Windows:** use o script pronto `./deploy.ps1`. Requer **AWS CLI** + `aws configure` (região `sa-east-1`).

```powershell
./deploy.ps1              # sync completo (sem o vídeo) + cache-control no HTML/JS
./deploy.ps1 -WithVideo   # inclui o teaser — necessário na 1ª vez / ao trocá-lo
./deploy.ps1 -QuickHtml   # atualiza só index.html e inject.js (rápido)
```

O vídeo fica de fora do sync padrão (o `--exclude` também o protege do `--delete`).

> **`--cache-control "no-cache,no-store,must-revalidate"`** no HTML/JS — garante que o
> 3DVista nunca sirva uma versão cacheada da galeria ou do script.

---

## Integração 3DVista

### Passo 1 — Loader (JavaScript global do projeto)

```js
(function(){
  var s = document.createElement('script');
  s.src = 'https://skylineip.s3.sa-east-1.amazonaws.com/Tour+Virtual/wr-construtora/ferramentas/fachada-barao-do-rio-branco/inject.js?v=' + Date.now();
  document.head.appendChild(s);
})();
```

> **`?v=` + `Date.now()`** — cache-busting: força o browser a baixar sempre a versão mais
> recente do script.

### Passo 2 — Acionar nos hotspots/botões

```js
GaleriaImagens(1);      // abre galeria de imagens   · GaleriaImagens(0) fecha
GaleriaPlantas(1);      // abre galeria de plantas    · GaleriaPlantas(0) fecha
AbrirGaleriaVideos(1);  // abre o vídeo teaser         · AbrirGaleriaVideos(0) fecha
```

**Fachada interativa** — chamar na *action* do 3DVista (onde `this` é o player):

```js
AbrirFachada(this);                          // abre a fachada
AbrirFachada(this, this.getComponentByName("Tela-Inicial").mH);   // + oculta uma tela ao escolher andar
AbrirFachada(this, hideId, showId);          // + oculta hideId e exibe showId ao escolher andar
AbrirFachada(0);                             // fecha
```

---

## Cores e tipografia

Tema **off-white + petróleo** do Veridian / Kahhu:

| Token CSS | Valor | Papel |
|-----------|-------|-------|
| `--bg` (fundo) | `#F6EFE2` | Off-white — cor principal |
| `--surface` | `#EBE1CE` | Superfície de card (skeleton) |
| `--surface-2` | `#DFD2B9` | Superfície elevada / hover |
| `--dark` (foreground) | `#0B4F59` | Texto/ícones — petróleo (cor secundária) |
| `--accent` | `#0B4F59` | Petróleo — destaque / estado ativo |
| `--dark-bg` / lightbox | `#052E34` | Petróleo escuro — palco da imagem/vídeo |
| Fonte títulos | Cormorant Garamond | — |
| Fonte UI | Inter | — |

> Cards de plantas mantêm **fundo branco** (legibilidade do desenho), com texto petróleo.

---

## Pendências

- **`assets/video/`** — o teaser ainda não foi entregue. `video-gallery.html` aponta para
  `assets/video/teaser-veridian.mp4`; suba o arquivo com esse nome e rode `./deploy.ps1 -WithVideo`.
- **`LOC_IDX`** em `fachada-interativa.html` — confirmar o índice da cena de localização no tour.
