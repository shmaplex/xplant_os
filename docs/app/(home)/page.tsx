import { ArrowRight, BookOpen, Braces, Cpu, KeyRound, Sparkles } from "lucide-react";
import Link from "next/link";
import { apiKeysUrl, siteUrl } from "@/lib/shared";

const cards = [
  {
    href: "/docs/quickstart",
    title: "Quickstart",
    body: "Create a key and make your first call in five minutes.",
    icon: ArrowRight,
  },
  {
    href: "/docs/api",
    title: "API reference",
    body: "Every endpoint, with its scope, parameters, responses and errors.",
    icon: Braces,
  },
  {
    href: "/docs/guides",
    title: "Guides",
    body: "Sync tasks, record transfers, run SOPs from a bench, stream sensor data.",
    icon: BookOpen,
  },
  {
    href: "/docs/scopes",
    title: "Scopes",
    body: "All 34 scopes and the endpoints each one unlocks.",
    icon: KeyRound,
  },
  {
    href: "/docs/device-tokens",
    title: "Device tokens",
    body: "Put an xpd_ token on the Pi, never a workspace key.",
    icon: Cpu,
  },
  {
    href: "/docs/ai-tools",
    title: "Use with AI tools",
    body: "Every page as Markdown, plus llms.txt and llms-full.txt.",
    icon: Sparkles,
  },
];

const firstCall = `curl https://app.xplantpro.com/api/v1/me \\
  -H "Authorization: Bearer $XPLANT_API_KEY"`;

const firstResponse = `{
  "ok": true,
  "data": {
    "key": {
      "name": "Grow room bridge",
      "prefix": "xpk_live_abcd"
    },
    "scopes": ["read:plants", "read:tasks"],
    "workspace": { "id": "…" }
  }
}`;

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 py-12 sm:px-6 md:py-20">
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-6">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-fd-muted-foreground">
            xPlant REST API · v1
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl">
            Connect your lab to xPlant.
          </h1>
          <p className="max-w-xl text-lg text-pretty text-fd-muted-foreground">
            Read and write plants, tasks, transfers, SOP runs, labels and sensor data from your
            own scripts, bench stations and devices. One key, the scopes you choose, and a
            response shape that never surprises you.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/docs/quickstart"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-fd-primary px-5 font-medium text-fd-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:ring-offset-2 focus-visible:ring-offset-fd-background"
            >
              Start the quickstart <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href={apiKeysUrl}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-fd-border bg-fd-card px-5 font-medium transition-colors hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
            >
              Get an API key
            </a>
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-fd-border bg-fd-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-fd-border px-4 py-2.5">
            <span className="size-2 rounded-full bg-future-lime" aria-hidden />
            <span className="font-mono text-xs text-fd-muted-foreground">Your first call</span>
          </div>
          <pre className="overflow-x-auto px-4 py-4 font-mono text-[13px] leading-relaxed">
            <code>{firstCall}</code>
          </pre>
          <pre className="overflow-x-auto border-t border-fd-border bg-fd-muted/60 px-4 py-4 font-mono text-[13px] leading-relaxed text-fd-muted-foreground">
            <code>{firstResponse}</code>
          </pre>
        </div>
      </section>

      <section aria-labelledby="start-here" className="flex flex-col gap-6">
        <h2 id="start-here" className="text-2xl font-semibold tracking-tight">
          Start here
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ href, title, body, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-fd-border bg-fd-card p-5 transition-colors hover:border-fd-primary/50 hover:bg-fd-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-fd-secondary text-fd-primary">
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <span className="font-semibold">{title}</span>
                <span className="text-sm text-pretty text-fd-muted-foreground">{body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-fd-border bg-fd-card p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Working with an AI assistant?</h2>
          <p className="text-sm text-pretty text-fd-muted-foreground">
            Point it at <code className="font-mono text-fd-foreground">{siteUrl}/llms-full.txt</code>{" "}
            for the whole API on one page, or use “Copy page as Markdown” on any page.
          </p>
        </div>
        <Link
          href="/docs/ai-tools"
          className="inline-flex min-h-10 shrink-0 items-center gap-2 self-start rounded-xl border border-fd-border px-4 text-sm font-medium transition-colors hover:bg-fd-accent md:self-auto"
        >
          How it works <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>
    </main>
  );
}
