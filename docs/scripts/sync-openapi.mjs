#!/usr/bin/env node
/**
 * Vendors the xPlant OpenAPI spec into this repo, stripped of anything that
 * only makes sense inside the app's codebase, and records where it came from.
 *
 *   npm run sync:openapi -- --from <app repo dir>                  # production branch (origin/main)
 *   npm run sync:openapi -- --from <app repo dir> --ref origin/develop   # preview only
 *   npm run sync:openapi -- --file path/to/openapi.json            # preview only
 *
 * --from reads the spec at `--ref` (default origin/main) from the app
 * repository, at the path in the XPLANT_SPEC_PATH environment variable.
 * The ref and commit are written to `x-docs-source`; a production build
 * refuses any spec that didn't come from the production branch (see
 * check-source.mjs), so the docs can never describe more than the live API.
 *
 * Writes openapi/openapi.json, prints what changed, and refuses to write if
 * anything private survives sanitising (see public-rules.mjs).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scan } from "./public-rules.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(here, "..", "openapi", "openapi.json");

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const usage = () => {
  console.error("usage: npm run sync:openapi -- --from <app repo dir> [--ref origin/main]\n       npm run sync:openapi -- --file <openapi.json>   (preview only)");
  process.exit(2);
};

let raw;
let source;
if (flag("--from")) {
  const repo = flag("--from");
  const ref = flag("--ref") ?? "origin/main";
  const specPath = process.env.XPLANT_SPEC_PATH;
  if (!specPath) {
    console.error("Set XPLANT_SPEC_PATH to the spec's path inside the app repository.");
    process.exit(2);
  }
  execFileSync("git", ["-C", repo, "fetch", "--quiet", "origin"], { stdio: "inherit" });
  const commit = execFileSync("git", ["-C", repo, "rev-parse", "--short=9", ref], { encoding: "utf8" }).trim();
  raw = execFileSync("git", ["-C", repo, "show", `${ref}:${specPath}`], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  source = { ref, commit };
} else if (flag("--file")) {
  raw = readFileSync(flag("--file"), "utf8");
  source = { ref: "file", commit: null };
} else {
  usage();
}
const spec = JSON.parse(raw);

const PUBLIC_DESCRIPTION =
  "The xPlant REST API. Every request is scoped to the calling key's workspace. " +
  "Responses are `{ ok: true, data }` on success and `{ ok: false, data: null, error, code }` on failure; branch on `code`.";

/** Sentences that point into the app's codebase or internal docs. */
const INTERNAL = /\bdocs\/|\.md\b|\bscripts\/|\blib\/|\bapp\/api\/|\bsee [`']?[\w/-]+\.(ts|mjs|json)\b|\bauthorize\w*V1\b|#\d{2,5}\b/i;
/** Keys that describe how a route is implemented, not how it behaves. */
const INTERNAL_KEYS = new Set(["guard", "x-guard", "x-handler", "x-source", "x-file", "x-internal", "$comment"]);

function cleanText(text) {
  if (typeof text !== "string") return text;
  const out = text
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph
        .split(/(?<=[.!?])[ \t]+(?=[A-Z`(])/)
        .filter((sentence) => !INTERNAL.test(sentence))
        .join(" ")
        .trim(),
    )
    .filter(Boolean)
    .join("\n\n");
  return out.length > 0 ? out : undefined;
}

function clean(node) {
  if (Array.isArray(node)) return node.map(clean);
  if (!node || typeof node !== "object") return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (INTERNAL_KEYS.has(key)) continue;
    if (key === "description" || key === "summary") {
      const text = cleanText(value);
      if (text !== undefined) out[key] = text;
      continue;
    }
    out[key] = clean(value);
  }
  return out;
}

const sanitized = clean(spec);
sanitized.info = {
  ...sanitized.info,
  title: "xPlant API",
  description: PUBLIC_DESCRIPTION,
};
sanitized.servers = [{ url: "https://app.xplantpro.com" }];
sanitized["x-docs-source"] = source;

const text = `${JSON.stringify(sanitized, null, 2)}\n`;
const findings = scan(text, "docs/openapi/openapi.json");
if (findings.length > 0) {
  for (const f of findings) console.error(`openapi.json:${f.line} [${f.id}] "${f.match}" — ${f.why}`);
  console.error("\n✗ Not written: the spec still carries private details. Fix it upstream or extend the sanitiser.");
  process.exit(1);
}

const opsOf = (s) =>
  new Set(
    Object.entries(s.paths ?? {}).flatMap(([p, item]) =>
      Object.keys(item)
        .filter((m) => ["get", "post", "put", "patch", "delete"].includes(m))
        .map((m) => `${m.toUpperCase()} ${p}`),
    ),
  );
const before = existsSync(target) ? opsOf(JSON.parse(readFileSync(target, "utf8"))) : new Set();
const after = opsOf(sanitized);

writeFileSync(target, text);
const added = [...after].filter((op) => !before.has(op));
const removed = [...before].filter((op) => !after.has(op));
console.log(`✓ wrote openapi/openapi.json: ${after.size} operations, from ${source.ref}${source.commit ? ` @ ${source.commit}` : ""}`);
if (!["origin/main", "main"].includes(source.ref)) {
  console.log("  (not the production branch: fine for a preview, but a production build will refuse this spec)");
}
for (const op of added) console.log(`  + ${op}`);
for (const op of removed) console.log(`  - ${op}`);
if (added.length > 0) console.log("\nAdd an overlay entry (openapi/overlay.mjs) for each new operation, then run npm run generate.");
