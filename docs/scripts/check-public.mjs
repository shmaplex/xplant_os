#!/usr/bin/env node
/**
 * Fails if anything in the repository would expose private information:
 * private repo links, internal hosts or paths, issue numbers, stack internals,
 * app env var names, or unpublished email addresses. See public-rules.mjs.
 *
 *   node scripts/check-public.mjs        # whole repository
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { scan } from "./public-rules.mjs";

const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const files = execFileSync("git", ["ls-files", "-co", "--exclude-standard"], { cwd: root, encoding: "utf8" })
  .split("\n")
  .filter(Boolean)
  .filter((f) => !/(^|\/)(node_modules|\.next|out|\.source)\//.test(f))
  .filter((f) => !/package-lock\.json$|\.(png|jpe?g|webp|ico|gif|woff2?)$/.test(f))
  .filter((f) => !/docs\/scripts\/(public-rules|check-public)\.mjs$/.test(f));

let failures = 0;
for (const file of files) {
  let text;
  try {
    text = readFileSync(path.join(root, file), "utf8");
  } catch {
    continue;
  }
  for (const f of scan(text, file)) {
    failures += 1;
    console.error(`${file}:${f.line}  [${f.id}] "${f.match}" — ${f.why}`);
  }
}

if (failures > 0) {
  console.error(`\n✗ ${failures} finding(s). This repository is public; remove them before merging.`);
  process.exit(1);
}
console.log(`✓ public check passed (${files.length} files)`);
