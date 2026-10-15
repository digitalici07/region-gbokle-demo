/* ==========================================================
   RÉGION DU GBÔKLÈ — comportements du site
   (navigation, animations, contenu dynamique depuis data/contenu.json)
   ========================================================== */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  root.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); };
  var fmtDate = function (d) { try { return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return d; } };
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  /* ---------- en-tête : compact / masqué au défilement, barre de progression ---------- */
  var header = $('.site-header'), prog = $('.progress'), totop = $('.totop');
  var lastY = 0, ticking = false;
  function onScroll() {
    var y = window.scrollY, h = root.scrollHeight - innerHeight;
    if (header) {
      header.classList.toggle('compact', y > 40);
      var open = doc.body.classList.contains('menu-open');
      header.classList.toggle('hide', !open && y > 400 && y > lastY + 4);
      if (y < lastY - 4) header.classList.remove('hide');
    }
    if (prog) prog.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    if (totop) totop.classList.toggle('show', y > 700);
    lastY = y;
    parallax(y);
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  if (totop) totop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---------- menu plein écran ---------- */
  var mega = $('#megamenu'), menuBtn = $('#menuBtn');
  function setMenu(open) {
    if (!mega) return;
    if (open) mega.scrollTop = 0;
    mega.classList.toggle('open', open);
    doc.body.classList.toggle('menu-open', open);
    doc.body.style.overflow = open ? 'hidden' : '';
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.querySelector('.lbl').textContent = open ? 'Fermer' : 'Menu';
    if (open) header.classList.remove('hide');
    mega.inert = !open;
  }
  if (mega) {
    mega.inert = true;
    $$('.mega-col a', mega).forEach(function (a, i) { a.style.setProperty('--i', i % 8); a.addEventListener('click', function () { setMenu(false); }); });
    menuBtn.addEventListener('click', function () { setMenu(!mega.classList.contains('open')); });
  }

  /* ---------- recherche ---------- */
  var sbox = $('#searchbox'), sinp = $('#searchInput'), sres = $('#searchRes'), DATA = null, INDEX = [];
  var PAGES = [
    ['Accueil', 'index.html', 'accueil région gbôklè sassandra fresco'],
    ['Le Conseil régional', 'institution.html', 'institution président élus conseil commissions services'],
    ['Le territoire', 'territoire.html', 'territoire départements sassandra fresco carte histoire'],
    ['Actualités', 'actualites.html', 'actualités agenda presse communiqués'],
    ['Services et aides', 'services.html', 'aides démarches documents marchés publics recrutement'],
    ['Investir et découvrir', 'investir.html', 'économie investir hévéa cacao pêche tourisme plages'],
    ['Contact', 'contact.html', 'contact adresse téléphone écrire'],
    ['Mentions légales', 'mentions-legales.html', 'mentions légales confidentialité plan du site accessibilité']
  ];
  function buildIndex() {
    INDEX = PAGES.map(function (p) { return { t: p[0], u: p[1], k: p[2], c: 'Page', d: '' }; });
    if (!DATA) return;
    DATA.news.forEach(function (n) { INDEX.push({ t: n.titre, u: 'actualite.html?id=' + n.id, k: n.cat + ' ' + n.resume, c: 'Actualité', d: n.resume }); });
    DATA.aides.forEach(function (a) { INDEX.push({ t: a.titre, u: 'services.html#aides', k: a.theme + ' ' + a.profils.join(' ') + ' ' + a.resume, c: 'Aide', d: a.resume }); });
    DATA.documents.forEach(function (d) { INDEX.push({ t: d.titre, u: 'services.html#documents', k: d.cat, c: 'Document', d: d.cat }); });
  }
  var norm = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  function doSearch() {
    var q = norm(sinp.value.trim());
    if (q.length < 2) { sres.innerHTML = '<li class="search-hint">Tapez au moins 2 lettres : hévéa, bourses, marchés publics…</li>'; return; }
    var words = q.split(/\s+/);
    var hits = INDEX.filter(function (i) { var h = norm(i.t + ' ' + i.k); return words.every(function (w) { return h.indexOf(w) > -1; }); }).slice(0, 12);
    sres.innerHTML = hits.length ? hits.map(function (h) { return '<li><a href="' + esc(h.u) + '"><small>' + esc(h.c) + '</small><b>' + esc(h.t) + '</b>' + (h.d ? '<p>' + esc(h.d) + '</p>' : '') + '</a></li>'; }).join('') : '<li class="search-hint">Aucun résultat pour « ' + esc(sinp.value) + ' ».</li>';
  }
  function setSearch(open) {
    if (!sbox) return;
    sbox.classList.toggle('open', open);
    doc.body.style.overflow = open ? 'hidden' : '';
    if (open) { setMenu(false); loadData().then(buildIndex); sinp.value = ''; doSearch(); setTimeout(function () { sinp.focus(); }, 60); }
  }
  $$('[data-open-search]').forEach(function (b) { b.addEventListener('click', function () { setSearch(true); }); });
  if (sbox) {
    sinp.addEventListener('input', doSearch);
    $('#searchClose').addEventListener('click', function () { setSearch(false); });
    sbox.addEventListener('click', function (e) { if (e.target === sbox) setSearch(false); });
  }
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setSearch(false); setMenu(false); }
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(doc.activeElement.tagName)) { e.preventDefault(); setSearch(true); }
  });

  /* ---------- données ---------- */
  var dataP = null;
  function loadData() {
    if (!dataP) dataP = fetch('data/contenu.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) { DATA = d; return d; }).catch(function () { return null; });
    return dataP;
  }

  /* ---------- illustrations de repli pour les actualités ---------- */
  var ART = {
    'Pêche': ['#0A2A6B', '#2E8BD8', 'wave'], 'Hévéaculture': ['#3F6B10', '#9CC93A', 'leaf'], 'Éducation': ['#1769B8', '#F7B500', 'book'],
    'Infrastructures': ['#44527A', '#F7B500', 'road'], 'Culture': ['#7A2E8A', '#F7B500', 'sun'], 'Environnement': ['#2E7D32', '#9CC93A', 'leaf']
  };
  function art(cat) {
    var a = ART[cat] || ['#0A2A6B', '#1769B8', 'wave'], g = 'g' + Math.random().toString(36).slice(2, 7), m = '';
    if (a[2] === 'wave') m = '<path d="M0 170q50-26 100 0t100 0 100 0 100 0v80H0z" fill="rgba(255,255,255,.18)"/><path d="M0 200q50-22 100 0t100 0 100 0 100 0v50H0z" fill="rgba(255,255,255,.22)"/><path d="M150 150l50-70 50 70z" fill="#fff" opacity=".9"/><path d="M120 156h130l-14 22h-102z" fill="#071E4E"/>';
    if (a[2] === 'leaf') m = '<path d="M200 190V90M200 130c-40 0-70-30-70-66 40 0 70 30 70 66zM200 150c40 0 70-30 70-66-40 0-70 30-70 66z" fill="rgba(255,255,255,.85)" stroke="rgba(255,255,255,.9)" stroke-width="3"/><path d="M0 220q100-40 200-10t200-10v50H0z" fill="rgba(0,0,0,.18)"/>';
    if (a[2] === 'book') m = '<path d="M110 90q45-18 90 10v90q-45-28-90-10zM290 90q-45-18-90 10v90q45-28 90-10z" fill="#fff" opacity=".92"/><path d="M0 225h400v25H0z" fill="rgba(0,0,0,.18)"/>';
    if (a[2] === 'road') m = '<path d="M150 250l40-170h20l40 170z" fill="rgba(0,0,0,.35)"/><path d="M200 250v-30M200 200v-30M200 150v-30" stroke="#fff" stroke-width="5" stroke-dasharray="14 14"/>';
    if (a[2] === 'sun') m = '<g fill="#fff" opacity=".92"><path d="M110 200h180v14H110zM120 90h160l-80-34zM130 100h14v94h-14zM162 100h14v94h-14zM224 100h14v94h-14zM256 100h14v94h-14z"/></g>';
    return '<svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration ' + esc(cat) + '"><defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + a[0] + '"/><stop offset="1" stop-color="' + a[1] + '"/></linearGradient></defs><rect width="400" height="250" fill="url(#' + g + ')"/><circle cx="330" cy="62" r="34" fill="#F7B500" opacity=".92"/>' + m + '</svg>';
  }
  function media(n) { return n.image ? '<img src="' + esc(n.image) + '" alt="" loading="lazy">' : art(n.cat); }

  /* ---------- cartes d'actualités ---------- */
  function newsCard(n, big) {
    return '<a class="news-card' + (big ? ' big' : '') + '" href="actualite.html?id=' + esc(n.id) + '" data-reveal><div class="news-img">' + media(n) + '<span class="chip">' + esc(n.cat) + '</span></div><div class="news-body"><time datetime="' + esc(n.date) + '">' + fmtDate(n.date) + '</time><h3>' + esc(n.titre) + '</h3><p>' + esc(n.resume) + '</p><span class="link-arrow">Lire la suite ' + ARROW + '</span></div></a>';
  }
  function sortedNews(d) { return d.news.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }); }

  function renderNewsHome(d) {
    var el = $('#newsHome'); if (!el) return;
    el.innerHTML = sortedNews(d).slice(0, 6).map(function (n, i) { return newsCard(n, i === 0); }).join('');
    stagger(el);
  }
  function renderNewsList(d) {
    var el = $('#newsList'); if (!el) return;
    var cats = ['Toutes'].concat(Array.from(new Set(d.news.map(function (n) { return n.cat; }))));
    var f = $('#newsFilters');
    function draw(cat) {
      var list = sortedNews(d).filter(function (n) { return cat === 'Toutes' || n.cat === cat; });
      el.innerHTML = list.map(function (n) { return newsCard(n, false); }).join('') || '<p>Aucune actualité dans cette catégorie.</p>';
      stagger(el);
    }
    f.innerHTML = cats.map(function (c, i) { return '<button type="button" aria-pressed="' + (i === 0) + '">' + esc(c) + '</button>'; }).join('');
    f.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      $$('button', f).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      draw(b.textContent);
    });
    draw('Toutes');
  }
  function renderArticle(d) {
    var el = $('#article'); if (!el) return;
    var id = new URLSearchParams(location.search).get('id');
    var n = d.news.filter(function (x) { return x.id === id; })[0] || sortedNews(d)[0];
    doc.title = n.titre + ' — Région du Gbôklè';
    $('#artTitle').textContent = n.titre;
    $('#artLead').textContent = n.resume;
    $('#artCrumb').textContent = n.cat;
    var html = '', inList = false;
    n.corps.split('\n').forEach(function (l) {
      l = l.trim();
      if (l.indexOf('- ') === 0) { if (!inList) { html += '<ul>'; inList = true; } html += '<li>' + esc(l.slice(2)) + '</li>'; return; }
      if (inList) { html += '</ul>'; inList = false; }
      if (l.indexOf('## ') === 0) html += '<h2>' + esc(l.slice(3)) + '</h2>';
      else if (l) html += '<p>' + esc(l) + '</p>';
    });
    if (inList) html += '</ul>';
    el.innerHTML = '<div class="article-img">' + media(n) + '</div><div class="article-meta"><span class="chip">' + esc(n.cat) + '</span><time datetime="' + esc(n.date) + '">' + fmtDate(n.date) + '</time></div><div class="prose">' + html + '</div>';
    var more = $('#moreNews');
    if (more) { more.innerHTML = sortedNews(d).filter(function (x) { return x.id !== n.id; }).slice(0, 3).map(function (x) { return newsCard(x, false); }).join(''); stagger(more); }
  }

  /* ---------- agenda, documents, élus, chiffres, coordonnées ---------- */
  function renderAgenda(d) {
    $$('[data-agenda]').forEach(function (el) {
      var lim = +el.getAttribute('data-agenda') || 99;
      var today = new Date().toISOString().slice(0, 10);
      var list = d.agenda.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      var up = list.filter(function (a) { return a.date >= today; });
      if (up.length) list = up;
      el.innerHTML = list.slice(0, lim).map(function (a) {
        var dt = new Date(a.date + 'T12:00:00');
        return '<div class="ag-item" data-reveal><div class="ag-date"><b>' + dt.getDate() + '</b><span>' + dt.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '') + '</span></div><div><h3>' + esc(a.titre) + '</h3><p>' + esc(a.lieu) + ' — ' + esc(a.desc) + '</p></div></div>';
      }).join('');
      stagger(el);
    });
  }
  function renderDocs(d) {
    var el = $('#docsList'); if (!el) return;
    var cats = ['Tous'].concat(Array.from(new Set(d.documents.map(function (x) { return x.cat; }))));
    var f = $('#docFilters');
    function draw(c) {
      el.innerHTML = d.documents.filter(function (x) { return c === 'Tous' || x.cat === c; }).map(function (x) {
        var has = !!x.fichier;
        return '<a class="doc" data-reveal ' + (has ? 'href="' + esc(x.fichier) + '" target="_blank" rel="noopener"' : 'href="contact.html" title="Document bientôt disponible : contactez-nous"') + '><span class="pdf">PDF</span><div><b>' + esc(x.titre) + '</b><small>' + esc(x.cat) + ' · ' + fmtDate(x.date) + (has ? '' : ' · bientôt en ligne') + '</small></div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg></a>';
      }).join('');
      stagger(el);
    }
    f.innerHTML = cats.map(function (c, i) { return '<button type="button" aria-pressed="' + (i === 0) + '">' + esc(c) + '</button>'; }).join('');
    f.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; $$('button', f).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); draw(b.textContent); });
    draw('Tous');
  }
  function renderElus(d) {
    var el = $('#elus'); if (!el) return;
    el.innerHTML = d.elus.map(function (e) {
      var ini = e.nom.replace(/[\[\]]/g, '').split(/\s+/).filter(Boolean).slice(-2).map(function (w) { return w[0]; }).join('').toUpperCase();
      return '<div class="elu" data-reveal><div class="avatar">' + (e.photo ? '<img src="' + esc(e.photo) + '" alt="' + esc(e.nom) + '" loading="lazy">' : esc(ini)) + '</div><h3>' + esc(e.nom) + '</h3><p>' + esc(e.fonction) + '</p></div>';
    }).join('');
    stagger(el);
  }
  function renderStats(d) {
    var el = $('#statsGrid'); if (!el) return;
    el.innerHTML = d.stats.map(function (s) { return '<div class="stat" data-reveal><b data-count="' + s.valeur + '" data-suffix="' + esc(s.suffixe) + '">0</b><span>' + esc(s.label) + '</span></div>'; }).join('');
    var note = $('#statsNote'); if (note) note.hidden = !d.site.chiffres_a_valider;
    stagger(el); observe(el);
  }
  function fillSite(d) {
    $$('[data-site]').forEach(function (el) {
      var v = d.site[el.getAttribute('data-site')]; if (v == null) return;
      if (el.tagName === 'A') { var k = el.getAttribute('data-site'); el.href = k === 'email' ? 'mailto:' + v : k === 'telephone' ? 'tel:' + v.replace(/\s/g, '') : v; if (!el.hasAttribute('data-keep')) el.textContent = v; }
      else el.textContent = v;
    });
  }

  /* ---------- moteur de recherche d'aides ---------- */
  function initFinder(d) {
    var form = $('#finderForm'); if (!form) return;
    var p = $('#fProfil'), t = $('#fTheme'), out = $('#finderRes');
    p.innerHTML = '<option value="">Tous les profils</option>' + d.profils.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
    t.innerHTML = '<option value="">Tous les domaines</option>' + d.themes.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
    function run(scroll) {
      var list = d.aides.filter(function (a) { return (!p.value || a.profils.indexOf(p.value) > -1) && (!t.value || a.theme === t.value); });
      out.innerHTML = list.length ? list.map(function (a) { return '<article class="res-card"><small>' + esc(a.theme) + '</small><h3>' + esc(a.titre) + '</h3><p>' + esc(a.resume) + '</p><a class="link-arrow" href="' + esc(a.lien) + '">Faire une demande ' + ARROW + '</a></article>'; }).join('') : '<p class="res-empty">Aucun dispositif ne correspond pour le moment. <a href="contact.html">Contactez nos services</a> : nous vous orienterons.</p>';
      if (scroll) out.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); run(true); });
    if (form.hasAttribute('data-auto')) { run(false); p.addEventListener('change', run); t.addEventListener('change', run); }
  }

  /* ---------- héros : décor animé + diaporama ---------- */
  var PAL = {
    dawn: { s: ['#1F3E8F', '#4E7FD0', '#F2B77A', '#FFE6A8'], sun: ['#FFD27A', 380], hill: ['#173D80', '#0F2C63', '#0A2250'], sea: ['#2C62B4', '#1E4E9A', '#143D80'] },
    day: { s: ['#1769B8', '#5CB1EC', '#BFE3F8', '#F2F9FE'], sun: ['#FFE066', 190], hill: ['#2A7DB8', '#1B6399', '#0F4C7E'], sea: ['#3A9BE0', '#2884CB', '#176DB0'] },
    dusk: { s: ['#1B2A6E', '#7A4E9A', '#F28A5C', '#FFD27A'], sun: ['#FFB04D', 440], hill: ['#232C6A', '#161D52', '#0E1440'], sea: ['#5A4A9A', '#3F3A86', '#2A2C70'] }
  };
  function wave(y, amp, len, fill, cls, par) {
    var d = 'M-400 ' + y, x = -400, up = true;
    d += ' Q' + (x + len / 4) + ' ' + (y - amp) + ' ' + (x + len / 2) + ' ' + y;
    for (x = -400 + len / 2; x < 2100; x += len / 2) d += ' T' + (x + len / 2) + ' ' + y;
    return '<g class="par" data-s="' + par + '"><g class="wave ' + cls + '"><path d="' + d + ' V900 H-400Z" fill="' + fill + '"/></g></g>';
  }
  function palm(x, y, s, c) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="' + c + '"><path d="M-5 0Q-2 -90 6 -170L13 -168Q4 -88 7 0z"/><path d="M8 -170C-30 -200 -80 -190 -110 -150 -70 -170 -30 -175 8 -160z"/><path d="M8 -170C40 -210 90 -205 125 -165 85 -182 45 -182 8 -160z"/><path d="M8 -170C-10 -215 -40 -240 -80 -240 -40 -225 -15 -200 8 -160z"/><path d="M8 -170C25 -220 60 -245 100 -240 60 -225 30 -200 8 -160z"/><path d="M8 -170C-40 -150 -70 -120 -78 -85 -50 -120 -20 -140 8 -160z"/><path d="M8 -170C50 -150 85 -120 92 -85 60 -118 30 -140 8 -160z"/></g>';
  }
  function scene(kind) {
    var P = PAL[kind] || PAL.dawn, sy = P.sun[1];
    return '<div class="scene" style="--s1:' + P.s[0] + ';--s2:' + P.s[1] + ';--s3:' + P.s[2] + ';--s4:' + P.s[3] + '"><div class="sky"></div>' +
      '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' +
      '<defs><radialGradient id="glow' + kind + '"><stop offset="0" stop-color="' + P.sun[0] + '" stop-opacity=".75"/><stop offset="1" stop-color="' + P.sun[0] + '" stop-opacity="0"/></radialGradient></defs>' +
      '<g class="par" data-s="-.02"><circle cx="1180" cy="' + sy + '" r="330" fill="url(#glow' + kind + ')"/><circle class="sun" cx="1180" cy="' + sy + '" r="92" fill="' + P.sun[0] + '"/></g>' +
      '<g class="par" data-s=".05"><g class="cloud"><ellipse cx="300" cy="190" rx="130" ry="26" fill="#fff" opacity=".55"/><ellipse cx="380" cy="168" rx="90" ry="24" fill="#fff" opacity=".6"/></g><g class="cloud c2"><ellipse cx="900" cy="130" rx="150" ry="22" fill="#fff" opacity=".4"/><ellipse cx="980" cy="112" rx="80" ry="20" fill="#fff" opacity=".45"/></g></g>' +
      '<g class="par" data-s=".08"><g class="bird" fill="none" stroke="#071E4E" stroke-width="3" stroke-linecap="round" opacity=".7"><path d="M200 250q14-16 28 0q14-16 28 0"/><path d="M270 280q10-12 20 0q10-12 20 0"/><path d="M160 290q8-10 16 0q8-10 16 0"/></g></g>' +
      '<g class="par" data-s=".1"><path d="M-100 560C100 470 220 500 340 540C480 440 620 470 760 560V600H-100z" fill="' + P.hill[0] + '" opacity=".55"/><path d="M900 570C1040 490 1160 500 1280 556C1400 500 1500 510 1700 580V600H900z" fill="' + P.hill[0] + '" opacity=".5"/></g>' +
      wave(600, 14, 420, P.sea[0], 'w1', '.14') + wave(660, 18, 360, P.sea[1], 'w2', '.2') +
      '<g class="par" data-s=".22"><g transform="translate(820 640)"><path d="M-70 0h140l-24 26h-92z" fill="#071E4E"/><path d="M0 -4V-96" stroke="#071E4E" stroke-width="5"/><path d="M4 -94L62 -12H4z" fill="#fff" opacity=".92"/></g></g>' +
      wave(730, 22, 300, P.sea[2], 'w3', '.3') +
      '<g class="par" data-s=".38"><path d="M-100 900V760C60 700 200 690 330 740C470 790 560 800 640 830V900z" fill="' + P.hill[1] + '"/>' + palm(150, 770, 1.1, P.hill[2]) + palm(300, 790, .8, P.hill[2]) + '</g>' +
      '<g class="par" data-s=".5"><path d="M1000 900V820C1120 790 1260 770 1400 790C1500 804 1580 780 1700 760V900z" fill="' + P.hill[2] + '"/>' + palm(1450, 800, 1.3, P.hill[2]) + palm(1330, 820, .9, P.hill[2]) + '</g>' +
      '</svg></div>';
  }
  function words(s) { return s.split(' ').map(function (w, i) { return '<span class="w"><span style="--d:' + i + '">' + esc(w) + '</span></span> '; }).join(''); }

  function initHero(d) {
    var box = $('#heroSlides'); if (!box || !d.hero.length) return;
    var txt = $('#heroTxt'), dots = $('#heroDots'), cur = 0, timer = null, paused = false, DUR = 7500;
    var conn = navigator.connection || {}, canVideo = !reduce && !conn.saveData && !/2g/.test(conn.effectiveType || '');
    box.innerHTML = d.hero.map(function (h, i) { return '<div class="slide' + (i ? '' : ' on') + '" aria-hidden="' + (i ? 'true' : 'false') + '">' + (h.image ? '<div class="slide-bg" style="background-image:url(\'' + esc(h.image) + '\')"></div>' + (h.video && canVideo ? '<video class="slide-video" muted loop playsinline preload="none" data-src="' + esc(h.video) + '" poster="' + esc(h.image) + '" aria-hidden="true" tabindex="-1"></video>' : '') : scene(h.scene)) + '</div>'; }).join('');
    txt.innerHTML = d.hero.map(function (h, i) {
      return '<div class="hslide-txt' + (i ? '' : ' on') + '" ' + (i ? 'aria-hidden="true"' : '') + '><span class="kicker">' + esc(h.kicker) + '</span><h1 aria-label="' + esc(h.ligne1 + ' ' + h.accent) + '">' + words(h.ligne1) + '<span class="acc">' + words(h.accent) + '</span></h1><p class="sub">' + esc(h.ligne2) + '</p><p class="lead">' + esc(h.texte) + '</p><div class="hero-cta"><a class="btn btn-sun" href="' + esc(h.cta1[1]) + '">' + esc(h.cta1[0]) + ARROW + '</a><a class="btn btn-ghost" href="' + esc(h.cta2[1]) + '">' + esc(h.cta2[0]) + '</a></div></div>';
    }).join('');
    dots.innerHTML = d.hero.map(function (h, i) { return '<button type="button" class="' + (i ? '' : 'on') + '" aria-label="Diapositive ' + (i + 1) + '"></button>'; }).join('');
    dots.style.setProperty('--dur', DUR + 'ms');
    var slides = $$('.slide', box), texts = $$('.hslide-txt', txt), db = $$('button', dots);
    function go(n) {
      cur = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('on', i === cur); s.setAttribute('aria-hidden', i !== cur); playVideo(s, i === cur); });
      texts.forEach(function (s, i) { s.classList.toggle('on', i === cur); s.setAttribute('aria-hidden', i !== cur); });
      db.forEach(function (b, i) { b.classList.remove('on'); void b.offsetWidth; b.classList.toggle('on', i === cur); });
      schedule();
    }
    function playVideo(slide, on) {
      var v = $('video', slide); if (!v) return;
      if (on) { if (!v.src) v.src = v.getAttribute('data-src'); v.classList.add('ready'); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else { v.pause(); }
    }
    playVideo(slides[0], true);
    function schedule() { clearTimeout(timer); if (!paused && !reduce) timer = setTimeout(function () { go(cur + 1); }, DUR); }
    db.forEach(function (b, i) { b.addEventListener('click', function () { go(i); }); });
    var pb = $('#heroPause');
    pb.addEventListener('click', function () {
      paused = !paused; $('.hero').classList.toggle('paused', paused); playVideo(slides[cur], !paused);
      pb.setAttribute('aria-label', paused ? 'Reprendre le diaporama' : 'Mettre le diaporama en pause');
      pb.innerHTML = paused ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>' : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
      schedule();
    });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) clearTimeout(timer); else { schedule(); playVideo(slides[cur], !paused); } });
    var sx = 0;
    $('.hero').addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    $('.hero').addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 60) go(cur + (dx < 0 ? 1 : -1)); }, { passive: true });
    schedule();
    pars = $$('.par');
  }
  var pars = [];
  function parallax(y) {
    if (reduce || !pars.length || y > innerHeight * 1.2) return;
    pars.forEach(function (p) { var s = parseFloat(p.getAttribute('data-s')) || 0; p.setAttribute('transform', 'translate(' + (mx * s * 60).toFixed(1) + ' ' + (y * s * 1.4).toFixed(1) + ')'); });
  }
  var mx = 0;
  if (!reduce && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('mousemove', function (e) { mx = e.clientX / innerWidth - .5; if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  }

  /* ---------- apparition au défilement + compteurs ---------- */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in'); io.unobserve(e.target);
      var c = e.target.matches('[data-count]') ? e.target : null; if (c) count(c);
    });
  }, { threshold: .15, rootMargin: '0px 0px -6% 0px' }) : null;
  function observe(c) { $$('[data-reveal],[data-count]', c || doc).forEach(function (el) { if (io) io.observe(el); else { el.classList.add('in'); if (el.matches('[data-count]')) count(el); } }); }
  function stagger(c) { $$('[data-reveal]', c).forEach(function (el, i) { el.style.setProperty('--i', i % 6); }); observe(c); }
  function count(el) {
    var end = +el.getAttribute('data-count'), suf = el.getAttribute('data-suffix') || '', t0 = null, D = 1600;
    if (reduce) { el.textContent = end.toLocaleString('fr-FR') + suf; return; }
    (function step(t) { if (!t0) t0 = t; var k = Math.min((t - t0) / D, 1), e = 1 - Math.pow(1 - k, 4); el.textContent = Math.round(end * e).toLocaleString('fr-FR') + (k === 1 ? suf : ''); if (k < 1) requestAnimationFrame(step); })(performance.now());
  }

  /* ---------- carte interactive ---------- */
  var map = $('#mapSvg');
  if (map) {
    var info = $('#mapInfo'), TXT = {
      sassandra: ['Département de Sassandra', "Chef-lieu de la Région. Ville historique au bord de l'Atlantique et à l'embouchure du fleuve du même nom, port de pêche, patrimoine colonial et plages."],
      fresco: ['Département de Fresco', 'Département côtier tourné vers la lagune et la mer : pêche, cultures de rente et vivrières, villages de pêcheurs et potentiel balnéaire.']
    };
    function pick(k) { $$('.dept', map).forEach(function (p) { p.classList.toggle('on', p.dataset.k === k); }); info.innerHTML = '<h3>' + TXT[k][0] + '</h3><p>' + TXT[k][1] + '</p>'; }
    $$('.dept', map).forEach(function (p) {
      p.addEventListener('click', function () { pick(p.dataset.k); });
      p.addEventListener('mouseenter', function () { pick(p.dataset.k); });
      p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(p.dataset.k); } });
    });
    pick('sassandra');
  }

  /* ---------- formulaire de contact ---------- */
  var cf = $('#contactForm');
  if (cf) cf.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('#formMsg'), btn = cf.querySelector('button[type=submit]');
    if (!cf.checkValidity()) { cf.reportValidity(); return; }
    btn.disabled = true; btn.textContent = 'Envoi en cours…'; msg.className = 'form-msg';
    fetch('contact.php', { method: 'POST', body: new FormData(cf) }).then(function (r) { return r.json(); }).then(function (j) {
      if (j.ok) { msg.className = 'form-msg ok'; msg.textContent = 'Merci ! Votre message a bien été envoyé. Nous vous répondons rapidement.'; cf.reset(); }
      else throw 0;
    }).catch(function () {
      msg.className = 'form-msg err'; msg.textContent = "L'envoi a échoué. Vous pouvez nous écrire directement à l'adresse e-mail indiquée sur cette page.";
    }).then(function () { btn.disabled = false; btn.textContent = 'Envoyer le message'; });
  });

  /* ---------- démarrage ---------- */
  observe(doc);
  $$('[data-reveal]').forEach(function (el) { if (!el.style.getPropertyValue('--i')) { var p = el.parentElement, k = p ? Array.prototype.indexOf.call(p.children, el) : 0; el.style.setProperty('--i', Math.min(k, 5)); } });
  loadData().then(function (d) {
    if (!d) { $$('[data-needs-data]').forEach(function (el) { el.innerHTML = '<p>Le contenu est momentanément indisponible. Veuillez actualiser la page.</p>'; }); return; }
    fillSite(d); initHero(d); initFinder(d); renderNewsHome(d); renderNewsList(d); renderArticle(d); renderAgenda(d); renderDocs(d); renderElus(d); renderStats(d);
    onScroll();
  });
  onScroll();
})();
