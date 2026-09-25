import { notFound } from "next/navigation";
import { renderPageMarkdown } from "@/lib/llms";
import { getPageMarkdownUrl } from "@/lib/shared";
import { source } from "@/lib/source";

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<"/llms.mdx/docs/[[...slug]]">) {
  const { slug } = await params;
  // drop the trailing "content.md"
  const page = source.getPage(slug?.slice(0, -1));
  if (!page) notFound();

  return new Response(await renderPageMarkdown(page), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    slug: getPageMarkdownUrl(page).segments,
  }));
}
