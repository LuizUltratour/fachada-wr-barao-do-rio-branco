# Fachada Interativa — WR Barão do Rio Branco

Fachada interativa do empreendimento para injeção via script no 3DVista, hospedada no AWS S3.
O usuário escolhe um setor da torre, depois um pavimento, e o tour troca para o panorama 360° correspondente.

**Repositório:** https://github.com/LuizUltratour/fachada-wr-barao-do-rio-branco

---

## URLs de produção

| Arquivo | URL |
|---------|-----|
| Fachada Interativa | `https://skylineip.s3.sa-east-1.amazonaws.com/Tour+Virtual/wr-construtora/ferramentas/fachada-barao-do-rio-branco/fachada-interativa.html` |
| Script (loader) | `https://skylineip.s3.sa-east-1.amazonaws.com/Tour+Virtual/wr-construtora/ferramentas/fachada-barao-do-rio-branco/inject.js` |

**S3 path:** `s3://skylineip/Tour Virtual/wr-construtora/ferramentas/fachada-barao-do-rio-branco/`

---

## Estrutura de arquivos

```
fachada-wr/
├── fachada-interativa.html   ← a fachada (auto-suficiente: HTML + CSS + JS)
├── inject.js                 ← loader do 3DVista: abre a fachada em overlay e troca o panorama
├── deploy.ps1                ← deploy para o S3
├── 3dvista-snippets.md       ← trechos para colar no 3DVista
└── assets/
    ├── design/                       ← bg.png (fundo) · logo-barao-do-rio-branco.png
    └── fachada-interativa-assets/
        ├── fachada.png               ← torre completa (base em repouso)
        ├── fachada-4-12.png          ← torre com o setor 6º–12º em destaque
        ├── fachada-14-22.png         ← torre com o setor 14º–22º em destaque
        ├── fachada-24-34.png         ← torre com o setor 24º–34º em destaque
        └── partes-separadas/         ← recortes de cada setor (-normal / -hover / -pressed)
```

> Os PNGs da torre têm 517 × 1053, com a metade esquerda transparente; a página mostra só a metade
> direita. As partes separadas têm 259 × 1053 e já trazem a posição vertical embutida.
> Hoje só o `-normal` é usado; `-hover` e `-pressed` estão disponíveis.

---

## Setores e mapeamento pavimento → índice do panorama

Configuração no objeto `FI` dentro do `fachada-interativa.html`. O 34º é o índice 6 e, daí para baixo,
o passo é de 3 por pavimento listado (32º = 9, 30º = 12 … 6º = 48).

| Setor | Faixa | Pavimentos com panorama |
|-------|-------|-------------------------|
| C | 24º ao 34º | 34, 32, 30, 28, 26, 24 |
| B | 14º ao 22º | 22, 20, 18, 16, 14 |
| A | 6º ao 12º  | 12, 10, 8, 6 |

- Pavimentos com `hide:true` ficam ocultos nas opções (temporário). Hoje: **18, 14, 12 e 10**.
  Para reexibir, remova o `hide:true`.
- `LOC_IDX` é o índice da vista geral (botão "Conheça a localização").
- Os índices passados são sempre os **diurnos**; o `inject.js` soma o período atual
  (diurno +0 · entardecer +1 · noturno +2).

### Comunicação com o tour (`postMessage`)

A página (em iframe) envia ao `inject.js`:

- `{ action: 'wrfi:goToPanorama', mediaIndex, period }` → troca o panorama por `setMediaByIndex` e fecha a fachada
- `{ action: 'wrfi:close' }` → fecha a fachada

---

## Deploy AWS S3

Pré-requisito: AWS CLI instalado e `aws configure` (região `sa-east-1`).

```powershell
./deploy.ps1             # sync dos assets da fachada + HTML + inject.js
./deploy.ps1 -QuickHtml  # só o fachada-interativa.html e o inject.js (rápido)
```

O `deploy.ps1` envia `fachada-interativa.html`, `inject.js`, `assets/fachada-interativa-assets` e `assets/design`.
HTML e JS sobem com `cache-control: no-cache`.

---

## Integração 3DVista

Os trechos prontos estão em [3dvista-snippets.md](3dvista-snippets.md).

1. **Loader** no JavaScript global do projeto:

```js
(function(){
  var s = document.createElement('script');
  s.src = 'https://skylineip.s3.sa-east-1.amazonaws.com/Tour+Virtual/wr-construtora/ferramentas/fachada-barao-do-rio-branco/inject.js?v=' + Date.now();
  document.head.appendChild(s);
})();
```

2. **Action** do hotspot/botão (onde `this` é o player):

```js
AbrirFachada(this);
```

Fechar: `AbrirFachada(0);`

Se outro script do tour (ex.: outra galeria) também definir `AbrirFachada`, use o alias `AbrirFachadaWR(this)` / `AbrirFachadaWR(0)`. Os ids, estilos e mensagens do overlay usam o prefixo `wrfi` justamente para não colidir.
