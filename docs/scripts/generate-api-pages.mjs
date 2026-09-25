#!/usr/bin/env node
/**
 * Generates the API reference and the scopes page from the vendored OpenAPI
 * spec (openapi/openapi.json, including its x-scopes catalogue) and the
 * examples in openapi/overlay.mjs.
 *
 *   node scripts/generate-api-pages.mjs          # write content/docs/api/** and scopes.mdx
 *   node scripts/generate-api-pages.mjs --check  # fail if they are stale or inconsistent
 *
 * Pages are plain Markdown wherever possible (tables, fenced code with
 * tab="…"), so the same file reads well on the site, as /docs/<page>.md, and
 * in llms-full.txt.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { overlay } from "../openapi/overlay.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const spec = JSON.parse(readFileSync(path.join(root, "openapi/openapi.json"), "utf8"));
/** The scope catalogue, exactly as the API Keys page lists it. */
const scopeCatalogue = spec["x-scopes"];
if (!Array.isArray(scopeCatalogue) || scopeCatalogue.length === 0) {
  console.error("error openapi/openapi.json has no x-scopes catalogue");
  process.exit(1);
}

const ORIGIN = spec.servers?.[0]?.url ?? "https://app.xplantpro.com";
const METHODS = ["get", "post", "put", "patch", "delete"];

/**
 * Sidebar groups, in order. An operation lands in the group listing its first
 * tag; a tag nobody listed gets a group of its own, so a new endpoint in the
 * spec shows up without touching this file.
 */
const GROUPS = [
  { slug: "account", title: "Account", tags: ["Account"] },
  { slug: "plants", title: "Plants", tags: ["Plants"] },
  { slug: "explants", title: "Explants", tags: ["Explants"] },
  { slug: "transfers-and-stages", title: "Transfers and stages", tags: ["Transfers", "Stages"] },
  { slug: "change-history", title: "Change history", tags: ["Change history"] },
  { slug: "contaminations", title: "Contaminations", tags: ["Contamination"] },
  { slug: "tasks", title: "Tasks and demand", tags: ["Tasks", "Demand signals"] },
  { slug: "comments", title: "Comments", tags: ["Comments"] },
  { slug: "media", title: "Media", tags: ["Media files", "Media recipes"] },
  { slug: "sops", title: "SOPs and runs", tags: ["SOPs", "SOP runs"] },
  { slug: "labels", title: "Labels", tags: ["Labels"] },
  { slug: "devices", title: "Devices", tags: ["Devices"] },
  { slug: "sensor-readings", title: "Sensor readings", tags: ["Sensor readings"] },
  { slug: "equipment", title: "Equipment", tags: ["Equipment"] },
  { slug: "commerce", title: "Pricing and sell-through", tags: ["Pricing", "Sell-through"] },
];

/**
 * Until the spec declares these per operation (a `deviceToken` security
 * scheme and `x-idempotent`), fall back to what the API does today.
 */
const DEVICE_TOKEN_FALLBACK = new Set([
  "POST /api/v1/device-events",
  "POST /api/v1/devices/{deviceId}/heartbeat",
  "POST /api/v1/sensor-readings",
]);
const IDEMPOTENT_FALLBACK = new Set([
  "POST /api/v1/tasks",
  "POST /api/v1/sop-runs",
  "POST /api/v1/sop-runs/{id}/steps/{stepId}/events",
  "POST /api/v1/sop-runs/{id}/steps/{stepId}/measurements",
  "POST /api/v1/label-scans",
  "POST /api/v1/equipment/{id}/events",
]);
/** Only used when the spec names a status but not its code. */
const CODE_FOR_STATUS = {
  401: "UNAUTHORIZED",
  402: "PAID_PLAN_REQUIRED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  429: "RATE_LIMIT_EXCEEDED",
};

const errors = [];
const warnings = [];

// ── Schema helpers ──────────────────────────────────────────────────────────

