/**
 * What must never appear in this public repository. Shared by
 * check-public.mjs (whole repo) and sync-openapi.mjs (the vendored spec).
 *
 * Each rule: { id, pattern, why, files? } — `files` limits a rule to paths
 * matching that regex.
 */
export const rules = [
  {
    id: "private-repo",
    pattern: /github\.com\/shmaplex\/xplant(?![_-]?(os|sdk)\b)(?=[\/"'\s)#?]|$)/g,
    why: "links to the private app repository",
  },
  {
    id: "old-sdk-repo",
    pattern: /(?<!@)shmaplex\/xplant-sdk\b/g,
    why: "the SDK repo is now shmaplex/xplant_sdk (the npm name @shmaplex/xplant-sdk is fine)",
  },
  {
    id: "old-host",
    pattern: /xplant\.shmaplex\.com|(?<![\w.])xplantpro\.com\/api|www\.xplantpro\.com\/(api|settings|login|dashboard)/g,
    why: "the API and the app live on app.xplantpro.com; www is the marketing site",
  },
  {
    id: "internal-host",
    pattern: /\b[\w-]+\.vercel\.app\b|\bstaging\.[\w.-]+|\badmin\.xplantpro\.com\b|\b[a-z0-9]{20}\.supabase\.co\b/gi,
    why: "internal hosts, previews or project refs",
  },
  {
    id: "vendor-internals",
    pattern: /\bsupabase\b|\bvercel\b|\bprisma\b|\bpostgres(ql)?\b/gi,
    why: "names the stack behind the API; describe observable behaviour instead",
  },
  {
    id: "storage-internals",
    pattern: /\bRLS\b|row[- ]level security|service[ _-]role|\bstored hashed\b|\bhash(ed|es|ing)? (the |each |every )?keys?\b|\bbcrypt\b|\bargon2\b/gi,
    why: "how keys are stored or how access is enforced internally",
  },
  {
    id: "app-env-var",
    pattern: /\b(NEXT_PUBLIC_[A-Z0-9_]+|SUPABASE_[A-Z0-9_]+|DATABASE_URL|SERVICE_ROLE_KEY|STRIPE_[A-Z0-9_]+|VERCEL_[A-Z0-9_]+)\b/g,
    why: "app environment variable names",
  },
  {
    id: "internal-path",
    pattern: /\b(lib|app|components|supabase|migrations)\/[\w./\[\]()-]+\.(tsx?|mjs|sql)\b|docs\/api\/(getting-started|openapi|v1-surface)|docs\/external-api\.md|docs\/mcp\.md|v1-surface\.json|authorize(Device)?V1\b/g,
    why: "internal file paths or implementation names",
    files: /^(?!docs\/(app|lib|components|scripts)\/|docs\/next\.config|docs\/package)/,
  },
  {
    id: "issue-ref",
    pattern: /(?<![&\w\/])#\d{2,5}\b(?![0-9a-fA-F])/g,
    why: "private issue or PR numbers",
    files: /\.(md|mdx|json)$/,
  },
  {
    id: "identifying-example",
    pattern: /\b[A-Z]\d{4}\b|\bnepenthes\b/gi,
    allow: ["e2000"], // a barcode scanner module model, not a label
    why: "example ids shaped like one lab's labelling scheme (letter + running number) or its signature genus; use neutral ids such as LINE-0412 and genera such as Alocasia",
    files: /\.(md|mdx|json|mjs|py|sh|ino|ya?ml|txt)$/,
  },
  {
    id: "email",
    pattern: /\b[\w.+-]+@(?!example\.(com|org)\b)[\w-]+(\.[\w-]+)+\b/g,
    allow: ["support@xplantpro.com", "security@shmaplex.com"],
    why: "only the published addresses may appear",
  },
];

/** Returns [{ id, why, match, line }] for one file's text. */
export function scan(text, filePath = "") {
  const findings = [];
  for (const rule of rules) {
    if (rule.files && !rule.files.test(filePath)) continue;
    for (const match of text.matchAll(rule.pattern)) {
      if (rule.allow?.includes(match[0].toLowerCase())) continue;
      if (rule.id === "email" && /^[\w.+-]+@\d/.test(match[0])) continue; // package@1.2.3
      const line = text.slice(0, match.index).split("\n").length;
      findings.push({ id: rule.id, why: rule.why, match: match[0], line });
    }
  }
  return findings;
}
