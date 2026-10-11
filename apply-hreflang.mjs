// Adds hreflang links and a language switcher to pages that have an equivalent on the sister
// site (weersvooruitzicht.nl <-> weathertell.com), based on data/hreflang-pairs.json.
// Runs as the last build step; idempotent, so it can run on already processed pages.
// The same script lives in both repositories; only SITE differs.
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'en';
const root = process.cwd();
const domains = { nl: 'https://www.weersvooruitzicht.nl', en: 'https://www.weathertell.com' };
const other = SITE === 'nl' ? 'en' : 'nl';
const switchLabel = {
  nl: { text: 'EN', long: 'English version', title: 'English version on WeatherTell.com' },
  en: { text: 'NL', long: 'Nederlandse versie', title: 'Nederlandse versie op Weersvooruitzicht.nl' }
};
const todayIso = new Date().toISOString().slice(0, 10);

const { pairs } = JSON.parse(fs.readFileSync(path.join(root, 'data', 'hreflang-pairs.json'), 'utf8'));
const active = new Map(pairs.filter(p => !p.from || p.from <= todayIso).map(p => [p[SITE], p]));

const headRe = /<!-- hreflang -->[\s\S]*?<!-- \/hreflang -->/g;
const switchRe = /<!-- langswitch -->[\s\S]*?<!-- \/langswitch -->/g;
const pagePath = file => '/' + path.relative(root, path.dirname(file)).split(path.sep).join('/') + '/';
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
  if (d.name.startsWith('.') || d.name === 'node_modules' || d.name === 'api' || d.name === 'data') return [];
  const full = path.join(dir, d.name);
  return d.isDirectory() ? walk(full) : d.name === 'index.html' ? [full] : [];
});

let linked = 0;
for (const file of walk(root)) {
  const original = fs.readFileSync(file, 'utf8');
  let html = original.replace(headRe, '').replace(switchRe, '');
  const pair = active.get(pagePath(file).replace(/^\/\.\/$/, '/').replace('//', '/'));
  if (pair) {
    const nlUrl = domains.nl + pair.nl;
    const enUrl = domains.en + pair.en;
    const links = `<!-- hreflang --><link rel="alternate" hreflang="nl" href="${nlUrl}"><link rel="alternate" hreflang="en" href="${enUrl}"><link rel="alternate" hreflang="x-default" href="${enUrl}"><!-- /hreflang -->`;
    const label = switchLabel[SITE];
    const href = domains[other] + pair[other];
    const attrs = `href="${href}" hreflang="${other}" lang="${other}" title="${label.title}"`;
    // Header button (wide screens only, see styles.css), a link in the mobile menu and one in the footer.
    const button = `<!-- langswitch --><a class="lang-switch" ${attrs}>${label.text}</a><!-- /langswitch -->`;
    const menuLink = `<!-- langswitch --><a class="lang-switch-menu" ${attrs}>${label.long}</a><!-- /langswitch -->`;
    const footerLink = `<!-- langswitch --><a class="lang-switch-footer" ${attrs}>${label.long}</a><!-- /langswitch -->`;
    if (html.includes('</head>')) html = html.replace('</head>', `${links}</head>`);
    if (html.includes('<button class="location-button"')) html = html.replace('<button class="location-button"', `${button}<button class="location-button"`);
    html = html.replace(/(<details class="mobile-menu">[\s\S]*?<\/summary>\s*<div>)/, `$1${menuLink}`);
    if (html.includes('<div class="footer-links">')) html = html.replace('<div class="footer-links">', `<div class="footer-links">${footerLink}`);
    else if (html.includes('<div class="footer-bottom">')) html = html.replace('<div class="footer-bottom">', `<div class="footer-bottom">${footerLink}`);
    linked++;
  }
  if (html !== original) fs.writeFileSync(file, html, 'utf8');
}
console.log(`hreflang: ${linked} pages linked to ${domains[other]} (${active.size} active pairs).`);
