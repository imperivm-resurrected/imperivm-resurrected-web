(function () {
  'use strict';

  var T = {
    es: { paypal: 'PayPal', bizum: 'Bizum', btc: 'Bitcoin', open: 'Abrir', copy: 'Copiar', copied: 'Copiado', since: 'Desde', steam: 'Perfil de Steam', more: 'Ver su frase y su perfil' },
    en: { paypal: 'PayPal', bizum: 'Bizum', btc: 'Bitcoin', open: 'Open', copy: 'Copy', copied: 'Copied', since: 'Since', steam: 'Steam profile', more: 'See their quote and profile' },
    it: { paypal: 'PayPal', bizum: 'Bizum', btc: 'Bitcoin', open: 'Apri', copy: 'Copia', copied: 'Copiato', since: 'Dal', steam: 'Profilo Steam', more: 'Vedi la sua frase e il suo profilo' }
  };
  var t = T[document.documentElement.lang] || T.es;

  // Shown only with ?demo, so the design can be judged before the first real donor exists.
  var STEAM_DEMO = 'https://steamcommunity.com/';
  var DEMO = [
    { name: 'Marcus Aurelius', amount: 250, since: 2026, note: 'Por todas las tardes de LAN de 2007. Que nunca se apague.', steam: STEAM_DEMO },
    { name: 'Lucía', amount: 180, since: 2026, note: 'Mi primer juego de PC, y ahora puedo jugarlo online con mi hermano.', steam: STEAM_DEMO },
    { name: 'Il Console', amount: 150, since: 2026, note: 'Forza Roma, sempre.' },
    { name: 'Sertorio', amount: 100, since: 2026, steam: STEAM_DEMO },
    { name: 'Dacia Felix', amount: 80, since: 2026, note: 'Que no muera nunca este juego.' },
    { name: 'Tito Pullo', amount: 60, since: 2026 },
    { name: 'Numancia', amount: 50, since: 2026, steam: STEAM_DEMO },
    { name: 'Brennus', amount: 50, since: 2026 },
    { name: 'Galo Furioso', amount: 40, since: 2026, note: 'Por el online sin abrir puertos.' },
    { name: 'Livia', amount: 30, since: 2026 },
    { name: 'Vercingetorix', amount: 25, since: 2026 },
    { name: 'Tarraco', amount: 20, since: 2026, steam: STEAM_DEMO },
    { name: 'Spartacus_ES', amount: 15, since: 2026 },
    { name: 'Cornelia', amount: 10, since: 2026 },
    { name: 'Pakito', amount: 5, since: 2026, note: 'Poco, pero con cariño.' },
    { name: 'Iulia', amount: 5, since: 2026 }
  ];

  var demo = /[?&]demo\b/.test(location.search);

  function roman(n) {
    var map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    var out = '';
    map.forEach(function (p) { while (n >= p[0]) { out += p[1]; n -= p[0]; } });
    return out;
  }

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function icon(symbol, className) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 32 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', className);
    var use = document.createElementNS(ns, 'use');
    use.setAttribute('href', '#' + symbol);
    svg.appendChild(use);
    return svg;
  }

  var lang = T[document.documentElement.lang] ? document.documentElement.lang : 'es';
  var LOCALE = { es: 'es-ES', en: 'en-GB', it: 'it-IT' };
  function money(n, currency) {
    try { return new Intl.NumberFormat(LOCALE[lang], { style: 'currency', currency: currency || 'EUR', minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(n); }
    catch (e) { return n + ' ' + (currency || 'EUR'); }
  }
  function localized(v) { return v && typeof v === 'object' ? (v[lang] || v.es || '') : (v || ''); }

  var GOAL_TEXT = {
    es: { of: 'de', monthly: 'Cada mes', thisMonth: 'Este mes', perMonth: '/mes', done: 'Conseguido. Gracias.', doneMonth: 'Cubierto este mes. Gracias.' },
    en: { of: 'of', monthly: 'Every month', thisMonth: 'This month', perMonth: '/month', done: 'Reached. Thank you.', doneMonth: 'Covered this month. Thank you.' },
    it: { of: 'su', monthly: 'Ogni mese', thisMonth: 'Questo mese', perMonth: '/mese', done: 'Raggiunto. Grazie.', doneMonth: 'Coperto questo mese. Grazie.' }
  }[lang];
  var DEMO_FILL = [1, .62, .27];

  renderDonate(window.SUPPORT_DATA);
  loadData(function (data) {
    renderGoals(data.goals);
    renderHonor(data.supporters, data.failed);
  });

  function getJson(path) {
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = controller && setTimeout(function () { controller.abort(); }, 8000);
    return fetch(window.IMPERIVM_API + path, controller ? { signal: controller.signal } : {}).then(function (r) {
      if (timer) clearTimeout(timer);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function loadData(done) {
    var wait = demo && /[?&]slow\b/.test(location.search) ? 1500 : 0;
    Promise.all([getJson('/v1/patrons'), getJson('/v1/goals')]).then(function (r) {
      return { supporters: r[0].patrons, goals: r[1].goals };
    }, function () {
      return { supporters: [], goals: [], failed: true };
    }).then(function (data) {
      setTimeout(function () { done(data); }, wait);
    });
  }

  function ready(box) {
    Array.prototype.forEach.call(box.querySelectorAll('[data-skeleton]'), function (n) { n.parentNode.removeChild(n); });
    box.removeAttribute('aria-busy');
  }

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    Array.prototype.forEach.call(document.querySelectorAll('animateTransform'), function (n) { n.parentNode.removeChild(n); });
  }

  function renderGoals(source) {
    var box = document.getElementById('goals'), listBox = document.getElementById('goals-list');
    if (!box || !listBox) return;
    ready(listBox);
    var goals = (Array.isArray(source) ? source : []).filter(function (g) { return g && Number(g.target) > 0; });
    if (!goals.length) { box.hidden = true; return; }
    goals.forEach(function (g, i) {
      var target = Number(g.target);
      var raised = demo && !Number(g.raised) ? Math.round(target * (DEMO_FILL[i % DEMO_FILL.length])) : Math.max(0, Number(g.raised) || 0);
      var percent = Math.min(100, Math.round(raised / target * 100));
      var done = percent >= 100;

      var row = el('article', 'goal' + (g.monthly ? ' goal--monthly' : '') + (done ? ' goal--done' : ''));
      var text = el('div', 'goal__text');
      if (g.monthly) text.appendChild(el('p', 'goal__kind', GOAL_TEXT.monthly));
      text.appendChild(el('h2', 'goal__title', localized(g.title)));
      text.appendChild(el('p', 'goal__desc', localized(g.text)));

      var meter = el('div', 'goal__meter');
      var numbers = el('p', 'goal__numbers');
      numbers.appendChild(el('b', '', money(raised, g.currency)));
      numbers.appendChild(el('span', '', GOAL_TEXT.of + ' ' + money(target, g.currency) + (g.monthly ? GOAL_TEXT.perMonth : '')));
      var bar = el('div', 'goal__bar');
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '100');
      bar.setAttribute('aria-valuenow', String(percent));
      bar.setAttribute('aria-label', localized(g.title));
      var fill = el('span', 'goal__fill');
      fill.style.setProperty('--goal', percent + '%');
      bar.appendChild(fill);
      var foot = el('p', 'goal__percent');
      foot.appendChild(el('span', '', (g.monthly ? GOAL_TEXT.thisMonth + ': ' : '') + percent + ' %'));
      if (done) foot.appendChild(el('span', 'goal__done', g.monthly ? GOAL_TEXT.doneMonth : GOAL_TEXT.done));
      meter.appendChild(numbers);
      meter.appendChild(bar);
      meter.appendChild(foot);

      row.appendChild(text);
      row.appendChild(meter);
      listBox.appendChild(row);
    });
  }

  function renderDonate(D) {
    var box = document.getElementById('donate-list');
    var status = document.getElementById('donate-status');
    if (!box) return;
    ready(box);
    if (!D) return;
    var rows = [];
    if (D.paypal) rows.push({ key: 'paypal', shown: D.paypal.replace(/^https?:\/\//, ''), link: D.paypal });
    if (D.bizum) rows.push({ key: 'bizum', shown: D.bizum, copy: D.bizum.replace(/\s/g, '') });
    if (D.btc) rows.push({ key: 'btc', shown: D.btc, copy: D.btc });
    rows.forEach(function (r) {
      var li = el('li', 'donate__item');
      li.appendChild(el('span', 'donate__label', t[r.key]));
      li.appendChild(el('code', 'donate__value', r.shown));
      var action;
      if (r.link) {
        action = el('a', 'donate__action', t.open + ' ↗');
        action.href = r.link;
        action.target = '_blank';
        action.rel = 'noopener';
      } else {
        action = el('button', 'donate__action', t.copy);
        action.type = 'button';
        action.addEventListener('click', function () { copy(r.copy, action); });
      }
      li.appendChild(action);
      box.appendChild(li);
    });

    var timer = null;
    function copy(text, button) {
      var done = function () {
        button.textContent = t.copied;
        button.classList.add('donate__action--ok');
        if (status) status.textContent = t.copied;
        clearTimeout(timer);
        timer = setTimeout(function () {
          button.textContent = t.copy;
          button.classList.remove('donate__action--ok');
          if (status) status.textContent = '';
        }, 1600);
      };
      var fallback = function () {
        var a = document.createElement('textarea');
        a.value = text; a.setAttribute('readonly', ''); a.style.position = 'fixed'; a.style.opacity = '0';
        document.body.appendChild(a); a.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { }
        document.body.removeChild(a);
        if (ok) done();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    }
  }

  function normalize(entry, i) {
    if (typeof entry === 'string') entry = { name: entry };
    if (!entry || !entry.name) return null;
    var steam = typeof entry.steam === 'string' && /^https:\/\/steamcommunity\.com\//.test(entry.steam) ? entry.steam : '';
    return { name: String(entry.name), amount: Number(entry.amount) || 0, showAmount: !entry.hideAmount, since: entry.since, note: entry.note ? String(entry.note) : '', steam: steam, place: Number(entry.place) || 0, order: i };
  }

  function podiumCard(p, place) {
    var li = el('li', 'podium__item podium__item--' + place);
    li.appendChild(icon('laurel', 'medal medal--' + place));
    li.appendChild(el('span', 'podium__place', roman(place)));
    li.appendChild(el('span', 'podium__name', p.name));
    if (p.showAmount && p.amount > 0) li.appendChild(el('span', 'podium__amount', money(p.amount)));
    if (p.since) li.appendChild(el('span', 'podium__since', t.since + ' ' + roman(p.since)));
    if (p.note) li.appendChild(el('q', 'podium__quote', p.note));
    if (p.steam) {
      var a = el('a', 'guide-link podium__steam', t.steam + ' ↗');
      a.href = p.steam;
      a.target = '_blank';
      a.rel = 'noopener nofollow';
      li.appendChild(a);
    }
    return li;
  }

  function renderHonor(source, failed) {
    var box = document.getElementById('honor-list');
    if (!box) return;
    ready(box);
    var list = Array.isArray(source) && source.length ? source : (demo ? DEMO : []);
    var people = list.map(normalize).filter(Boolean);
    if (!people.length) {
      var message = box.querySelector(failed ? '.honor__error' : '.honor__empty');
      if (message) message.hidden = false;
      return;
    }
    // The API already sends the roll in order, with places that account for hidden amounts.
    people.sort(function (a, b) { return a.place && b.place ? a.place - b.place : b.amount - a.amount || a.order - b.order; });

    box.textContent = '';
    var podium = document.getElementById('honor-podium');
    var offset = 0;
    if (podium) {
      podium.textContent = '';
      people.slice(0, 3).forEach(function (p, i) { podium.appendChild(podiumCard(p, i + 1)); });
      podium.hidden = false;
      offset = Math.min(3, people.length);
      box.setAttribute('start', String(offset + 1));
    }
    people.slice(offset).forEach(function (p, i) {
      var place = i + 1 + offset;
      var li = el('li', 'honor__item' + (place <= 3 ? ' honor__item--' + place : place <= 10 ? ' honor__item--top' : ''));
      var hasDetail = p.note || p.steam;
      var row = el(hasDetail ? 'button' : 'div', 'honor__row');
      var pos = el('span', 'honor__pos');
      if (place <= 3) pos.appendChild(icon('laurel', 'medal medal--' + place));
      else if (place <= 10) pos.appendChild(icon('laurel', 'medal medal--top'));
      pos.appendChild(el('span', 'honor__place', roman(place)));
      row.appendChild(pos);
      row.appendChild(el('span', 'honor__name', p.name));
      var meta = el('span', 'honor__meta');
      if (p.showAmount && p.amount > 0) meta.appendChild(el('span', 'honor__amount', money(p.amount)));
      if (p.since) meta.appendChild(el('span', 'honor__since', t.since + ' ' + roman(p.since)));
      row.appendChild(meta);
      li.appendChild(row);

      if (hasDetail) {
        var id = 'honor-' + place;
        row.type = 'button';
        row.setAttribute('aria-expanded', 'false');
        row.setAttribute('aria-controls', id);
        row.setAttribute('title', t.more);
        row.appendChild(el('span', 'honor__toggle'));
        var detail = el('div', 'honor__detail');
        detail.id = id;
        detail.hidden = true;
        if (p.note) detail.appendChild(el('q', 'honor__quote', p.note));
        if (p.steam) {
          var a = el('a', 'guide-link honor__steam', t.steam + ' ↗');
          a.href = p.steam;
          a.target = '_blank';
          a.rel = 'noopener nofollow';
          detail.appendChild(a);
        }
        li.appendChild(detail);
        row.addEventListener('click', function () {
          var open = row.getAttribute('aria-expanded') === 'true';
          row.setAttribute('aria-expanded', String(!open));
          detail.hidden = open;
        });
      }
      box.appendChild(li);
    });

    var count = document.getElementById('patrons-roman');
    var label = document.getElementById('patrons-label');
    if (count) count.textContent = roman(people.length);
    if (label) label.hidden = false;
  }
})();
