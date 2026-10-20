(function (w, d) {
  'use strict';

  var BASE = 'https://skylineip.s3.sa-east-1.amazonaws.com/Tour+Virtual/wr-construtora/ferramentas/fachada-barao-do-rio-branco/';
  var FACHADA_URL       = BASE + 'fachada-interativa.html';

  var overlay    = null;
  var msgHandler = null;

  // ── contexto do 3DVista (preenchido pela action ao abrir a fachada) ──
  var fdvPlayer = null;   // referência ao player (this na action do 3DVista)
  var hideId    = null;   // id HTML da tela a OCULTAR ao escolher um andar
  var showId    = null;   // id HTML da tela a EXIBIR  ao escolher um andar

  // Resolve o player do 3DVista de forma tolerante (o passado na action tem prioridade)
  function _player() {
    return fdvPlayer ||
           w.player ||
           (w.tour && w.tour.player) ||
           (w.TDV && w.TDV.PlayerAPI && w.TDV.PlayerAPI.getCurrentPlayer && w.TDV.PlayerAPI.getCurrentPlayer()) ||
           null;
  }
  // Chama uma função do 3DVista (setMediaByIndex/toggleAny) seja ela global ou método do player
  function _fdvCall(fn, args) {
    var p = _player();
    try { if (p && typeof p[fn] === 'function') { p[fn].apply(p, args); return true; } } catch (e) {}
    try { if (typeof w[fn] === 'function')     { w[fn].apply(w, args);   return true; } } catch (e) {}
    return false;
  }

  // ══ PERÍODO DO TOUR (diurno · entardecer · noturno) ═══════════════
  // O tour inteiro é montado em trincas consecutivas, começando do zero:
  //   0-2  backgrounds de período (0 diurno · 1 entardecer · 2 noturno)
  //   3-5  vistas gerais
  //   6+   pavimentos (bases múltiplas de 3: 6, 9, 12 … 63)
  // Em todos os blocos a variante diurna cai em múltiplo de 3, então o
  // período é sempre `i % 3` — sem exceção, qualquer que seja a cena atual.
  // A fachada manda SEMPRE o índice diurno; aqui somamos o período atual.
  var IDX_MAX   = 99;      // teto de sanidade para descartar leituras absurdas
  var lastIndex = null;    // último índice que nós trocamos

  // Índice → período (0|1|2). Devolve null se o índice não for plausível,
  // o que também serve para descartar leituras erradas das sondagens abaixo.
  function _periodOf(i) {
    if (typeof i !== 'number' || isNaN(i)) return null;
    if (i < 0 || i > IDX_MAX || i !== Math.floor(i)) return null;
    return i % 3;
  }

  // Lê o índice do panorama atual, do mais confiável para o menos.
  // Devolve { i: índice, via: qual estratégia funcionou } ou { i: null }.
  // Toda leitura passa por _periodOf: índice fora de 1–3 / 6–65 é descartado,
  // então uma sondagem que devolva lixo não vira período errado.
  function _currentIndex() {
    var p = _player(), v, k, pl, lists;

    // 1) playlist principal do 3DVista — é onde o player guarda a mídia atual.
    //    (o setMediaByIndex dos tours normalmente é um wrapper disso)
    try {
      pl = (p && p.get && p.get('mainPlayList')) || (p && p.mainPlayList) ||
           (w.player && w.player.get && w.player.get('mainPlayList'));
      if (pl && pl.get) { v = pl.get('selectedIndex'); if (_periodOf(v) !== null) return { i: v, via: 'mainPlayList' }; }
    } catch (e) {}

    // 2) qualquer outra playlist do projeto
    try {
      lists = p.getByClassName('PlayList');
      for (k = 0; k < lists.length; k++) {
        v = lists[k].get('selectedIndex');
        if (_periodOf(v) !== null) return { i: v, via: 'PlayList[' + k + ']' };
      }
    } catch (e) {}

    // 3) helper próprio do tour, se existir
    var probes = ['getCurrentMediaIndex', 'getMediaIndex'];
    for (k = 0; k < probes.length; k++) {
      try { if (p && typeof p[probes[k]] === 'function') { v = p[probes[k]](); if (_periodOf(v) !== null) return { i: v, via: 'player.' + probes[k] }; } } catch (e) {}
      try { if (typeof w[probes[k]] === 'function')      { v = w[probes[k]]();  if (_periodOf(v) !== null) return { i: v, via: probes[k] }; } } catch (e) {}
    }

    // 4) o último que nós mesmos trocamos nesta sessão
    if (_periodOf(lastIndex) !== null) return { i: lastIndex, via: 'ultimo que trocamos' };

    // 5) ?media-index= na URL
    try {
      var q = new URL(w.location.href).searchParams.get('media-index');
      if (q) { v = parseInt(q, 10); if (_periodOf(v) !== null) return { i: v, via: 'url' }; }
    } catch (e) {}

    return { i: null, via: null };
  }

  // 0 = diurno · 1 = entardecer · 2 = noturno
  function _period() {
    var forced = w.WR_PERIODO;
    if (forced === 0 || forced === 1 || forced === 2) return forced;   // definido na action
    var pr = _periodOf(_currentIndex().i);
    return pr == null ? 0 : pr;                                        // na dúvida, diurno
  }

  function _injectStyles() {
    if (d.getElementById('_wrfi_styles')) return;
    var s = d.createElement('style');
    s.id = '_wrfi_styles';
    s.textContent =
      '@keyframes _wrfiIn{from{opacity:0}to{opacity:1}}' +
      '@keyframes _wrfiOut{to{opacity:0}}';
    d.head.appendChild(s);
  }

  function _mount(iframeSrc, bg, allow) {
    if (overlay) _close();
    _injectStyles();

    overlay = d.createElement('div');
    overlay.id = '_wrfi_overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:2147483646;' +
      'animation:_wrfiIn 0.3s ease both;';

    var iframe = d.createElement('iframe');
    iframe.src = iframeSrc;
    iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;background:' + bg + ';';
    iframe.setAttribute('allow', allow || 'fullscreen');

    overlay.appendChild(iframe);
    d.body.appendChild(overlay);

    msgHandler = function (e) {
      if (!e.data || !iframe.contentWindow || e.source !== iframe.contentWindow) return;
      if (e.data.action === 'wrfi:close') _close();
      else if (e.data.action === 'wrfi:goToPanorama') _goToPanorama(e.data.mediaIndex, e.data.period === true);
    };
    w.addEventListener('message', msgHandler);
  }

  // Abre o panorama do andar escolhido usando a API do 3DVista (sem reload):
  //   1) troca o media pelo índice (setMediaByIndex)
  //   2) oculta/exibe as telas indicadas na action (toggleAny)
  //   3) fecha a fachada, revelando o tour
  // Só recorre ao ?media-index (que recarrega o tour) se a API não existir.
  function _goToPanorama(idx, usePeriod) {
    if (idx == null) { _close(); return; }
    if (usePeriod) idx += _period();     // diurno +0 · entardecer +1 · noturno +2

    var switched = _fdvCall('setMediaByIndex', [idx]);
    lastIndex = idx;                     // guarda o período para a próxima abertura

    if (hideId) _fdvCall('toggleAny', [hideId, 0]);
    if (showId) _fdvCall('toggleAny', [showId, 1]);

    _close();

    if (!switched) {   // fallback: sem API do 3DVista → injeta na URL
      try {
        var u = new URL(w.location.href);
        u.searchParams.set('media-index', String(idx));
        w.location.href = u.toString();
      } catch (e) {
        w.location.search = '?media-index=' + idx;
      }
    }
  }

  function _close() {
    if (!overlay) return;
    overlay.style.animation = '_wrfiOut 0.25s ease forwards';
    var ref = overlay;
    setTimeout(function () {
      if (ref.parentNode) ref.parentNode.removeChild(ref);
    }, 260);
    overlay = null;
    if (msgHandler) {
      w.removeEventListener('message', msgHandler);
      msgHandler = null;
    }
  }

  // ── API pública ──────────────────────────────────────────────
  // ── Período: diagnóstico e override ───────────────────────────
  // PeriodoWR()      → o que o script está detectando agora (para conferir)
  // PeriodoWR(0|1|2) → força diurno | entardecer | noturno
  // PeriodoWR(null)  → volta para a detecção automática
  var NOMES = ['diurno', 'entardecer', 'noturno'];
  w.PeriodoWR = function (p) {
    if (p === 0 || p === 1 || p === 2) { w.WR_PERIODO = p; return NOMES[p]; }
    if (p === null) { w.WR_PERIODO = undefined; }
    var c = _currentIndex(), pr = _period();
    return {
      indiceAtual: c.i,
      via: c.via,
      periodo: pr,
      nome: NOMES[pr],
      forcado: (w.WR_PERIODO === 0 || w.WR_PERIODO === 1 || w.WR_PERIODO === 2),
      detectou: c.i !== null
    };
  };

  // DebugWR() → texto com o que o tour expõe. Se a detecção falhar,
  // rode isso e mande o resultado: dá para ver qual API o projeto oferece.
  w.DebugWR = function () {
    var p = _player(), out = [], k, pl, lists;
    out.push('player encontrado: ' + (p ? 'sim' : 'NAO'));
    if (p) {
      out.push('tem get(): ' + (typeof p.get === 'function'));
      out.push('tem setMediaByIndex(): ' + (typeof p.setMediaByIndex === 'function'));
      try { pl = p.get('mainPlayList') || p.mainPlayList;
            out.push('mainPlayList: ' + (pl ? 'sim, selectedIndex=' + pl.get('selectedIndex') : 'nao')); }
      catch (e) { out.push('mainPlayList: erro ' + e.message); }
      try { lists = p.getByClassName('PlayList');
            out.push('playlists: ' + lists.length);
            for (k = 0; k < lists.length; k++) {
              out.push('  [' + k + '] id=' + (lists[k].get('id') || '?') + ' selectedIndex=' + lists[k].get('selectedIndex'));
            } }
      catch (e) { out.push('getByClassName(PlayList): erro ' + e.message); }
    }
    out.push('setMediaByIndex global: ' + (typeof w.setMediaByIndex === 'function'));
    out.push('leitura escolhida: ' + JSON.stringify(_currentIndex()));
    out.push('periodo resultante: ' + _period() + ' (' + NOMES[_period()] + ')');
    return out.join('\n');
  };

  // ── Fachada Interativa ────────────────────────────────────────
  // Chame na ACTION do 3DVista (onde `this` é o player e os IDs são válidos):
  //
  //   // abre a fachada:
  //   AbrirFachada(this);
  //   // abre e, ao escolher um andar, oculta a tela inicial:
  //   AbrirFachada(this, this.getComponentByName("Tela-Inicial").mH);
  //   // opcional: também exibir uma tela ao escolher um andar:
  //   AbrirFachada(this, this.getComponentByName("Tela-Inicial").mH,
  //                      this.getComponentByName("HUD-Andar").mH);
  //   // fecha:
  //   AbrirFachada(0);
  //
  // Ao clicar em "ver vista" o panorama troca por setMediaByIndex (sem reload),
  // as telas indicadas são ocultadas/exibidas por toggleAny e a fachada fecha.
  w.AbrirFachadaWR = w.AbrirFachada = function (arg, hide, show) {
    if (arg === 0 || arg === false || arg == null) { _close(); return; }
    if (typeof arg === 'object') fdvPlayer = arg;   // captura o player (this)
    if (hide !== undefined) hideId = hide || null;
    if (show !== undefined) showId = show || null;
    _mount(FACHADA_URL + '?v=' + Date.now(), '#F6EFE2');
  };

}(window, document));
