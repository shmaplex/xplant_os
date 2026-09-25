#!/usr/bin/env node
/**
 * Vendors the xPlant OpenAPI spec into this repo, stripped of anything that
 * only makes sense inside the app's codebase.
 *
 *   npm run sync:openapi -- path/to/openapi.json
 *   cat openapi.json | npm run sync:openapi -- -
 *
 * Writes openapi/openapi.json, prints what changed, and refuses to write if
 * anything private survives sanitising (see public-rules.mjs).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scan } from "./public-rules.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(here, "..", "openapi", "openapi.json");

const input = process.argv[2];
if (!input) {
  console.error("usage: npm run sync:openapi -- <path/to/openapi.json | ->");
  process.exit(2);
}
const raw = readFileSync(input === "-" ? 0 : input, "utf8");
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
console.log(`✓ wrote openapi/openapi.json: ${after.size} operations`);
for (const op of added) console.log(`  + ${op}`);
for (const op of removed) console.log(`  - ${op}`);
if (added.length > 0) console.log("\nAdd an overlay entry (openapi/overlay.mjs) for each new operation, then run npm run generate.");
