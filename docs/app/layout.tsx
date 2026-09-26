import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Banner } from "fumadocs-ui/components/banner";
import { Provider } from "@/components/provider";
import { SDK_VERSION } from "@/openapi/sdk-version.mjs";
import { appName, siteUrl } from "@/lib/shared";
import "./global.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${appName} documentation`,
    template: `%s · ${appName}`,
  },
  description:
    "Reference and guides for the xPlant REST API: connect your lab's systems, scripts and devices to your xPlant workspace.",
  alternates: {
    types: { "text/plain": "/llms.txt" },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f6ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1c13" },
  ],
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={mono.variable} suppressHydrationWarning>
      <head>
        {/* Switzer and Clash Display are served by Fontshare, their publisher. */}
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&f[]=clash-display@600&display=swap"
        />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        {/* One banner per SDK release: the id changes with the version, so dismissing it hides it until the next one. */}
        <Banner id={`sdk-${SDK_VERSION}`} className="bg-fd-secondary text-fd-secondary-foreground">
          <a
            href={`https://github.com/shmaplex/xplant_sdk/releases/tag/v${SDK_VERSION}`}
            className="px-2 text-center text-sm font-medium text-pretty underline-offset-4 hover:underline"
          >
            @shmaplex/xplant-sdk {SDK_VERSION} is out: what&apos;s new →
          </a>
        </Banner>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
