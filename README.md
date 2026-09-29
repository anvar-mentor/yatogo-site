# YATOGO: SEO branch

Production baseline: `server-current`, starting commit `5f781226816ccdd87254922f90331e38e4fa490d`.
Work happens on `seo-optimization`. `main` is not the production source.
No script in this repository deploys automatically.

## Editing and checks

Edit text in `assets/js/i18n.js`, structure in `index.html`, contacts in `site.config.js`.
Then run `node scripts/build-seo.cjs`. It fills the Russian HTML, regenerates private
UZ/EN HTML files, static reviews and the plan matrix, and hashes referenced CSS/JS
for cache invalidation. The script uses only Node built-ins and normalizes line endings.
Do not manually edit `seo/en.html` or `seo/uz.html`.

Run `node --test tests/seo.test.cjs` for reproducibility, metadata, anchor, schema and
HTTP route checks. Run `node scripts/preview.cjs` for a local preview at
`http://127.0.0.1:8765/`. The preview implements the proposed language routing and 404s;
it is not a production web server.

The optional browser regression suite is `node tests/browser.cjs`. It needs Playwright
and a Chromium browser. `PLAYWRIGHT_MODULE_PATH` can point to an existing Playwright
installation and `BROWSER_CHANNEL` defaults to `msedge`. `TEST_OUTPUT_DIR` can select
an external screenshot/report folder. It stubs messaging and makes no real submissions.

## Languages and SEO

- `/` and `?lang=ru` are Russian; canonical is `https://yatogo.ru/`.
- `?lang=uz` and `?lang=en` have their own canonical and localized metadata.
- Explicit query parameters determine language; browser settings and localStorage do not.
- The language menu keeps real links and supports in-page switching.
- No new public `/ru/`, `/uz/` or `/en/` URL architecture was introduced.
- `seo/uz.html` and `seo/en.html` are private rendering targets. The nginx snippets are
  required to serve them at the query URLs and reject direct access to these files.
- With the OLD nginx configuration, query URLs still receive Russian HTML before JS.
  JS translation works, but that is not the finished server-rendered SEO setup.
- `hreflang` is intentionally absent until production routing has been verified.
- `sitemap.xml` retains the known production canonical root. Add localized URLs only
  after production returns the correct language HTML without JavaScript.
- Organization/WebSite/WebPage use existing public identity and contact data; no
  invented address, registration number, rating or LocalBusiness claim is added.
- FAQ is visible HTML. FAQPage is optional and is not needed for this change.

## Content that needs business confirmation

The owner confirmed the existing reviews are real on 2026-09-28; they are preserved.
The individual entrepreneur service is separate from the foreign-owned LLC in the table.
The owner supplied the legal operator details, contact email and registered address.
The privacy policy is available at `/privacy/` in Russian, Uzbek and English. Existing
tax rates, minimum capital, office-area and
bank-presence statements have not been legally revalidated by these technical changes.
Do not treat the SEO patch as a legal review.

## Deployment: only after explicit approval

See `deploy/DEPLOY.md`. Never use an installer from the old main branch, force-push,
reset the production checkout or publish the working SEO branch directly.
