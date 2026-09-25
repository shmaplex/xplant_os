#!/usr/bin/env node
/**
 * A production build refuses a spec that didn't come from the app's
 * production branch, so docs.xplantpro.com can never describe endpoints or
 * behaviour that app.xplantpro.com doesn't have yet. Previews may carry a
 * spec synced from develop to stage upcoming content.
 *
 * Runs first in `npm run build`. Vercel sets VERCEL_ENV=production for
 * production builds, including a promoted preview.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const spec = JSON.parse(readFileSync(path.join(here, "..", "openapi", "openapi.json"), "utf8"));
const source = spec["x-docs-source"] ?? { ref: "unknown", commit: null };
const label = `${source.ref}${source.commit ? ` @ ${source.commit}` : ""}`;
const production = process.env.VERCEL_ENV === "production" || process.argv.includes("--production");

if (production && !["origin/main", "main"].includes(source.ref)) {
  console.error(
    `✗ Refusing a production build: openapi/openapi.json came from ${label}, not the production branch.\n` +
      "  Re-sync once the release has reached production: npm run sync:openapi -- --from <app repo dir>",
  );
  process.exit(1);
}
console.log(`✓ spec source: ${label}${production ? " (production)" : ""}`);
