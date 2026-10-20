# Trechos para colar no 3DVista — WR Barão do Rio Branco

Copie daqui. Cada bloco é independente.

---

## 1. Loader — cole no **JavaScript global do projeto** (roda uma vez)

```js
(function(){
  var s = document.createElement('script');
  s.src = 'https://skylineip.s3.sa-east-1.amazonaws.com/Tour+Virtual/wr-construtora/ferramentas/fachada-barao-do-rio-branco/inject.js?v=' + Date.now();
  document.head.appendChild(s);
})();
```

---

## 2. Fachada interativa — cole na **action** do hotspot/botão

> Tem de ser numa *action* do 3DVista, onde `this` é o player. É por `this` que o
> script acha o `setMediaByIndex` para trocar o panorama sem recarregar o tour.

Abrir só a fachada (sem mexer em telas):

```js
AbrirFachada(this);
```

Abrir e, ao escolher um pavimento, **exibir a Tela-Experiencia**:

```js
AbrirFachada(this, null, this.getComponentByName("Tela-Experiencia").mH);
```

Abrir e, ao escolher um pavimento, **ocultar a Tela-Inicial e exibir a Tela-Experiencia**:

```js
AbrirFachada(this, this.getComponentByName("Tela-Inicial").mH, this.getComponentByName("Tela-Experiencia").mH);
```

Fechar a fachada:

```js
AbrirFachada(0);
```

Limpar os toggles guardados de uma chamada anterior:

```js
AbrirFachada(this, null, null);
```

---

## 3. Período do dia (diurno / entardecer / noturno)

Na maioria dos casos **não precisa fazer nada**: o script lê o panorama atual e soma
sozinho o deslocamento (diurno +0, entardecer +1, noturno +2) ao pavimento escolhido.

> A URL do tour **não muda** — isso é esperado. Só significa que o `setMediaByIndex`
> funcionou e não precisamos do `?media-index=`. Não serve para saber se o período foi
> aplicado; use o `PeriodoWR()` abaixo.

Para conferir o que ele está detectando, cole numa action de teste:

```js
alert(JSON.stringify(PeriodoWR()));
```

Se precisar de mais detalhe (para me mandar), use:

```js
alert(DebugWR());
```

Se aparecer `"detectou":false`, o tour não expõe o índice atual. Nesse caso, cole uma
linha em cada botão do menu de período:

Botão **Diurno**:

```js
PeriodoWR(0);
```

Botão **Entardecer**:

```js
PeriodoWR(1);
```

Botão **Noturno**:

```js
PeriodoWR(2);
```

Voltar para a detecção automática:

```js
PeriodoWR(null);
```

---

## 4. Conferir o mapa de índices do tour

Cole no **console do navegador** (F12) com o tour aberto. Lista todas as cenas com o
índice que o `setMediaByIndex` usa — serve para confirmar o mapeamento dos pavimentos,
dos períodos e o índice da cena de localização:

```js
(function () {
  var p = window.player || (window.TDV && TDV.PlayerAPI.getCurrentPlayer());
  var pl = p.get('mainPlayList');
  var items = pl.get('items') || [];
  var out = [];
  for (var i = 0; i < items.length; i++) {
    var nome = '?';
    try {
      var m = items[i].get('media');
      nome = m.get('label') || (m.get('data') && m.get('data').label) || m.get('id') || '?';
    } catch (e) {}
    out.push(i + '\t' + nome);
  }
  console.log(out.join('\n'));
  return items.length + ' cenas (veja a lista no console)';
})();
```

Se der erro em `get('items')`, troque `items` por `get('playList')` ou me mande o erro.

---

## Observações

- **Troque `"Tela-Experiencia"` pelo nome exato do componente no seu projeto** — o
  `getComponentByName` é sensível a maiúsculas, acentos e espaços. Se o nome tiver
  acento (ex.: `Tela-Experiência`), escreva igual está no 3DVista.
- Ao escolher um pavimento o script faz, nesta ordem: `setMediaByIndex(idx)` →
  `toggleAny(hide, 0)` → `toggleAny(show, 1)` → fecha a fachada.
- O botão **"Conheça a localização"** passa pelo mesmo caminho, então também dispara
  os toggles.
- Os IDs de hide/show **ficam guardados** entre chamadas: um `AbrirFachada(this)` depois
  mantém o que foi definido antes. Use `AbrirFachada(this, null, null)` para limpar.