function deref(schema, seen = new Set()) {
  if (!schema || typeof schema !== "object") return schema;
  if (schema.$ref) {
    if (seen.has(schema.$ref)) return {};
    const target = schema.$ref
      .replace(/^#\//, "")
      .split("/")
      .reduce((node, key) => node?.[key.replace(/~1/g, "/").replace(/~0/g, "~")], spec);
    return deref(target ?? {}, new Set([...seen, schema.$ref]));
  }
  if (schema.allOf) {
    const parts = schema.allOf.map((s) => deref(s, seen));
    const merged = { ...schema, type: "object", properties: {}, required: [] };
    delete merged.allOf;
    for (const part of parts) {
      Object.assign(merged.properties, part.properties ?? {});
      merged.required.push(...(part.required ?? []));
      if (part.description && !merged.description) merged.description = part.description;
    }
    return merged;
  }
  return schema;
}

function isEmptySchema(schema) {
  return !schema || (typeof schema === "object" && Object.keys(schema).length === 0);
}

function typeLabel(raw) {
  const s = deref(raw);
  if (!s || isEmptySchema(s)) return "any";
  let label;
  if (s.const !== undefined) label = `\`${JSON.stringify(s.const)}\``;
  else if (s.enum) label = s.enum.map((v) => (v === null ? "null" : `\`${JSON.stringify(v)}\``)).join(" \\| ");
  else if (s.oneOf || s.anyOf) label = (s.oneOf ?? s.anyOf).map((v) => typeLabel(v)).join(" \\| ");
  else if (s.type === "array") label = `${typeLabel(s.items)}[]`;
  else if (Array.isArray(s.type)) label = s.type.join(" \\| ");
  else label = s.type ?? (s.properties ? "object" : "any");
  if (s.format && !s.enum) label += ` (${s.format})`;
  if (s.nullable && !label.includes("null")) label += " \\| null";
  return label;
}

function constraints(s) {
  const out = [];
  if (s.default !== undefined) out.push(`Default \`${JSON.stringify(s.default)}\`.`);
  if (s.minimum !== undefined && s.maximum !== undefined) out.push(`From ${s.minimum} to ${s.maximum}.`);
  else if (s.minimum !== undefined) out.push(`At least ${s.minimum}.`);
  else if (s.maximum !== undefined) out.push(`At most ${s.maximum}.`);
  if (s.minLength !== undefined && s.maxLength !== undefined) out.push(`${s.minLength}–${s.maxLength} characters.`);
  else if (s.maxLength !== undefined) out.push(`Up to ${s.maxLength} characters.`);
  if (s.maxItems !== undefined) out.push(`Up to ${s.maxItems} items.`);
  if (s.pattern) out.push(`Must match \`${s.pattern}\`.`);
  return out.join(" ");
}

/** Flatten an object schema into table rows, recursing into objects and arrays of objects. */
function schemaRows(raw, prefix = "", depth = 0, rows = []) {
  const s = deref(raw);
  if (!s || depth > 4) return rows;
  const required = new Set(s.required ?? []);
  for (const [name, childRaw] of Object.entries(s.properties ?? {})) {
    const child = deref(childRaw);
    rows.push({
      name: `${prefix}${name}`,
      type: typeLabel(child),
      required: required.has(name),
      description: [child.description, constraints(child)].filter(Boolean).join(" "),
    });
    if (child.properties) schemaRows(child, `${prefix}${name}.`, depth + 1, rows);
    else if (child.type === "array" && deref(child.items)?.properties) {
      schemaRows(child.items, `${prefix}${name}[].`, depth + 1, rows);
    }
  }
  return rows;
}

// ── Text helpers ────────────────────────────────────────────────────────────

/**
 * Escape MDX-significant characters outside inline code: backslashes first,
 * so an escape already in the text can't swallow the ones added here.
 * Inline code is left alone; its contents render literally.
 */
function mdx(text = "") {
  return String(text)
    .split(/(`[^`]*`)/)
    .map((part) =>
      part.startsWith("`") ? part : part.replace(/[\\{}]/g, (c) => `\\${c}`).replace(/</g, "&lt;"),
    )
    .join("");
}

/**
 * One Markdown table cell. `mdx()` has already escaped backslashes outside
 * code, so escaping `|` here is complete there; inside code, GFM tables still
 * need `\|`, and backslashes stay literal.
 */
function cell(text = "") {
  return (
    mdx(text)
      .replace(/\|/g, () => "\\|")
      .replace(/\n+/g, " ")
      .trim() || "—"
  );
}

function table(headers, rows) {
  if (rows.length === 0) return "";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");
}

function fieldTable(rows) {
  return table(
    ["Field", "Type", "Required", "Description"],
    rows.map((r) => [`\`${r.name}\``, r.type, r.required ? "Yes" : "No", cell(r.description)]),
  );
}

const kebab = (s) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

/** A spec summary like "GET /api/v1/sops" is a placeholder, not a title. */
const isPlaceholder = (text) => !text || /^(GET|POST|PUT|PATCH|DELETE)\s+\//.test(text);

// ── Literal renderers for examples ──────────────────────────────────────────

const IDENT = /^[A-Za-z_$][\w$]*$/;

function renderLiteral(value, lang, indent = 0) {
  const pad = "  ".repeat(indent);
  const inner = "  ".repeat(indent + 1);
  const py = lang === "python";
  const indentUnit = py ? "    " : "  ";
  const padL = indentUnit.repeat(indent);
  const innerL = indentUnit.repeat(indent + 1);
  void pad;
  void inner;

  if (value === null) return py ? "None" : "null";
  if (typeof value === "boolean") return py ? (value ? "True" : "False") : String(value);
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const flat = `[${value.map((v) => renderLiteral(v, lang, 0)).join(", ")}]`;
    if (flat.length <= 60 && !value.some((v) => v && typeof v === "object")) return flat;
    return `[\n${value.map((v) => `${innerL}${renderLiteral(v, lang, indent + 1)}`).join(",\n")},\n${padL}]`;
  }
  const entries = Object.entries(value);
  if (entries.length === 0) return "{}";
  const key = (k) => (py || !IDENT.test(k) ? JSON.stringify(k) : k);
  const flat = `{ ${entries.map(([k, v]) => `${key(k)}: ${renderLiteral(v, lang, 0)}`).join(", ")} }`;
  const nested = entries.some(([, v]) => v && typeof v === "object");
  if (!nested && flat.length <= 60) return py ? flat.replace(/^\{ /, "{").replace(/ \}$/, "}") : flat;
  return `{\n${entries.map(([k, v]) => `${innerL}${key(k)}: ${renderLiteral(v, lang, indent + 1)}`).join(",\n")},\n${padL}}`;
}

