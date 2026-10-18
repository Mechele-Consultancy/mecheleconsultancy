/* Mechele Consultancy: gedeelde helpers voor intern dashboard en (later) klantportaal.
   Vereist: window.supabase (supabase-js UMD) geladen voor dit bestand. */
(function () {
  'use strict';
  var SUPABASE_URL = 'https://bgqeiwrpsgsuyomaygfa.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJncWVpd3Jwc2dzdXlvbWF5Z2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNTkyMTYsImV4cCI6MjEwNjYzNTIxNn0.pZTsa-AWwKGxFoCfLl0Pq37_f-V3sqKUSUbdfrJv1UI';

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  function $(id) { return document.getElementById(id); }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeUrl(u) { return /^https:\/\//i.test(u || '') ? esc(u) : ''; }

  function dagenTot(d) {
    if (!d) return null;
    return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  }
  function fmtDatum(d, metUur) {
    if (!d) return 'geen datum';
    var o = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Brussels' };
    if (metUur) { o.hour = '2-digit'; o.minute = '2-digit'; }
    return new Date(d).toLocaleString('nl-BE', o);
  }
  function fmtMaand(d) {
    if (!d) return '';
    return new Date(d).toLocaleString('nl-BE', { month: 'short', year: 'numeric', timeZone: 'Europe/Brussels' });
  }
  function eur(n) {
    if (n == null || n === '') return '';
    return 'EUR ' + Number(n).toLocaleString('nl-BE', { maximumFractionDigits: 0 });
  }
  function eurCent(n) {
    if (n == null || n === '') return 'EUR 0,00';
    return 'EUR ' + Number(n).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function num(v) { return v == null || v === '' ? 0 : Number(v); }
  function pct(v) { return v == null ? '-' : String(v).replace('.', ',') + '%'; }

  function dagTag(d) {
    var n = dagenTot(d);
    if (n == null) return '<span class="tag">geen deadline</span>';
    var cls = n <= 2 ? 'bad' : n <= 7 ? 'warn' : 'info';
    var txt = n < 0 ? 'verstreken' : n === 0 ? 'vandaag' : n + ' d';
    return '<span class="tag ' + cls + '">' + txt + '</span>';
  }
  function tag(txt, cls) { return '<span class="tag ' + (cls || '') + '">' + esc(txt) + '</span>'; }

  /* Contractwaarde: totaal over de looptijd plus per jaar als de looptijd gekend is */
  function waardeHtml(minv, maxv, jaren) {
    if (!minv && !maxv) return '';
    var tot = esc(eur(minv)) + ' tot ' + esc(eur(maxv));
    if (!jaren || Number(jaren) <= 0) return tot;
    var j = Number(jaren);
    return '<div>' + tot + ' <span class="muted">totaal, ' + esc(String(j).replace('.', ',')) + ' jaar</span></div>' +
      '<div class="muted">' + esc(eur(minv / j)) + ' tot ' + esc(eur(maxv / j)) + ' per jaar</div>';
  }

  function kpiTegels(lijst) {
    return lijst.map(function (k) {
      return '<div class="kpi' + (k.c ? ' ' + k.c : '') + '"><div class="v">' + esc(k.v) + '</div><div class="l">' + esc(k.l) + '</div><div class="s">' + esc(k.s || '') + '</div></div>';
    }).join('');
  }

  /* Tabs: knoppen met data-tab, panes met id "pane-<naam>". Keuze in URL-hash en localStorage. */
  function authHash() { return /access_token=|refresh_token=|error=|type=/.test(window.location.hash); }
  function initTabs(container, standaard) {
    var knoppen = Array.prototype.slice.call(container.querySelectorAll('button[data-tab]'));
    var huidig = standaard;
    function toon(naam) {
      if (!knoppen.some(function (k) { return k.getAttribute('data-tab') === naam; })) naam = standaard;
      huidig = naam;
      knoppen.forEach(function (k) {
        var actief = k.getAttribute('data-tab') === naam;
        k.setAttribute('aria-selected', actief ? 'true' : 'false');
        var pane = $('pane-' + k.getAttribute('data-tab'));
        if (pane) pane.setAttribute('aria-hidden', actief ? 'false' : 'true');
      });
      try { localStorage.setItem('mc_tab', naam); } catch (e) { /* prive venster */ }
      // De aanmeldlink zet tokens in de hash: die laten we staan tot supabase-js ze gelezen heeft.
      if (!authHash() && window.location.hash !== '#' + naam) history.replaceState(null, '', '#' + naam);
    }
    knoppen.forEach(function (k) {
      k.addEventListener('click', function () { toon(k.getAttribute('data-tab')); });
    });
    var start = authHash() ? '' : window.location.hash.replace('#', '');
    if (!start) { try { start = localStorage.getItem('mc_tab') || ''; } catch (e) { start = ''; } }
    toon(start || standaard);
    window.addEventListener('hashchange', function () {
      var h = window.location.hash.replace('#', '');
      if (h && !authHash()) toon(h);
    });
    return { toon: toon, huidig: function () { return huidig; } };
  }

  window.MC = {
    sb: sb, $: $, esc: esc, safeUrl: safeUrl, dagenTot: dagenTot, fmtDatum: fmtDatum, fmtMaand: fmtMaand,
    eur: eur, eurCent: eurCent, num: num, pct: pct, dagTag: dagTag, tag: tag, kpiTegels: kpiTegels, initTabs: initTabs, waardeHtml: waardeHtml
  };
})();
