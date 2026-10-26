const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src');
const DOMAIN = 'https://www.imperivmresurrected.com';
const today = new Date().toISOString().slice(0, 10);

const entries = [];
const add = (loc, priority) => entries.push(`  <url><loc>${DOMAIN}${loc}</loc><lastmod>${today}</lastmod><priority>${priority}</priority></url>`);

const sitePages = [['index.html', '', 1.0], ['guide.html', 'guide.html', 0.8], ['sdk.html', 'sdk.html', 0.8], ['credits.html', 'credits.html', 0.4], ['supporters.html', 'supporters.html', 0.5]];
for (const prefix of ['', 'en/', 'it/']) {
  for (const [file, loc, priority] of sitePages) {
    if (!fs.existsSync(path.join(SRC, prefix, file))) continue;
    add('/' + prefix + loc, priority.toFixed(1));
  }
}

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const guides = walk(path.join(SRC, 'sdk')).filter((f) => f.endsWith('.html')).map((f) => path.relative(SRC, f).split(path.sep).join('/')).sort((a, b) => (a === 'sdk/overview.html' ? -1 : b === 'sdk/overview.html' ? 1 : a.localeCompare(b)));
for (const page of guides) add('/' + page, '0.6');

const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + entries.join('\n') + '\n</urlset>\n';
fs.writeFileSync(path.join(SRC, 'sitemap.xml'), xml);
console.log(entries.length + ' URLs');