const js = (value) => renderLiteral(value, "js");
const pyLit = (value, indent) => renderLiteral(value, "python", indent);

function shellQuote(json) {
  return `'${json.replace(/'/g, "'\\''")}'`;
}

// ── Collect operations ──────────────────────────────────────────────────────

function groupFor(tag) {
  const found = GROUPS.find((g) => g.tags.includes(tag));
  if (found) return found;
  const extra = { slug: kebab(tag), title: tag.replace(/[-_]/g, " ").replace(/^\w/, (c) => c.toUpperCase()), tags: [tag] };
  GROUPS.push(extra);
  return extra;
}

const operations = [];
for (const [p, item] of Object.entries(spec.paths ?? {})) {
  for (const method of METHODS) {
    const op = item[method];
    if (!op) continue;
    const key = `${method.toUpperCase()} ${p}`;
    const extra = overlay[key];
    if (!extra) {
      errors.push(`${key}: in the spec but has no entry in openapi/overlay.mjs`);
      continue;
    }
    const security = (op.security ?? spec.security ?? []).flatMap((s) => Object.keys(s));
    const deviceToken =
      op["x-device-token"] ??
      (security.includes("deviceToken") || (!spec.components?.securitySchemes?.deviceToken && DEVICE_TOKEN_FALLBACK.has(key)));
    const idempotent = op["x-idempotent"] ?? IDEMPOTENT_FALLBACK.has(key);
    const tag = op.tags?.[0] ?? "other";
    const camelId = op.operationId && /^[a-z][A-Za-z0-9]+$/.test(op.operationId) ? op.operationId : null;
    operations.push({
      key,
      method: method.toUpperCase(),
      path: p,
      op,
      extra,
      group: groupFor(tag),
      slug: extra.slug ?? kebab(camelId ?? op.summary ?? key),
      title: isPlaceholder(op.summary) ? (extra.title ?? key) : (extra.title ?? op.summary),
      description: op.description || extra.description || "",
      documented: op["x-documented"] !== false,
      scopes: op["x-required-scopes"] ?? [],
      deviceToken,
      idempotent,
      parameters: [...(item.parameters ?? []), ...(op.parameters ?? [])].map((prm) => deref(prm)),
    });
  }
}
for (const key of Object.keys(overlay)) {
  if (!operations.some((o) => o.key === key) && !errors.some((e) => e.startsWith(key))) {
    errors.push(`${key}: has an overlay entry but is not in the spec (removed or renamed?)`);
  }
}

// ── Render one operation ────────────────────────────────────────────────────

/** A readable heading for an untitled oneOf variant: a batch wrapper, or a single object. */
function variantTitle(v, i) {
  const props = Object.entries(v.properties ?? {});
  if (props.length === 1 && deref(props[0][1])?.type === "array") return `A batch: \`${props[0][0]}\``;
  if (props.length > 0) return "A single object";
  return `Option ${i + 1}`;
}

/** The request body used in examples: the spec's own example, else the overlay's. */
function exampleBody(o) {
  const media = o.op.requestBody?.content?.["application/json"];
  return media?.example ?? Object.values(media?.examples ?? {})[0]?.value ?? o.extra.body;
}

function exampleUrl(o) {
  let url = `${ORIGIN}${o.path}`;
  for (const prm of o.parameters.filter((x) => x.in === "path")) {
    const value = o.extra.path?.[prm.name];
    if (value === undefined) errors.push(`${o.key}: overlay has no example for path parameter "${prm.name}"`);
    url = url.replace(`{${prm.name}}`, encodeURIComponent(value ?? prm.name));
  }
  const query = o.extra.query ?? {};
  const qs = new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)])).toString();
  return { url, qs, query };
}

function curlExample(o) {
  const { url, qs } = exampleUrl(o);
  const token = o.deviceToken ? "$XPLANT_DEVICE_TOKEN" : "$XPLANT_API_KEY";
  const lines = [];
  const full = qs ? `"${url}?${qs}"` : url;
  lines.push(o.method === "GET" ? `curl ${full}` : `curl -X ${o.method} ${full}`);
  lines.push(`  -H "Authorization: Bearer ${token}"`);
  if (o.idempotent && o.extra.idempotencyKey) lines.push(`  -H "Idempotency-Key: ${o.extra.idempotencyKey}"`);
  const body = exampleBody(o);
  if (body) {
    lines.push(`  -H "Content-Type: application/json"`);
    lines.push(`  -d ${shellQuote(JSON.stringify(body, null, 2)).replace(/\n/g, "\n  ")}`);
  }
  return lines.join(" \\\n");
}

