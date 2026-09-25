import Link from "next/link";
import { apiKeysUrl, marketing, sdkRepoUrl, signInUrl, signUpUrl, supportEmail } from "@/lib/shared";
import { cn } from "@/lib/cn";

type FooterLink = { text: string; href: string; external?: boolean };

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "xPlant",
    links: [
      { text: "xplantpro.com", href: marketing.home, external: true },
      { text: "How it works", href: marketing.howItWorks, external: true },
      { text: "Plans and pricing", href: marketing.plans, external: true },
      { text: "FAQ", href: marketing.faq, external: true },
    ],
  },
  {
    title: "Developers",
    links: [
      { text: "Quickstart", href: "/docs/quickstart" },
      { text: "API reference", href: "/docs/api" },
      { text: "JavaScript SDK", href: sdkRepoUrl, external: true },
      { text: "llms-full.txt", href: "/llms-full.txt" },
    ],
  },
  {
    title: "Account",
    links: [
      { text: "Sign in", href: signInUrl, external: true },
      { text: "Create an account", href: signUpUrl, external: true },
      { text: "Get an API key", href: apiKeysUrl, external: true },
    ],
  },
  {
    title: "Help",
    links: [
      { text: "Support", href: marketing.support, external: true },
      { text: supportEmail, href: `mailto:${supportEmail}`, external: true },
      { text: "About xPlant", href: marketing.about, external: true },
    ],
  },
];

function FooterAnchor({ link, className }: { link: FooterLink; className?: string }) {
  const cls = cn(
    "rounded-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring",
    className,
  );
  // Files such as /llms-full.txt aren't pages: client-side navigation to them
  // lands on the 404 page, so they get a plain anchor like external links.
  const isFile = /\.[a-z0-9]+$/i.test(link.href);
  return link.external || isFile ? (
    <a href={link.href} className={cls} {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}>
      {link.text}
    </a>
  ) : (
    <Link href={link.href} className={cls}>
      {link.text}
    </Link>
  );
}

const legal: FooterLink[] = [
  { text: "Privacy", href: marketing.privacy, external: true },
  { text: "Terms", href: marketing.terms, external: true },
];

/** Links back to xplantpro.com, the app and support. `compact` for the foot of a docs page. */
export function SiteFooter({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <footer className="not-prose mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-fd-border pt-6 text-sm">
        <span className="text-fd-muted-foreground">
          <a href={marketing.home} className="font-medium text-fd-foreground hover:underline">
            xPlant
          </a>
          , the lab platform for plant tissue culture.
        </span>
        <FooterAnchor link={{ text: "Plans and pricing", href: marketing.plans, external: true }} />
        <FooterAnchor link={{ text: "Support", href: marketing.support, external: true }} />
        {legal.map((l) => (
          <FooterAnchor key={l.href} link={l} />
        ))}
      </footer>
    );
  }

  return (
    <footer className="border-t border-fd-border bg-fd-card/40">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_repeat(4,1fr)]">
        <div className="flex flex-col gap-3">
          <a href={marketing.home} className="w-fit font-display text-lg font-semibold tracking-tight">
            xPlant
          </a>
          <p className="max-w-xs text-sm text-pretty text-fd-muted-foreground">
            The lab management platform for plant tissue culture. These docs cover its API.
          </p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="flex flex-col gap-2.5 text-sm">
            <p className="font-medium">{col.title}</p>
            {col.links.map((link) => (
              <FooterAnchor key={link.href} link={link} className="w-fit" />
            ))}
          </nav>
        ))}
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 border-t border-fd-border px-4 py-5 text-xs text-fd-muted-foreground sm:px-6">
        <span>© {new Date().getFullYear()} Shmaplex</span>
        {legal.map((l) => (
          <FooterAnchor key={l.href} link={l} />
        ))}
        <a href="https://github.com/shmaplex/xplant_os" className="hover:text-fd-foreground">
          Docs source on GitHub
        </a>
      </div>
    </footer>
  );
}
