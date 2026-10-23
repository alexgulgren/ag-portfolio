#!/usr/bin/env python3
"""Builds a password-protected case study page.

The readable case study lives in private/<name>.content.html, which git ignores, so it never gets committed or deployed.
This script encrypts it with a password you choose and writes <name>.html: a page that shows a password form and only
holds the encrypted text. Visitors' browsers decrypt it when they enter the right password (AES-256 with a key stretched
by PBKDF2-SHA256). Re-run it whenever you edit the private file or want to change the password.

Usage, from the portfolio folder:  python3 protect.py auto-renewal
"""
import base64
import getpass
import html
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
ITERATIONS = 210000
MARKER = '<!--unlocked-->'  # proves the password was right; a wrong one can't produce it

PAGES = {
    'auto-renewal': {
        'title': 'Cell Kit Auto-Renewal · Alex Gulgren',
        'label': 'Rehlko · Subscriptions',
        'heading': 'Cell Kit auto-renewal',
    },
}

TEMPLATE = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="robots" content="noindex">
<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Geist:wght@400;500&family=Geist+Mono:wght@500&display=swap">
<link rel="icon" type="image/png" href="images/favicon.png">
<link rel="apple-touch-icon" href="images/favicon.png">
<link rel="stylesheet" href="styles.css">
<style>:root{{padding-block:env(safe-area-inset-top,0px) env(safe-area-inset-bottom,0px)}} body{{margin:0}}</style>
</head>
<body>
<header class="site-head">
  <div class="wrap">
    <a class="brand" href="index.html">Alex Gulgren</a>
    <nav class="nav" aria-label="Main"><a href="index.html#work">Work</a><a href="index.html#contact">Contact</a></nav>
  </div>
</header>

<main id="main">
  <div class="wrap cs-hero">
    <a class="back" href="index.html#work">← All work</a>
    <p class="label">{label}</p>
    <h1>{heading}</h1>
    <p class="lede">This case study is under NDA. Enter the password to read it.</p>
    <form class="unlock" id="unlock">
      <label class="label" for="unlock-pw">Password</label>
      <div class="unlock-row">
        <input id="unlock-pw" type="password" autocomplete="current-password" required>
        <button class="btn" type="submit">Unlock</button>
      </div>
      <p class="unlock-msg" id="unlock-msg" role="alert"></p>
      <p class="unlock-help">Don't have it? <a href="index.html#contact">Get in touch</a> and I'll send it over.</p>
    </form>
  </div>
</main>

<footer class="site-foot"><div class="wrap"><span>© 2026 Alex Gulgren</span><a href="index.html#contact">Get in touch</a></div></footer>
<script id="payload" type="application/octet-stream">{payload}</script>
<script>
// Decrypts the case study in the browser. The payload is OpenSSL's format: "Salted__", an 8-byte salt, then AES-256-CBC
// ciphertext. The key and IV come from PBKDF2-SHA256 over the password, exactly as `openssl enc -pbkdf2` derives them.
(() => {{
  const form = document.getElementById('unlock');
  const input = document.getElementById('unlock-pw');
  const msg = document.getElementById('unlock-msg');
  const bytes = Uint8Array.from(atob(document.getElementById('payload').textContent.trim()), (c) => c.charCodeAt(0));
  const salt = bytes.slice(8, 16), data = bytes.slice(16);

  async function decrypt(password) {{
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(await crypto.subtle.deriveBits({{ name: 'PBKDF2', salt, iterations: {iterations}, hash: 'SHA-256' }}, base, 384));
    const key = await crypto.subtle.importKey('raw', bits.slice(0, 32), 'AES-CBC', false, ['decrypt']);
    const text = new TextDecoder().decode(await crypto.subtle.decrypt({{ name: 'AES-CBC', iv: bits.slice(32) }}, key, data));
    if (!text.startsWith('{marker}')) throw new Error('wrong password');
    return text.slice({marker_len});
  }}

  form.addEventListener('submit', async (e) => {{
    e.preventDefault();
    if (!window.crypto?.subtle) {{ msg.textContent = 'This page has to be opened from the website (or http://localhost), not as a file.'; return; }}
    msg.textContent = 'Unlocking…';
    try {{
      document.getElementById('main').innerHTML = await decrypt(input.value);
      window.scrollTo(0, 0);
      const s = document.createElement('script'); s.src = 'site.js'; document.body.appendChild(s);
    }} catch {{
      msg.textContent = "That password didn't work. Check it and try again.";
      input.select();
    }}
  }});
}})();
</script>
</body>
</html>
'''


def main():
    name = sys.argv[1] if len(sys.argv) > 1 else 'auto-renewal'
    if name not in PAGES:
        sys.exit(f'Unknown page "{name}". Known pages: {", ".join(PAGES)}')
    src = os.path.join(ROOT, 'private', f'{name}.content.html')
    with open(src, encoding='utf-8') as f:
        content = f.read()

    password = getpass.getpass('Password for this case study (typing stays hidden): ')
    if not password:
        sys.exit('No password entered, so nothing was changed.')
    if getpass.getpass('Type it again to confirm: ') != password:
        sys.exit("The two passwords didn't match, so nothing was changed.")
    if len(password) < 8:
        print('Heads up: a password under 8 characters is easy to guess.')

    # Hand the password to openssl through its own pipe (fd 3), so it never appears in the process list or on disk
    r, w = os.pipe()
    os.write(w, password.encode('utf-8'))
    os.close(w)
    try:
        result = subprocess.run(
            ['openssl', 'enc', '-aes-256-cbc', '-pbkdf2', '-iter', str(ITERATIONS), '-md', 'sha256', '-salt', '-pass', f'fd:{r}'],
            input=(MARKER + content).encode('utf-8'), capture_output=True, pass_fds=(r,),
        )
    finally:
        os.close(r)
    if result.returncode != 0 or not result.stdout.startswith(b'Salted__'):
        sys.exit('Encryption failed: ' + result.stderr.decode(errors='replace'))

    page = PAGES[name]
    out = TEMPLATE.format(
        title=html.escape(page['title']), label=html.escape(page['label']), heading=html.escape(page['heading']),
        payload=base64.b64encode(result.stdout).decode('ascii'), iterations=ITERATIONS,
        marker=MARKER, marker_len=len(MARKER),
    )
    dst = os.path.join(ROOT, f'{name}.html')
    with open(dst, 'w', encoding='utf-8') as f:
        f.write(out)
    print(f'Wrote {name}.html. Share the password only with people you want to read it.')


if __name__ == '__main__':
    main()