function pythonExample(o) {
  const { url, query } = exampleUrl(o);
  const envVar = o.deviceToken ? "XPLANT_DEVICE_TOKEN" : "XPLANT_API_KEY";
  const headers = { Authorization: "__AUTH__" };
  if (o.idempotent && o.extra.idempotencyKey) headers["Idempotency-Key"] = o.extra.idempotencyKey;
  const headerLit = pyLit(headers, 1).replace('"__AUTH__"', `f"Bearer {os.environ['${envVar}']}"`);
  const args = [`    "${url}",`, `    headers=${headerLit},`];
  if (Object.keys(query).length > 0) args.push(`    params=${pyLit(query, 1)},`);
  const body = exampleBody(o);
  if (body) args.push(`    json=${pyLit(body, 1)},`);
  args.push("    timeout=10,");
  const result = o.extra.resultVar ?? "data";
  return [
    "import os",
    "import requests",
    "",
    `resp = requests.${o.method.toLowerCase()}(`,
    ...args,
    ")",
    "body = resp.json()",
    'if not body["ok"]:',
    `    raise RuntimeError(f"{resp.status_code} {body['code']}: {body['error']}")`,
    `${result} = body["data"]`,
  ].join("\n");
}

/** For endpoints the SDK doesn't cover yet: plain fetch, same shape as the curl example. */
function fetchExample(o) {
  const { url, qs } = exampleUrl(o);
  const token = o.deviceToken ? "XPLANT_DEVICE_TOKEN" : "XPLANT_API_KEY";
  const headers = { Authorization: "__AUTH__" };
  if (o.idempotent && o.extra.idempotencyKey) headers["Idempotency-Key"] = o.extra.idempotencyKey;
  const body = exampleBody(o);
  if (body) headers["Content-Type"] = "application/json";
  const init = [`  method: "${o.method}",`, `  headers: ${js(headers).replace(/\n/g, "\n  ")},`];
  if (body) init.push(`  body: JSON.stringify(${js(body).replace(/\n/g, "\n  ")}),`);
  const result = o.extra.resultVar ?? "data";
  return [
    "// Not in @shmaplex/xplant-sdk yet, so this uses fetch directly.",
    `const res = await fetch("${qs ? `${url}?${qs}` : url}", {`,
    ...init,
    "});",
    "const body = await res.json();",
    "if (!body.ok) throw new Error(`${res.status} ${body.code}: ${body.error}`);",
    `const ${result} = body.data;`,
  ]
    .join("\n")
    .replace('"__AUTH__"', `\`Bearer \${process.env.${token}}\``);
}

function jsExample(o) {
  const sdk = o.extra.sdk;
  if (sdk === null) return fetchExample(o);
  if (!sdk) {
    errors.push(`${o.key}: overlay has no sdk call (use sdk: null if the SDK doesn't cover it yet)`);
    return "";
  }
  const body = exampleBody(o) ?? {};
  const query = o.extra.query ?? {};
  const call =
    typeof sdk === "function" ? sdk({ js, body, query }) : sdk.replace(/\$BODY/g, () => indentLiteral(sdk, "$BODY", js(body))).replace(/\$QUERY/g, js(query));
  const usesDevice = /\bdevice\./.test(call);
  const header = usesDevice
    ? "const device = new XPlantClient({ deviceToken: process.env.XPLANT_DEVICE_TOKEN });"
    : "const client = new XPlantClient({ apiKey: process.env.XPLANT_API_KEY });";
  return ['import { XPlantClient } from "@shmaplex/xplant-sdk";', "", header, "", call].join("\n");
}

/** Re-indent a multi-line literal to the column where its placeholder sits. */
function indentLiteral(template, placeholder, literal) {
  const line = template.split("\n").find((l) => l.includes(placeholder)) ?? "";
  const indent = line.match(/^\s*/)[0];
  return literal.split("\n").join(`\n${indent}`);
}

function responseSection(o) {
  const entry = Object.entries(o.op.responses ?? {}).find(([status]) => /^2\d\d$/.test(status));
  const out = [];
  if (!entry) return out;
  const [status, response] = entry;
  const media = response.content?.["application/json"];
  const envelope = deref(media?.schema);
  const dataSchema = deref(envelope?.properties?.data);
  const isList = dataSchema?.type === "array";

  out.push("## Response", "");
  out.push(
    `\`${status}\` with \`{ "ok": true, "data": … }\`. ${
      !isList
        ? "`data` holds the result."
        : o.op["x-cursor"]
          ? "`data` is an array. To get the next page, pass `meta.next_cursor` back as `cursor`; it is `null` on the last page. See [Pagination](/docs/pagination)."
          : "`data` is an array. Lists have no total: a page shorter than your `limit` is the last one. See [Pagination](/docs/pagination)."
    }`,
    "",
  );

  const rows = isList ? schemaRows(dataSchema.items) : schemaRows(dataSchema);
  if (rows.length > 0) out.push(fieldTable(rows), "");

  const specExample = media?.example ?? Object.values(media?.examples ?? {})[0]?.value;
  const fromSpec = specExample && "ok" in specExample ? specExample.data : specExample;
  const example = fromSpec ?? o.extra.response ?? null;
  if (example !== null) {
    out.push('```json title="Response"', JSON.stringify({ ok: true, data: example }, null, 2), "```", "");
  }
  const meta = deref(envelope?.properties?.meta);
  if (meta && !isEmptySchema(meta)) {
    out.push("The envelope can also carry `meta`:", "", fieldTable(schemaRows(meta)), "");
  }
  const headers = Object.entries(response.headers ?? {}).map(([name, h]) => [`\`${name}\``, cell(deref(h).description)]);
  if (headers.length > 0) out.push(table(["Response header", "Meaning"], headers), "");
  return out;
}

