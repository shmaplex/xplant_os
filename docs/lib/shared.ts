import { createGetUrl } from "fumadocs-core/source";

export const appName = "xPlant API";

/**
 * Where this site is published. The "Open in ChatGPT / Claude" links hand this
 * URL to the assistant, so it must be the public address, not localhost.
 * Override at build time with SITE_URL.
 */
export const siteUrl = (process.env.SITE_URL ?? "https://docs.xplantpro.com").replace(/\/$/, "");

/** The API and the app. www.xplantpro.com is the marketing site only. */
export const apiOrigin = "https://app.xplantpro.com";
export const apiKeysUrl = `${apiOrigin}/settings/integrations/api-keys`;
export const marketingUrl = "https://www.xplantpro.com";
export const supportEmail = "support@xplantpro.com";
export const sdkRepoUrl = "https://github.com/shmaplex/xplant_sdk";

export const docsRoute = "/docs";
export const docsContentRoute = "/llms.mdx/docs";

export const gitConfig = {
  user: "shmaplex",
  repo: "xplant_os",
  branch: "main",
  contentDir: "docs/content/docs",
};

const getContentUrl = createGetUrl(docsContentRoute);

/**
 * The raw Markdown twin of a page. The build writes each one to both
 * `/llms.mdx/docs/<slug>/content.md` and the shorter `/docs/<slug>.md`
 * (see scripts/postbuild.mjs); the short form is what we link and hand to
 * assistants.
 */
export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, "content.md"];
  const short =
    page.slugs.length === 0 ? `${docsRoute}.md` : `${docsRoute}/${page.slugs.join("/")}.md`;

  return { segments, url: getContentUrl(segments, page.locale), short };
}
