#!/usr/bin/env node
/**
 * After `next build` (static export): give every page's Markdown twin the
 * short URL /docs/<slug>.md next to /llms.mdx/docs/<slug>/content.md.
 * Static hosts can't rewrite, so the file is simply copied.
 */
import { cpSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "out");
const from = path.join(out, "llms.mdx", "docs");
if (!existsSync(from)) {
  console.error("postbuild: out/llms.mdx/docs is missing; did next build run?");
  process.exit(1);
}

let count = 0;
const walk = (dir, slugs) => {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, [...slugs, name]);
    else if (name === "content.md") {
      const target = slugs.length === 0 ? path.join(out, "docs.md") : path.join(out, "docs", `${slugs.join("/")}.md`);
      cpSync(full, target);
      count += 1;
    }
  }
};
walk(from, []);
console.log(`postbuild: wrote ${count} Markdown pages under /docs/*.md`);