function errorsSection(o) {
  const rows = [];
  const listed = new Set();
  for (const [status, response] of Object.entries(o.op.responses ?? {})) {
    if (/^2\d\d$/.test(status)) continue;
    const declared = response["x-error-codes"];
    if (Array.isArray(declared) && declared.length > 0) {
      for (const entry of declared) {
        const code = typeof entry === "string" ? entry : entry.code;
        listed.add(code);
        rows.push([`\`${status}\``, `\`${code}\``, cell(typeof entry === "string" ? response.description : entry.when)]);
      }
      continue;
    }
    const schema = deref(response.content?.["application/json"]?.schema);
    const codes = deref(schema?.properties?.code)?.enum ?? (CODE_FOR_STATUS[status] ? [CODE_FOR_STATUS[status]] : []);
    for (const code of codes) listed.add(code);
    const when = String(response.description ?? "")
      .replace(/\s*`code`: `[A-Z_]+`\.?/, "")
      .replace(/^`[A-Z_]+`\s*[—–-]\s*/, "")
      .replace(/^[a-z]/, (c) => c.toUpperCase());
    rows.push([`\`${status}\``, codes.map((c) => `\`${c}\``).join(", ") || "—", cell(when)]);
  }
  const also = [];
  if (!listed.has("PAID_PLAN_REQUIRED")) also.push("`402 PAID_PLAN_REQUIRED` if the workspace's plan doesn't include the API");
  if (!listed.has("RATE_LIMIT_EXCEEDED")) also.push("`429 RATE_LIMIT_EXCEEDED` over the [rate limit](/docs/rate-limits)");
  if (o.deviceToken && !listed.has("DEVICE_TOKEN_WRONG_DEVICE"))
    also.push("`403 DEVICE_TOKEN_WRONG_DEVICE` if a device token writes about another device");
  if (!o.deviceToken && !listed.has("DEVICE_TOKEN_NOT_ACCEPTED"))
    also.push("`403 DEVICE_TOKEN_NOT_ACCEPTED` if you call it with a device token");
  if (o.idempotent && !listed.has("IDEMPOTENCY_IN_FLIGHT"))
    also.push("`409 IDEMPOTENCY_IN_FLIGHT` while a request with the same Idempotency-Key is still running");
  if (!Object.keys(o.op.responses ?? {}).some((status) => /^5/.test(status)))
    also.push("a `5xx` with a `…_FAILED` code, which is safe to retry later");

  return [
    "## Errors",
    "",
    rows.length > 0 ? table(["Status", "Code", "When"], rows) : "",
    "",
    also.length > 0
      ? `This endpoint can also answer ${also.join(", ")}. Branch on \`code\`, never on the \`error\` text. See [Errors](/docs/errors).`
      : "Branch on `code`, never on the `error` text. See [Errors](/docs/errors).",
    "",
  ];
}

