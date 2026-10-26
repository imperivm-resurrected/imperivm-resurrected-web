(function () {
  'use strict';

  var root = document.documentElement;

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var RULES = [
    { sel: '.hero__text, .guide-hero__text', kind: 'hero', children: true },
    { sel: '.hero__art, .guide-hero__art', kind: 'fade', delay: 2 },
    { sel: '.statue, .shield, .exploded', kind: 'img', delay: 3 },
    { sel: '.panorama img', kind: 'zoom' },
    { sel: '.section-title, .guide-faq-title, .closing-title, .band, .guide-cta', kind: 'rise' },
    { sel: '.block__body, .table-wrap--tools', kind: 'rise' },
    { sel: '.credits__lead', kind: 'rise', children: true },
    { sel: '.toc > .row, .three > div, .faq__item, .guide-section', kind: 'rise', stagger: true },
    { sel: '.closing__text', kind: 'rise', children: true },
    { sel: '.patrons-intro, .honor, .honor__legend, .goals', kind: 'rise' },
    { sel: '.doc > h1', kind: 'rise' }
  ];

  var pending = [];
  function mark(el, kind, i) {
    if (el.hasAttribute('data-reveal')) return;
    el.setAttribute('data-reveal', kind);
    el.style.setProperty('--i', String(Math.min(i, 6)));
    pending.push(el);
  }

  RULES.forEach(function (r) {
    Array.prototype.forEach.call(document.querySelectorAll(r.sel), function (el) {
      if (r.children) {
        Array.prototype.forEach.call(el.children, function (h, k) { mark(h, r.kind, k); });
      } else if (r.stagger) {
        var siblings = Array.prototype.filter.call(el.parentNode.children, function (x) { return x.tagName === el.tagName && x.className === el.className; });
        mark(el, r.kind, siblings.indexOf(el));
      } else {
        mark(el, r.kind, r.delay || 0);
      }
    });
  });
  if (!pending.length) return;

  function show(el) { el.classList.add('seen'); }
  var ran = false;
  function check() {
    ran = true;
    var viewHeight = window.innerHeight || root.clientHeight;
    pending = pending.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < viewHeight * 0.94 && r.bottom > 0) { show(el); return false; }
      return true;
    });
    if (!pending.length) {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      clearInterval(ticker);
    }
  }
  var ticker = null;
  var throttleTimer = null;
  function onScroll() { if (throttleTimer) return; throttleTimer = setTimeout(function () { throttleTimer = null; check(); }, 40); }

  root.classList.add('anim-on', 'anim-prep');
  void root.offsetHeight;
  root.classList.remove('anim-prep');
  void root.offsetHeight;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  setTimeout(check, 60);
  ticker = setInterval(check, 250);
  setTimeout(function () {
    if (!ran) { root.classList.remove('anim-on'); }
  }, 4000);
})();
