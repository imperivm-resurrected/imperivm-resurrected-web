(function () {
  'use strict';

  var header = document.querySelector('.header');
  var menu = header && header.querySelector('.menu');
  if (!menu) return;

  var LABEL = { es: 'Menú', en: 'Menu', it: 'Menu' };
  var lang = document.documentElement.lang || 'es';
  var label = LABEL[lang] || LABEL.en;

  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'menu-toggle';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'mobile-nav');
  button.setAttribute('aria-label', label);
  button.innerHTML = '<span></span><span></span><span></span>';
  menu.appendChild(button);

  var panel = document.createElement('nav');
  panel.id = 'mobile-nav';
  panel.className = 'mobile-nav';
  panel.setAttribute('aria-label', label);
  panel.hidden = true;
  header.appendChild(panel);

  function fill() {
    panel.innerHTML = '';
    var links = menu.querySelectorAll('a:not(.button)');
    for (var i = 0; i < links.length; i++) {
      var a = document.createElement('a');
      a.href = links[i].getAttribute('href');
      a.textContent = links[i].textContent.trim();
      if (links[i].getAttribute('target')) {
        a.target = links[i].getAttribute('target');
        a.rel = links[i].getAttribute('rel') || 'noopener';
      }
      if (links[i].classList.contains('external-link')) a.className = 'external-link';
      if (links[i].getAttribute('aria-current')) a.setAttribute('aria-current', links[i].getAttribute('aria-current'));
      panel.appendChild(a);
    }
  }

  function open() {
    fill();
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
  }
  function close(returnFocus) {
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if (returnFocus) button.focus();
  }

  button.addEventListener('click', function () { if (panel.hidden) open(); else close(false); });
  panel.addEventListener('click', function (e) { if (e.target.closest('a')) close(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(true); });
  document.addEventListener('click', function (e) { if (!panel.hidden && !header.contains(e.target)) close(false); });
  window.addEventListener('resize', function () { if (!panel.hidden && window.innerWidth > 960) close(false); });
})();
