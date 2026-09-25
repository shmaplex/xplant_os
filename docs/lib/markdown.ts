import { siteUrl } from "./shared";

/**
 * Turns a page's MDX source into plain Markdown for /docs/<slug>.md and
 * llms-full.txt. The site's MDX sticks to a handful of components, and each
 * one has a plain-Markdown equivalent here.
 */
export function mdxToMarkdown(source: string): string {
  let text = source.replace(/^---\n[\s\S]*?\n---\n/, "");

  // MDX comments
  text = text.replace(/\{\/\*[\s\S]*?\*\/\}\n?/g, "");

  // ```lang tab="Label" tab-group="…"  →  **Label**, then a plain fence
  text = text.replace(/^```(\w+)?[^\n]*?\btab="([^"]+)"[^\n]*$/gm, (_m, lang = "", label) => `**${label}**\n\n\`\`\`${lang}`);

  // <Cards> / <Card title href description />  →  a link list
  text = text.replace(/^\s*<\/?Cards>\s*$/gm, "");
  text = text.replace(/^\s*<Card\s+([^>]*?)\/>\s*$/gm, (_m, attrs: string) => {
    const attr = (name: string) => attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? "";
    const description = attr("description");
    return `- [${attr("title")}](${attr("href")})${description ? `: ${description}` : ""}`;
  });

  // <Callout type="…" title="…"> … </Callout>  →  a blockquote
  text = text.replace(/<Callout([^>]*)>([\s\S]*?)<\/Callout>/g, (_m, attrs: string, body: string) => {
    const title = attrs.match(/title="([^"]*)"/)?.[1];
    const type = attrs.match(/type="([^"]*)"/)?.[1];
    const label = title ?? (type === "warn" || type === "warning" ? "Warning" : type === "error" ? "Important" : "Note");
    const lines = body.trim().split("\n").map((line) => `> ${line}`.trimEnd());
    return `> **${label}**\n>\n${lines.join("\n")}`;
  });

  // <Steps> / <Step> wrappers carry no content of their own
  text = text.replace(/^\s*<\/?Steps?>\s*$/gm, "");

  // Links to other pages point at their Markdown twins
  text = text.replace(/\]\((\/docs(?:\/[^)#\s]*)?)(#[^)\s]*)?\)/g, (_m, route: string, hash = "") => {
    const md = route === "/docs" ? "/docs.md" : `${route.replace(/\/$/, "")}.md`;
    return `](${siteUrl}${md}${hash})`;
  });

  return text.replace(/\n{3,}/g, "\n\n").trim();
}
