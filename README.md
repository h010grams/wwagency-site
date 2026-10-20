# WW Agency — website for a real estate media studio

Website for **WW Agency**, a Bratislava studio that produces video tours and photography for real estate agents. Built as a client project to present the studio's services professionally and bring in new clients as the business grows.

**Live site:** https://wwagency.eu

## Features

- **One-page layout:** hero video, "why us" section, showcase of vertical video reels, photo gallery, services with pricing tiers, a three-step "how it works" flow and a contact section
- **Reels carousel** and a **photo lightbox**
- **Contact form** that sends inquiries straight to the studio's inbox without a backend (Web3Forms), with a honeypot field against spam; the reply-to is set to the client's email
- **Graceful fallbacks:** branded placeholders until media files are added; if the form service is disabled, the button opens the visitor's mail app with a pre-filled email
- **Performance:** no framework and no build step, lazy-loaded media, self-hosted WOFF2 fonts
- **Local SEO:** schema.org `ProfessionalService` structured data, custom domain
- **GDPR-friendly:** no cookies, no analytics, fonts served from the site itself (no requests to Google Fonts), privacy policy page linked from the form and footer

## Tech stack

HTML5, CSS3 (custom properties for brand colors), vanilla JavaScript (IntersectionObserver for scroll animations, Fetch API for the form). Hosted as a static site.

## Project structure

```
public/                          the website — this folder is what gets deployed
  index.html                     markup and texts (Slovak)
  ochrana-osobnych-udajov.html   privacy policy (GDPR)
  css/style.css                  styles; brand colors in :root
  css/fonts.css                  @font-face rules for fonts in public/fonts
  fonts/                         WOFF2 font files
  js/main.js                     menu, video, carousel, lightbox, contact form
  assets/                        logo, favicon, media
```

## Running locally

```bash
python3 -m http.server 4321 --directory public
```

Then open http://localhost:4321.

## Deployment

Any static host works (Netlify, Vercel, Cloudflare Pages, FTP). For example, with Netlify Drop: drag the `public` folder to https://app.netlify.com/drop.

## Media

Media files are not included in the repository. Until a file is added, a branded placeholder is shown in its place.

| What | File | Format |
|---|---|---|
| Hero video | `public/assets/video/hero.mp4` + `hero-poster.jpg` | 9:16, H.264, up to ~8 MB |
| Reels 1–5 | `public/assets/reels/reel-1.mp4` … `reel-5.mp4` + `reel-N.jpg` (preview) | 9:16 |
| Photos 1–6 | `public/assets/photos/photo-1.jpg` … `photo-6.jpg` | 1 and 6 wide (3:2); 2–5 any, center-cropped |

Tip: compress videos to 1080×1920 at ~4–6 Mbit/s:

```bash
ffmpeg -i in.mov -vf scale=1080:-2 -c:v libx264 -crf 24 -preset slow -an out.mp4
```

(keep the audio for the hero video by removing `-an`).

## Contact form (Web3Forms)

The form posts to [Web3Forms](https://web3forms.com) — no server or account needed. The access key is set in `index.html` (`data-access-key` on the `<form data-form>` element); it is public by design. To use Formspree instead, set `data-endpoint="https://formspree.io/f/YOUR_ID"` and leave `data-access-key` empty.

## Fonts

The Figma design uses Halvar Breitschrift (headings), Blauer Nue (body) and Italianno (accent). The site uses free substitutes — Archivo Expanded and Inter — plus the original Italianno, all self-hosted. With a web license for the original fonts, add the `.woff2` files to `public/fonts`, add `@font-face` rules to `css/fonts.css` and change `--font-display` / `--font-body` in `css/style.css`.

## Author

**Nikita Kolotusha** — design implementation and development.
GitHub: [@h010grams](https://github.com/h010grams)
