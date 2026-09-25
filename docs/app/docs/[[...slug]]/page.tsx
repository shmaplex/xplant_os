import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  EditOnGitHub,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EndpointHeader } from "@/components/endpoint-header";
import { getMDXComponents } from "@/components/mdx";
import { PageActions } from "@/components/page-actions";
import { SiteFooter } from "@/components/site-footer";
import { getPageMarkdownUrl, gitConfig, siteUrl } from "@/lib/shared";
import { source } from "@/lib/source";
import type { ComponentProps } from "react";

/**
 * Links inside page content. Files (/llms-full.txt, /openapi.json, *.md)
 * aren't pages, and client-side navigation to one lands on the 404 page,
 * so they get a plain anchor; everything else keeps Fumadocs' linking.
 */
function contentLink(RelativeLink: ReturnType<typeof createRelativeLink>) {
  return function ContentLink(props: ComponentProps<"a">) {
    const href = props.href ?? "";
    if (href.startsWith("/") && /\.[a-z0-9]+$/i.test(href.split("#")[0])) return <a {...props} />;
    return <RelativeLink {...props} />;
  };
}

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownPath = getPageMarkdownUrl(page).short;
  const endpoint = page.data.endpoint;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      {endpoint ? <EndpointHeader endpoint={endpoint} /> : null}
      <PageActions markdownPath={markdownPath} markdownUrl={`${siteUrl}${markdownPath}`} />
      <DocsBody>
        <MDX components={getMDXComponents({ a: contentLink(createRelativeLink(source, page)) })} />
      </DocsBody>
      {/* API pages are generated from the spec, so there is nothing to edit by hand. */}
      {endpoint ? null : (
        <EditOnGitHub
          href={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/${gitConfig.contentDir}/${page.path}`}
        />
      )}
      <SiteFooter compact />
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<"/docs/[[...slug]]">): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const markdownPath = getPageMarkdownUrl(page).short;
  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: page.url,
      types: { "text/markdown": markdownPath },
    },
  };
}
