import type { Node, Root } from "fumadocs-core/page-tree";
import { mdxToMarkdown } from "./markdown";
import { apiOrigin, appName, getPageMarkdownUrl, siteUrl, supportEmail } from "./shared";
import { source, type DocsPage } from "./source";

function endpointLine(page: DocsPage): string {
  const endpoint = page.data.endpoint;
  if (!endpoint) return "";

  const scopes = endpoint.scopes.length > 0 ? endpoint.scopes.map((s) => `\`${s}\``).join(", ") : "none";
  const lines = [
    `\`${endpoint.method} ${apiOrigin}${endpoint.path}\``,
    "",
    `- Required scope: ${scopes}`,
    `- Credentials: ${endpoint.deviceToken ? "workspace API key (`xpk_`) or device token (`xpd_`)" : "workspace API key (`xpk_`)"}`,
    `- Idempotency-Key: ${endpoint.idempotent ? "honoured (24 hours)" : "ignored on this endpoint"}`,
    "",
  ];
  return lines.join("\n");
}

/** One page as standalone Markdown: what `/docs/<slug>.md` serves. */
export async function renderPageMarkdown(page: DocsPage): Promise<string> {
  const body = mdxToMarkdown(await page.data.getText("raw"));
  const parts = [`# ${page.data.title}`];
  if (page.data.description) parts.push(`> ${page.data.description}`);
  parts.push(`Source: ${siteUrl}${page.url}`);
  const endpoint = endpointLine(page).trim();
  if (endpoint) parts.push(endpoint);
  parts.push(body);

  return `${parts.join("\n\n")}\n`;
}

function formatNode(node: Node, depth: number, out: string[]) {
  const indent = "  ".repeat(depth);

  if (node.type === "separator") {
    out.push("", `## ${typeof node.name === "string" ? node.name : ""}`.trim(), "");
    return;
  }

  if (node.type === "page") {
    const page = source.getNodePage(node);
    if (!page) return;
    const url = `${siteUrl}${getPageMarkdownUrl(page).short}`;
    const description = page.data.description ? `: ${page.data.description}` : "";
    out.push(`${indent}- [${page.data.title}](${url})${description}`);
    return;
  }

  const name = typeof node.name === "string" ? node.name : "";
  out.push(`${indent}- ${name}`);
  if (node.index) formatNode(node.index, depth + 1, out);
  for (const child of node.children) formatNode(child, depth + 1, out);
}

/** llms.txt: a map of the site, each entry linking a page's Markdown twin. */
export function renderLlmsIndex(): string {
  const tree: Root = source.getPageTree();
  const out: string[] = [
    `# ${appName}`,
    "",
    "> The xPlant REST API (v1) lets a lab's own systems read and write its xPlant workspace: plants, explants, tasks, transfers and stages, SOP runs, labels, devices, sensor readings and equipment events.",
    "",
    `- API base URL: ${apiOrigin}/api/v1`,
    "- Auth: `Authorization: Bearer <key>`; workspace keys start `xpk_`, device tokens start `xpd_`.",
    '- Every response is `{"ok":true,"data":...}` or `{"ok":false,"data":null,"error":"...","code":"STABLE_CODE"}`; branch on `code`, never on `error`.',
    "- JavaScript SDK: `npm install @shmaplex/xplant-sdk` (https://github.com/shmaplex/xplant_sdk)",
    "- Product: xPlant, lab management for plant tissue culture: https://www.xplantpro.com",
    "- Plans (which include the API): https://www.xplantpro.com/en/subscriptions",
    `- Everything on one page: ${siteUrl}/llms-full.txt`,
    `- Support: ${supportEmail}`,
  ];
  for (const child of tree.children) formatNode(child, 0, out);
  return `${out.join("\n")}\n`;
}

/** llms-full.txt: every page, in sidebar order. */
export async function renderLlmsFull(): Promise<string> {
  const pages: DocsPage[] = [];
  const walk = (node: Node) => {
    if (node.type === "page") {
      const page = source.getNodePage(node);
      if (page) pages.push(page);
    } else if (node.type === "folder") {
      if (node.index) walk(node.index);
      node.children.forEach(walk);
    }
  };
  source.getPageTree().children.forEach(walk);

  const rendered = await Promise.all(pages.map(renderPageMarkdown));
  return rendered.join("\n---\n\n");
}