function renderOperation(o) {
  const lines = [];
  const endpoint = {
    method: o.method,
    path: o.path,
    scopes: o.scopes,
    deviceToken: o.deviceToken,
    idempotent: o.idempotent,
  };
  const [summary = "", ...moreDescription] = (o.description || o.extra.description || "").split(/\n{2,}/);
  lines.push(
    "---",
    `title: ${JSON.stringify(o.title)}`,
    `description: ${JSON.stringify(summary.replace(/`|\*\*/g, "").replace(/\s+/g, " ").trim())}`,
    `endpoint: ${JSON.stringify(endpoint)}`,
    "---",
    "",
    "{/* Generated by scripts/generate-api-pages.mjs from openapi/openapi.json. Do not edit by hand. */}",
    "",
  );

  for (const paragraph of moreDescription) lines.push(mdx(paragraph.trim()), "");
  if (o.extra.notes) {
    if (!o.documented) {
      lines.push(o.extra.notes, "");
    } else {
      // The spec describes this endpoint now; keep only the overlay's pointers to guides.
      const links = [...o.extra.notes.matchAll(/\[[^\]]+\]\(\/docs\/(?!api\/)[^)]+\)/g)].map((m) => m[0]);
      if (links.length > 0) lines.push(`See also: ${[...new Set(links)].join(", ")}.`, "");
    }
  }

  if (o.idempotent) {
    lines.push(
      "Send an `Idempotency-Key` header to make retries safe: a repeat with the same key within 24 hours returns the first response instead of writing twice. See [Idempotency](/docs/idempotency).",
      "",
    );
  }

  if (!o.documented) {
    lines.push(
      "> **Full schema coming soon.** The complete request and response schema for this endpoint is being published. The example below shows a typical call.",
      "",
    );
  }

  // Parameters
  const headerParams = o.parameters.filter((x) => x.in === "header");
  const pathParams = o.parameters.filter((x) => x.in === "path");
  const queryParams = o.parameters.filter((x) => x.in === "query");
  const paramRows = (list) =>
    list.map((prm) => {
      const s = deref(prm.schema ?? {});
      return [
        `\`${prm.name}\``,
        typeLabel(s),
        prm.required || prm.in === "path" ? "Yes" : "No",
        cell([prm.description, constraints(s)].filter(Boolean).join(" ")),
      ];
    });
  if (pathParams.length > 0) {
    lines.push("## Path parameters", "", table(["Name", "Type", "Required", "Description"], paramRows(pathParams)), "");
  }
  if (queryParams.length > 0) {
    lines.push("## Query parameters", "", table(["Name", "Type", "Required", "Description"], paramRows(queryParams)), "");
  }
  if (headerParams.length > 0) {
    lines.push("## Headers", "", table(["Name", "Type", "Required", "Description"], paramRows(headerParams)), "");
  }
  for (const name of Object.keys(o.extra.query ?? {})) {
    if (o.documented && !queryParams.some((x) => x.name === name)) warnings.push(`${o.key}: example uses query parameter "${name}", which the spec doesn't list`);
  }

  // Request body
  const bodySchema = deref(o.op.requestBody?.content?.["application/json"]?.schema);
  if (bodySchema && !isEmptySchema(bodySchema)) {
    lines.push("## Request body", "");
    if (bodySchema.description) lines.push(mdx(bodySchema.description), "");
    const variants = bodySchema.oneOf ?? bodySchema.anyOf;
    if (variants) {
      lines.push("The body is one of:", "");
      variants.forEach((variant, i) => {
        const v = deref(variant);
        lines.push(`### ${v.title ?? variantTitle(v, i)}`, "");
        if (v.description) lines.push(mdx(v.description), "");
        lines.push(fieldTable(schemaRows(v)), "");
      });
    } else {
      lines.push(fieldTable(schemaRows(bodySchema)), "");
    }
  } else if (o.documented && o.method !== "GET" && o.extra.body) {
    warnings.push(`${o.key}: documented, but the spec has no request body schema`);
  }

  // Examples
  lines.push(
    "## Example",
    "",
    '```bash tab="curl" tab-group="lang"',
    curlExample(o),
    "```",
    "",
    '```js tab="JavaScript" tab-group="lang"',
    jsExample(o),
    "```",
    "",
    '```python tab="Python" tab-group="lang"',
    pythonExample(o),
    "```",
    "",
  );

  lines.push(...responseSection(o));
  lines.push(...errorsSection(o));
  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

// ── Pages ───────────────────────────────────────────────────────────────────

const files = new Map(); // relative path under content/docs → content

const byGroup = new Map();
for (const o of operations) {
  if (!byGroup.has(o.group.slug)) byGroup.set(o.group.slug, []);
  byGroup.get(o.group.slug).push(o);
}
const usedGroups = GROUPS.filter((g) => byGroup.has(g.slug));
const opUrl = (o) => `/docs/api/${o.group.slug}/${o.slug}`;

for (const group of usedGroups) {
  const ops = byGroup.get(group.slug);
  const seen = new Set();
  for (const o of ops) {
    if (seen.has(o.slug)) errors.push(`${o.key}: duplicate page slug "${o.slug}" in ${group.slug}`);
    seen.add(o.slug);
    files.set(`api/${group.slug}/${o.slug}.mdx`, renderOperation(o));
  }
  files.set(`api/${group.slug}/meta.json`, `${JSON.stringify({ title: group.title, pages: ops.map((o) => o.slug) }, null, 2)}\n`);
}
files.set(
  "api/meta.json",
  `${JSON.stringify({ title: "API reference", pages: ["index", ...usedGroups.map((g) => g.slug)] }, null, 2)}\n`,
);

// API overview
{
  const lines = [
    "---",
    'title: "API overview"',
    'description: "Every v1 endpoint, the scope it needs, and what it returns."',
    "---",
    "",
    "{/* Generated by scripts/generate-api-pages.mjs from openapi/openapi.json. Do not edit by hand. */}",
    "",
    `Base URL: \`${ORIGIN}/api/v1\`. Send your key as \`Authorization: Bearer <key>\` on every request. Request and response bodies are JSON.`,
    "",
    "Every response uses the same envelope:",
    "",
    "```json",
    '{ "ok": true, "data": { } }',
    '{ "ok": false, "data": null, "error": "Missing scope: write:tasks", "code": "FORBIDDEN" }',
    "```",
    "",
    "Read `data` on success. On failure, branch on `code`, which is stable; `error` is for people and its wording can change. See [Errors](/docs/errors).",
    "",
    "The machine-readable spec is [openapi.json](/openapi.json) (OpenAPI 3).",
    "",
  ];
  for (const group of usedGroups) {
    lines.push(`## ${group.title}`, "");
    lines.push(
      table(
        ["Endpoint", "What it does", "Scope"],
        byGroup.get(group.slug).map((o) => [
          `[\`${o.method} ${o.path.replace(/^\/api\/v1/, "")}\`](${opUrl(o)})`,
          cell(o.title),
          o.scopes.length > 0 ? o.scopes.map((s) => `\`${s}\``).join(", ") : "none",
        ]),
      ),
      "",
    );
  }
  files.set("api/index.mdx", `${lines.join("\n").trim()}\n`);
}

