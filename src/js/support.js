(function () {
  'use strict';

  var LABEL = { es: 'Donaciones', en: 'Donate', it: 'Donazioni' };
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

  function label() { return LABEL[document.documentElement.lang] || LABEL.es; }
  // Absolute, because this script also runs on the SDK guides, which live in other folders.
  function donateHref() {
    var lang = document.documentElement.lang;
    return '/' + (lang === 'en' || lang === 'it' ? lang + '/' : '') + 'supporters.html';
  }
  var onDonatePage = /\/supporters\.html$/.test(location.pathname);

  var done = false;
  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();

  function init() {
    if (done) return;
    var nav = document.querySelector('.footer__links');
    if (!nav) return;
    done = true;

    var footerLink = document.createElement('a');
    footerLink.className = 'footer__support';
    nav.insertBefore(footerLink, nav.firstChild);

    var headerLink = null, menu = document.querySelector('.menu');
    if (menu) {
      headerLink = document.createElement('a');
      headerLink.className = 'support-header';
      if (onDonatePage) headerLink.setAttribute('aria-current', 'page');
      menu.insertBefore(headerLink, menu.querySelector('.external-link') || menu.querySelector('.theme') || menu.querySelector('.languages') || null);
    }

    var mods = menu && menu.querySelector('.external-link');
    if (mods) {
      mods.classList.add('mods-header');
      var discord = document.createElement('a');
      discord.className = 'external-link discord-header';
      discord.href = 'https://discord.gg/6kCatX3Zbc';
      discord.target = '_blank';
      discord.rel = 'noopener';
      discord.textContent = 'Discord';
      menu.insertBefore(discord, mods);
    }

    function render() {
      footerLink.href = donateHref();
      footerLink.innerHTML = HEART + '<span>' + label() + '</span>';
      if (headerLink) { headerLink.href = donateHref(); headerLink.textContent = label(); }
    }
    render();
    document.addEventListener('language-change', render);
  }
})();
