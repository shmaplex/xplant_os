import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Banner } from "fumadocs-ui/components/banner";
import { Provider } from "@/components/provider";
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
        {/* Remove once @shmaplex/xplant-sdk 0.4.0 is the npm "latest". */}
        <Banner id="sdk-0-4-pending" className="bg-fd-secondary text-fd-secondary-foreground">
          <span className="px-2 text-center text-sm text-pretty">
            The JavaScript examples use @shmaplex/xplant-sdk 0.4.0, which is on its way to npm. Until it lands,{" "}
            <code className="font-mono">npm install</code> gives you an older version. curl and Python examples work today.
          </span>
        </Banner>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
