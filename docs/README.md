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
| `scripts/sync-openapi.mjs` | Vendors a new spec and strips anything internal. |
| `scripts/generate-api-pages.mjs` | Writes the API pages, the scopes page, and the `{/* generated:… */}` blocks inside hand-written pages. |
| `scripts/check-public.mjs` | Fails if anything private would be published (see `scripts/public-rules.mjs`). |

## When the API changes

```bash
npm run sync:openapi -- /path/to/openapi.json   # vendor + sanitise; prints added/removed operations
# add an entry to openapi/overlay.mjs for each new operation
npm run generate
npm run check
```

`npm run generate` fails if an operation has no overlay entry, or an overlay entry has no operation.

## Every page, three ways

- **HTML** at `/docs/<page>`.
- **Markdown** at `/docs/<page>.md`, rendered from the same MDX source. The "Copy page as Markdown", "Open in ChatGPT" and "Open in Claude" buttons use it.
- **`/llms.txt`** (an index) and **`/llms-full.txt`** (every page in one file).

The "Open in" links hand the assistant the public URL, which comes from `SITE_URL` at build time (default `https://docs.xplantpro.com`).

## Rules for this repository

It's public. Document what a client can observe, never how it's built: no internal hosts, file paths, issue numbers, vendor or database details, or staff addresses. `npm run check` enforces the mechanical part; the rest is on the reviewer.
