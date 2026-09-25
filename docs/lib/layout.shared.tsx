import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { apiKeysUrl, gitConfig, marketingUrl } from "./shared";

function Wordmark() {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="font-display text-lg font-semibold tracking-tight">xPlant</span>
      <span className="rounded-md bg-future-lime px-1.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0c1a0f]">
        API
      </span>
    </span>
  );
}

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <Wordmark />,
      url: "/",
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      { text: "Docs", url: "/docs", active: "nested-url" },
      { text: "API reference", url: "/docs/api", active: "nested-url" },
      { text: "Get an API key", url: apiKeysUrl, external: true },
      { text: "xplantpro.com", url: marketingUrl, external: true },
    ],
  };
}
