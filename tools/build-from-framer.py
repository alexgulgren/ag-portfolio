"""Turn the downloaded Framer pages into a self-contained static site."""
import hashlib, html, os, re, sys, urllib.request, concurrent.futures as cf

SRC, OUT = sys.argv[1], sys.argv[2]
PAGES = ['index', 'about', 'contact', 'ai-assistant', 'onboarding', 'auto-renewal',
         'rearchitecture', 'plg', 'product-marketing', 'redesign']
ASSET_RE = re.compile(r'https://framerusercontent\.com/(?:images|assets|third-party-assets)/[^"\'\s)>,]+')

EXTRA_CSS = '''<style id="static-fixes">
#__framer-badge-container{display:none!important}
@keyframes ag-appear{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
[data-framer-appear-id]{animation:ag-appear .6s cubic-bezier(.2,.7,.3,1) both}
@media (prefers-reduced-motion:reduce){[data-framer-appear-id]{animation:none}}
@keyframes ag-blink{50%{opacity:0}}
[class*="blinkingCursor"]{animation:ag-blink 1s step-end infinite}
</style>'''

# Rebuilds the homepage typewriter that Framer drove with JS (same phrases and speeds as the Framer component)
TYPEWRITER = '''<script>
(() => {
  const PHRASES = ['a Product Designer', 'a Design Systems Manager', 'an Interaction Designer', 'a UX/UI Designer', 'a Professional Overthinker'];
  const TYPE = 100, DELETE = 100, HOLD = 1000;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  document.querySelectorAll('[class*="blinkingCursor"]').forEach(async (cursor) => {
    const out = cursor.previousElementSibling;
    if (!out) return;
    for (let i = 0; ; i = (i + 1) % PHRASES.length) {
      for (const ch of PHRASES[i]) { out.textContent += ch; await wait(TYPE); }
      await wait(HOLD);
      while (out.textContent) { out.textContent = out.textContent.slice(0, -1); await wait(DELETE); }
      await wait(TYPE * 3);
    }
  });
})();
</script>'''

os.makedirs(os.path.join(OUT, 'assets'), exist_ok=True)
pages = {p: open(os.path.join(SRC, f'{p}.html'), encoding='utf-8').read() for p in PAGES}

# Collect and download every Framer-hosted image, font and video
urls = set()
for t in pages.values():
    urls.update(ASSET_RE.findall(t))

def local_name(raw):
    url = html.unescape(raw)
    path, _, query = url.partition('?')
    base = path.rsplit('/', 1)[-1]
    if query:
        stem, dot, ext = base.rpartition('.')
        base = f'{stem}-{hashlib.md5(query.encode()).hexdigest()[:6]}{dot}{ext}'
    return 'assets/' + base

def fetch(raw):
    dest = os.path.join(OUT, local_name(raw))
    if not os.path.exists(dest):
        req = urllib.request.Request(html.unescape(raw), headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=60) as r, open(dest, 'wb') as f:
            f.write(r.read())
    return raw

with cf.ThreadPoolExecutor(16) as ex:
    for fut in cf.as_completed([ex.submit(fetch, u) for u in urls]):
        fut.result()

def strip_appear(m):
    style = re.sub(r'opacity:0\.001;?|transform:[^;"]*;?', '', m.group(2))
    return f'{m.group(1)}style="{style}"'

for name, t in pages.items():
    t = re.sub(r'<script\b[^>]*>.*?</script>', '', t, flags=re.S)
    t = re.sub(r'<link[^>]+(?:modulepreload|framer\.com/edit|events\.framer)[^>]*>', '', t)
    t = re.sub(r'<meta name="(?:generator|framer-search-index[^"]*)"[^>]*>', '', t)
    # Elements Framer fades in with JS start hidden; show them and let CSS do the fade
    t = re.sub(r'(data-framer-appear-id="[^"]*"[^>]*?)style="([^"]*)"', strip_appear, t)
    t = ASSET_RE.sub(lambda m: local_name(m.group(0)), t)
    t = re.sub(r'href="\./"', 'href="index.html"', t)
    t = re.sub(r'href="\./([a-z0-9-]+)"', r'href="\1.html"', t)
    t = re.sub(r'href="https://alexgulgren\.framer\.website/?"', 'href="index.html"', t)
    t = re.sub(r'href="https://alexgulgren\.framer\.website/([a-z0-9-]+)"', r'href="\1.html"', t)
    t = t.replace('</head>', EXTRA_CSS + '</head>', 1)
    # Framer's form posts to Framer's servers; hand it to Netlify Forms instead (one honeypot is enough)
    t = re.sub(r'<input required pattern="\(\?!\)" name="framer-noscript"[^>]*>', '', t)
    t = re.sub(r'<input type="text" name="(?!website")[a-z]+" tabindex="-1" autocomplete="one-time-code"[^>]*>', '', t)
    t = re.sub(r'<form (class="framer-1bdtyxo"[^>]*)>',
               r'<form name="contact" action="thanks.html" data-netlify="true" netlify-honeypot="website" \1>'
               r'<input type="hidden" name="form-name" value="contact">', t, count=1)
    t = t.replace('placeholder="jane@framer.com"', 'placeholder="jane@example.com"')
    if 'class="styles-module_blinkingCursor' in t:
        t = t.replace('</body>', TYPEWRITER + '</body>', 1)
    open(os.path.join(OUT, f'{name}.html'), 'w', encoding='utf-8').write(t)

print(len(urls), 'assets downloaded')
