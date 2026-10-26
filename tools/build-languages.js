'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.resolve(__dirname, '..', 'src');
const DOMAIN = 'https://www.imperivmresurrected.com';
const PAGES = ['index', 'guide', 'sdk', 'credits', 'supporters'];
const TARGETS = ['en', 'it'];
const ALL = ['es', 'en', 'it'];
const LOCALE = { es: 'es_ES', en: 'en_US', it: 'it_IT' };
const CHECK = process.argv.includes('--check');

const read = (file) => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const escapeText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function loadDictionaries() {
  const box = { window: {} };
  vm.runInNewContext(read(path.join(SRC, 'js', 'dictionary.js')), box);
  const T = box.window.TRANSLATIONS;
  for (const file of ['i18n-guide.js', 'i18n-sdk.js', 'i18n-credits.js', 'i18n-patrons.js']) {
    const extraBox = { window: {} };
    vm.runInNewContext(read(path.join(SRC, 'js', file)), extraBox);
    const extra = extraBox.window.EXTRA_TRANSLATIONS || {};
    for (const id of Object.keys(extra)) {
      if (!T[id]) continue;
      Object.assign(T[id], extra[id]);
    }
  }
  return T;
}

function translate(html, lang, T, missing) {
  const D = T[lang];
  html = html.replace(/<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*?)\sdata-i18n-attr="([^"]*)"([^>]*)>/g, (whole, tag, before, spec, after) => {
    let open = '<' + tag + before + ' data-i18n-attr="' + spec + '"' + after + '>';
    for (const pair of spec.split(';')) {
      const [name, key] = pair.split(':');
      if (D[key] === undefined) { missing.add(key); continue; }
      const value = escapeAttr(D[key]);
      const re = new RegExp('(\\s' + name + '=")[^"]*(")');
      if (re.test(open)) open = open.replace(re, (m, a, b) => a + value + b);
      else open = open.replace(/\s*\/?>$/, (end) => ' ' + name + '="' + value + '"' + end);
    }
    return open;
  });
  html = html.replace(/<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*?\sdata-i18n(-html)?="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/g, (whole, tag, attrs, isHtml, key) => {
    if (D[key] === undefined) { missing.add(key); return whole; }
    return '<' + tag + attrs + '>' + (isHtml ? D[key] : escapeText(D[key])) + '</' + tag + '>';
  });
  return html.replace(/<html lang="[a-z]{2}"/, '<html lang="' + lang + '"');
}

function prefixRelativeUrls(html) {
  return html.replace(/\b(href|src)="([^"]*)"/g, (whole, attr, value) => {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\/)/i.test(value)) return whole;
    if (/^(?:index|guide|sdk|credits|supporters)\.html(?:#.*)?$/.test(value)) return whole;
    return attr + '="../' + value + '"';
  });
}

function pageUrl(lang, page) {
  const file = page === 'index' ? '' : page + '.html';
  return DOMAIN + (lang === 'es' ? '/' : '/' + lang + '/') + file;
}

function seoHead(html, lang, page) {
  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/) || [])[1] || '';
  const description = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const url = pageUrl(lang, page);
  html = html.replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n/g, '');
  html = html.replace(/<meta property="og:locale(?::alternate)?" content="[^"]*">\n/g, '');
  const alternates = ALL.map((l) => '<link rel="alternate" hreflang="' + l + '" href="' + pageUrl(l, page) + '">').join('\n') +
    '\n<link rel="alternate" hreflang="x-default" href="' + pageUrl('en', page) + '">\n';
  html = html.replace(/<link rel="canonical" href="[^"]*">\n/, () => '<link rel="canonical" href="' + url + '">\n' + alternates);
  const locales = '<meta property="og:locale" content="' + LOCALE[lang] + '">\n' +
    ALL.filter((l) => l !== lang).map((l) => '<meta property="og:locale:alternate" content="' + LOCALE[l] + '">\n').join('');
  html = html.replace(/(<meta property="og:site_name"[^>]*>\n)/, (m) => m + locales);
  html = html.replace(/<meta property="og:title" content="[^"]*">/, () => '<meta property="og:title" content="' + title.replace(/"/g, '&quot;') + '">');
  html = html.replace(/<meta property="og:description" content="[^"]*">/, () => '<meta property="og:description" content="' + description + '">');
  html = html.replace(/<meta property="og:url" content="[^"]*">/, () => '<meta property="og:url" content="' + url + '">');
  return html;
}

function main() {
  const T = loadDictionaries();
  const changes = [];
  const missing = new Set();
  const output = new Map();

  for (const page of PAGES) {
    const sourceFile = path.join(SRC, page + '.html');
    const source = seoHead(read(sourceFile), 'es', page);
    output.set(sourceFile, source);
    for (const lang of TARGETS) {
      let html = translate(source, lang, T, missing);
      html = html.replace(/<script src="js\/lang-redirect\.js"><\/script>\n/, '');
      html = prefixRelativeUrls(html);
      html = seoHead(html, lang, page);
      output.set(path.join(SRC, lang, page + '.html'), html);
    }
  }

  if (missing.size) {
    console.error('Missing translations: ' + Array.from(missing).sort().join(', '));
    process.exit(1);
  }

  for (const [file, html] of output) {
    const current = fs.existsSync(file) ? read(file) : null;
    if (current === html) continue;
    changes.push(path.relative(SRC, file).replace(/\\/g, '/'));
    if (!CHECK) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, html);
    }
  }

  if (CHECK) {
    if (changes.length) { console.error('Out of date: ' + changes.join(', ')); process.exit(1); }
    console.log('All generated pages are up to date (' + output.size + ' files).');
  } else {
    console.log('Languages built: ' + output.size + ' files checked, ' + changes.length + ' written.');
  }
}

main();
