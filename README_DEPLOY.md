# Ephphatha Therapy Center Website

A zero-cost static website starter designed for Cloudflare Pages / GitHub Pages / Netlify.

## What is included

- Premium mobile-first home page
- Services page with 8 service categories
- About page
- Online therapy page
- Contact + appointment request form
- WhatsApp booking flow (no backend required)
- Google Maps embed (no API key required)
- Privacy page
- SEO metadata + Schema.org local business markup
- Sitemap + robots.txt
- Cloudflare security headers
- Mobile sticky Call / WhatsApp buttons
- Original SVG service artwork, so no stock-photo licensing cost
- Ephphatha logo extracted from the supplied letterhead

## The easiest free deployment: Cloudflare Pages

### Option A — Direct Upload
1. Sign in to Cloudflare.
2. Open **Workers & Pages**.
3. Create a new **Pages** project.
4. Choose **Direct Upload**.
5. Upload the contents of this folder (or the ZIP).
6. Cloudflare gives you a free `pages.dev` address.
7. Test the site.
8. Add your custom domain later from the Pages project's **Custom domains** area.

### Option B — GitHub + automatic updates
1. Create a free GitHub repository.
2. Upload all files in this folder.
3. In Cloudflare Pages, connect the GitHub repository.
4. Framework preset: **None**.
5. Build command: leave blank.
6. Build output directory: `/` or the repository root, depending on the UI.
7. Every future GitHub commit automatically republishes the site.

## Before using your real domain

Search and replace `https://YOUR-DOMAIN.com` in:
- `sitemap.xml`
- `robots.txt`
- `index.html` canonical URL

## One-file business-detail edits

Open `js/content.js` to change:
- phone numbers
- WhatsApp number
- email
- address
- service cards
- FAQs

Most buttons across the whole site read these values automatically.

## Appointment form

The appointment form is intentionally serverless. It prepares a WhatsApp message and then lets the visitor choose whether to send it. This avoids hosting a database and keeps the basic website free.

## Center photos

The current build uses original vector illustrations instead of unlicensed stock imagery or children's photos. When you have approved clinic photographs, add them under `assets/` and replace the illustration blocks. For children's images, use photos only where appropriate consent has been obtained.

## Suggested next additions (still possible at zero cost)

- A Google Reviews link after confirming the exact listing URL
- Real clinic gallery photos
- Therapist profile photos and credentials
- Blog/resources section for local SEO
- Google Search Console
- Cloudflare Web Analytics (free, privacy-focused)
- A custom domain you already own

## Important

This site intentionally avoids claims such as “best,” guaranteed outcomes, or unsupported clinical statistics. Keep public clinician credentials and testimonials verifiable.