// Scopes page
//
// Minimum role and plan per scope, as the API enforces them. The spec's
// x-scopes doesn't carry these yet; when it does, read them from there.
const MANAGER_SCOPES = new Set(["read:pricing", "read:commerce", "write:demand"]);
const DEVICE_PLAN_SCOPES = new Set(["read:devices", "write:devices", "write:sensor_readings", "write:device_events"]);
const minRole = (s) => s.minRole ?? (MANAGER_SCOPES.has(s.id) ? "`manager`" : s.id.startsWith("write:") ? "`member`" : "Any member");
const plansFor = (s) => s.plans ?? (DEVICE_PLAN_SCOPES.has(s.id) ? "All paid plans" : "Teams, Enterprise");
{
  const byScope = new Map();
  for (const o of operations) for (const s of o.scopes) byScope.set(s, [...(byScope.get(s) ?? []), o]);
  const known = new Set(scopeCatalogue.map((s) => s.id));
  for (const s of byScope.keys()) if (!known.has(s)) errors.push(`scope "${s}" is required by an operation but missing from the spec x-scopes catalogue`);

  const categories = [...new Set(scopeCatalogue.map((s) => s.category))];
  const lines = [
    "---",
    'title: "Scopes"',
    'description: "What each of the 34 scopes allows, and the endpoints it unlocks."',
    "---",
    "",
    "{/* Generated by scripts/generate-api-pages.mjs from openapi/openapi.json. Do not edit by hand. */}",
    "",
    "A key carries exactly the scopes you choose when you create it in [Settings → Integrations → API Keys](https://app.xplantpro.com/settings/integrations/api-keys). There is no default set, and no scope implies another: `write:tasks` does not grant `read:tasks`.",
    "",
    "**Scopes are fixed when a key is created.** To change what an integration can do, create a new key with the scopes it needs, move the integration to it, then revoke the old key.",
    "",
    "**A key never does more than its owner can in xPlant.** Each scope also needs a minimum role from the key's owner and a plan that includes it (both shown below). Above the owner's role, a call answers `403 FORBIDDEN`; outside the plan, `402 PAID_PLAN_REQUIRED`. [`GET /me`](/docs/api/account/get-me) lists the key's `effectiveScopes`: what it can use right now. See [Plans and access](/docs/authentication#plans-and-access).",
    "",
    "Scope names follow `<read|write>:<resource>`. Grant each integration only what it calls.",
    "",
    "A request without the scope it needs gets `403 FORBIDDEN`, and the message names the missing scope, for example `Missing scope: write:tasks`. To see what a key holds before you call anything, use [`GET /me`](/docs/api/account/get-me); it needs no scope.",
    "",
    "Device tokens (`xpd_`) don't carry scopes. They can only write readings, heartbeats and events for their own device. See [Device tokens](/docs/device-tokens).",
    "",
    "## Common setups",
    "",
    table(
      ["Integration", "Scopes"],
      [
        ["Read-only dashboard", "`read:workspace`, `read:plants`, `read:explants`, `read:sensor_readings`"],
        ["Task sync from your scheduler", "`read:tasks`, `write:tasks`, `write:demand`"],
        ["Bench station running SOPs", "`read:sops`, `write:sop_runs`, `read:sop_runs`, `write:sop_steps`, `read:labels`, `write:label_scans`"],
        ["Transfer and stage logging", "`read:plants`, `read:explants`, `read:transfers`, `write:transfers`"],
        ["Device provisioning (run once, off the device)", "`read:devices`, `write:devices`"],
        ["Mirror change history into your warehouse", "`read:events`, `read:plants`, `read:explants`"],
      ],
    ),
    "",
    "## All scopes",
    "",
  ];
  for (const category of categories) {
    lines.push(`### ${category}`, "");
    lines.push(
      table(
        ["Scope", "Allows", "Minimum role", "Plans", "Endpoints"],
        scopeCatalogue
          .filter((s) => s.category === category)
          .map((s) => {
            const ops = byScope.get(s.id) ?? [];
            return [
              `\`${s.id}\``,
              cell(s.description),
              minRole(s),
              plansFor(s),
              ops.length > 0
                ? ops.map((o) => `[\`${o.method} ${o.path.replace(/^\/api\/v1/, "")}\`](${opUrl(o)})`).join("<br />")
                : "No endpoint yet",
            ];
          }),
      ),
      "",
    );
  }
  const unscoped = operations.filter((o) => o.scopes.length === 0);
  if (unscoped.length > 0) {
    lines.push(
      "### No scope needed",
      "",
      unscoped.map((o) => `- [\`${o.method} ${o.path.replace(/^\/api\/v1/, "")}\`](${opUrl(o)}): ${mdx(o.title)}`).join("\n"),
      "",
    );
  }
  if (scopeCatalogue.some((s) => !byScope.has(s.id))) {
    lines.push(
      "Scopes marked “No endpoint yet” can already be granted to a key, and endpoints that use them are on the way. This page updates as they ship.",
      "",
    );
  }
  files.set("scopes.mdx", `${lines.join("\n").trim()}\n`);
}

// ── Blocks inside hand-written pages ────────────────────────────────────────
//
// A hand-written page can hold a block the spec keeps current:
//   {/* generated:NAME */} … {/* /generated:NAME */}

