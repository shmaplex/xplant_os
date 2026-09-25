# xPlant API docs

The source of [docs.xplantpro.com](https://docs.xplantpro.com): guides, the generated API reference, and AI-friendly Markdown of every page. Built with [Next.js](https://nextjs.org) and [Fumadocs](https://fumadocs.dev), exported as a static site.

## Run it

```bash
cd docs
npm install
npm run dev        # http://localhost:3210
```

```bash
npm run build      # static site in docs/out
npm run preview    # serve docs/out on http://localhost:3211
npm run check      # public-safety check + generated pages up to date
npm run types:check
```

## Layout

| Path | What it is |
| --- | --- |
| `content/docs/*.mdx`, `content/docs/guides/` | Hand-written pages. Edit these. |
| `content/docs/api/`, `content/docs/scopes.mdx` | **Generated.** Don't edit by hand. |
| `openapi/openapi.json` | The vendored OpenAPI spec: the source of truth for endpoints, parameters, schemas, errors and the scope catalogue (`x-scopes`). |
| `openapi/overlay.mjs` | Per-endpoint additions the spec can't carry: page slug, example values, the SDK call, a short note. |
| `scripts/sync-openapi.mjs` | Vendors the spec from a git ref of the app repo, strips anything internal, and records the source. |
| `scripts/check-source.mjs` | Refuses a production build whose spec didn't come from the production branch. |
| `scripts/generate-api-pages.mjs` | Writes the API pages, the scopes page, and the `{/* generated:… */}` blocks inside hand-written pages. |
| `scripts/check-public.mjs` | Fails if anything private would be published (see `scripts/public-rules.mjs`). |

## When the API changes

**The published docs never describe more than the live API.** Production is built only from the spec on the app's production branch (`origin/main`), which is what `app.xplantpro.com` serves.

```bash
# Production: once a release has reached the app's production branch.
XPLANT_SPEC_PATH=<spec path in the app repo> npm run sync:openapi -- --from <app repo dir>
# (--ref defaults to origin/main)

# Previews only: stage upcoming content from develop.
XPLANT_SPEC_PATH=<spec path in the app repo> npm run sync:openapi -- --from <app repo dir> --ref origin/develop

# add an entry to openapi/overlay.mjs for each new operation (sdk: null if the SDK doesn't cover it yet)
npm run generate
npm run check
```

The sync records the ref and commit in `openapi.json` (`x-docs-source`). `npm run build` runs `scripts/check-source.mjs` first, and **a production build (`VERCEL_ENV=production`, which includes promoting a preview) refuses any spec that didn't come from the production branch.** A preview built from develop can be reviewed, but it can't be published until the release lands and the spec is re-synced from `origin/main`.

`npm run generate` fails if an operation has no overlay entry, or an overlay entry has no operation.

## Every page, three ways

- **HTML** at `/docs/<page>`.
- **Markdown** at `/docs/<page>.md`, rendered from the same MDX source. The "Copy page as Markdown", "Open in ChatGPT" and "Open in Claude" buttons use it.
- **`/llms.txt`** (an index) and **`/llms-full.txt`** (every page in one file).

The "Open in" links hand the assistant the public URL, which comes from `SITE_URL` at build time (default `https://docs.xplantpro.com`).

## Rules for this repository

It's public. Document what a client can observe, never how it's built: no internal hosts, file paths, issue numbers, vendor or database details, or staff addresses. `npm run check` enforces the mechanical part; the rest is on the reviewer.
