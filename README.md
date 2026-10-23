# Alex Gulgren Portfolio

Personal portfolio for Alex Gulgren, Senior Product Designer. It's a static site written in plain HTML and CSS, with no build step and no dependencies.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Homepage: intro, results, selected work, approach, experience, contact |
| `ai-assistant.html` | Case study: GoReact AI Assistant |
| `redesign.html` | Case study: GoReact platform redesign |
| `plg.html` | Case study: GoReact product-led growth |
| `design-system.html` | Case study: Rehlko design system rearchitecture |
| `styles.css` | Shared styles and color tokens (primary color `#F24043`) |

## Preview locally

Open `index.html` in a browser, or serve the folder with live paths:

```bash
npx serve .
```

## Deploy for free

Any static host works. Point it at the repository root. There's no build command, and the publish directory is `/`.

- **Netlify:** Add new site, import from GitHub, leave the build command empty.
- **Vercel:** Add New Project, import the repo, framework preset "Other".
- **GitHub Pages:** Repository Settings, Pages, deploy from the `main` branch, root folder.

## To do before sharing

- [ ] Replace the placeholder email and LinkedIn link in `index.html` (search for `TODO`)
- [ ] Add real project screenshots in place of the illustrations
- [ ] Add dates to the Experience section