/** Codes the API returns that the spec doesn't declare yet (their endpoints are still undocumented). */
const KNOWN_CODES = [
  { status: "402", code: "DEVICE_LIMIT_REACHED", when: "Registering a device would go past the plan's device allowance." },
  { status: "409", code: "SOP_RUN_NOT_EFFECTIVE", when: "The SOP has no version in force, so it can't be run yet." },
  { status: "409", code: "SOP_RUN_CLOSED", when: "The run is completed; its record can't change." },
];

const opLink = (o) => `[\`${o.method} ${o.path.replace(/^\/api\/v1/, "")}\`](${opUrl(o)})`;

const blocks = {
  "device-token-endpoints": () =>
    operations
      .filter((o) => o.deviceToken)
      .map((o) => `- ${opLink(o)}: ${mdx(o.title)}`)
      .join("\n"),
  "idempotent-endpoints": () =>
    operations
      .filter((o) => o.idempotent)
      .map((o) => `- ${opLink(o)}: ${mdx(o.title)}`)
      .join("\n"),
  "error-codes": () => {
    const byCode = new Map();
    const add = (status, code, when) => {
      if (/^5/.test(status)) return;
      const key = `${status} ${code}`;
      if (!byCode.has(key)) byCode.set(key, { status, code, whens: new Set() });
      if (when) byCode.get(key).whens.add(when);
    };
    for (const o of operations) {
      for (const [status, response] of Object.entries(o.op.responses ?? {})) {
        if (/^2/.test(status)) continue;
        const declared = response["x-error-codes"];
        if (Array.isArray(declared) && declared.length > 0) {
          for (const e of declared) add(status, e.code ?? e, e.when);
          continue;
        }
        const schema = deref(response.content?.["application/json"]?.schema);
        for (const code of deref(schema?.properties?.code)?.enum ?? []) add(status, code, null);
      }
    }
    for (const k of KNOWN_CODES) if (!byCode.has(`${k.status} ${k.code}`)) add(k.status, k.code, k.when);
    const generic = {
      UNAUTHORIZED: "The key is missing, malformed or revoked, or its owner is no longer a member of the workspace.",
      RATE_LIMIT_EXCEEDED: "Too many requests for this key, device token or workspace. Wait `Retry-After` seconds.",
    };
    const rows = [...byCode.values()]
      .sort((a, b) => a.status.localeCompare(b.status) || a.code.localeCompare(b.code))
      .map((r) => {
        const whens = [...r.whens].filter((w) => !/`?assigned_to`? is not an active/.test(w));
        const text = whens.length > 0 ? whens.join(" Or: ") : (generic[r.code] ?? "");
        return [`\`${r.status}\``, `\`${r.code}\``, cell(text)];
      });
    rows.push(["`5xx`", "`…_FAILED`", "Something failed on our side; each endpoint names its own code. Retry later; don't branch on the specific code."]);
    return table(["Status", "Code", "Meaning"], rows);
  },
};

function fillBlocks(text, file) {
  return text.replace(
    /\{\/\* generated:([\w-]+) \*\/\}[\s\S]*?\{\/\* \/generated:\1 \*\/\}/g,
    (_m, name) => {
      if (!blocks[name]) {
        errors.push(`${file}: unknown generated block "${name}"`);
        return _m;
      }
      return `{/* generated:${name} */}\n${blocks[name]()}\n{/* /generated:${name} */}`;
    },
  );
}

for (const name of readdirSync(path.join(root, "content/docs"))) {
  if (!name.endsWith(".mdx") || files.has(name)) continue;
  const full = path.join(root, "content/docs", name);
  const text = readFileSync(full, "utf8");
  if (!text.includes("{/* generated:")) continue;
  files.set(name, fillBlocks(text, name));
}

// ── Write or check ──────────────────────────────────────────────────────────

const contentDir = path.join(root, "content/docs");

function listGenerated() {
  const out = [];
  const apiDir = path.join(contentDir, "api");
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else out.push(path.relative(contentDir, full));
    }
  };
  walk(apiDir);
  return out;
}

for (const w of warnings) console.warn(`warn  ${w}`);
if (errors.length > 0) {
  for (const e of errors) console.error(`error ${e}`);
  console.error(`\n✗ ${errors.length} error(s)`);
  process.exit(1);
}

if (CHECK) {
  const stale = [];
  for (const [rel, content] of files) {
    const full = path.join(contentDir, rel);
    if (!existsSync(full) || readFileSync(full, "utf8") !== content) stale.push(rel);
  }
  for (const rel of listGenerated()) if (!files.has(rel)) stale.push(`${rel} (should not exist)`);
  if (stale.length > 0) {
    console.error(`✗ generated pages are stale; run npm run generate:\n  ${stale.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`✓ ${operations.length} operations, pages up to date`);
} else {
  rmSync(path.join(contentDir, "api"), { recursive: true, force: true });
  for (const [rel, content] of files) {
    const full = path.join(contentDir, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  mkdirSync(path.join(root, "public"), { recursive: true });
  writeFileSync(path.join(root, "public/openapi.json"), readFileSync(path.join(root, "openapi/openapi.json")));
  console.log(`✓ generated ${operations.length} operation pages, the API overview and the scopes page`);
}
