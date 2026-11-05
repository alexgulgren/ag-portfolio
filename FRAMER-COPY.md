# Framer copy of the portfolio

`site/` is a static copy of alexgulgren.framer.website with the same design, the same pages and all the images, fonts and videos stored locally in `site/assets/`. No Framer scripts, analytics or badge. Plain HTML and CSS with no build step. It lives alongside the hand-built refresh at the repository root and doesn't touch it.

## What's in here

- `site/`: the website, which is the folder you upload or deploy.
  - Pages: `index`, `about`, `contact`, `ai-assistant`, `onboarding`, `auto-renewal`, `rearchitecture`, `plg`, `product-marketing`, `redesign`, plus `thanks` (shown after the contact form)
- `netlify.toml`: tells Netlify to publish `site/` (remove it, or change `publish`, if you deploy the refresh from the root instead)
- `tools/build-from-framer.py`: the script that made the copy (only needed if you change something in Framer and want to re-export)

## Preview locally

```bash
python3 -m http.server 8000 --directory site
```

Then open http://localhost:8000.

## Host it (Netlify, recommended, free)

Netlify is the pick because the contact form is wired to **Netlify Forms**, so it keeps working with no code or backend.

1. Go to https://app.netlify.com/drop and drag the `site` folder onto the page. It goes live right away.
   (Or push this repository to GitHub and import it in Netlify. `netlify.toml` already sets the publish folder.)
2. In Netlify, open **Site configuration → Forms** and enable form detection, then redeploy. Under **Forms → Form notifications**, add your email so submissions go to your inbox.
3. Under **Domain management**, add your custom domain if you have one.

Netlify serves `/about` from `about.html` automatically, so links in the old Framer URL format still work.

### Other hosts

Cloudflare Pages, Vercel or GitHub Pages also work: point them at the `site` folder, with no build command. Everything works the same except the contact form. To keep the form on those hosts, sign up for a form service such as Formspree and set the form's `action` in `site/contact.html` to the URL it gives you.

## Making edits

Each page is Framer's exported markup, so it's verbose, but the text is plain HTML. Search the page file for the words you want to change and edit them in place. Images are in `site/assets/`. To replace one, keep the same file name, or update the `src` in the page.

## Differences from the Framer version

- Hover animations driven by Framer's JavaScript are gone. Elements fade in with a simple CSS animation in place of Framer's appear effects, and the homepage typewriter is re-created with a small script.
- The unfinished pages that were in Framer's sitemap but not published (lydia-line, counterstone, sso, self-pay, practice-center, video-share) aren't included.
