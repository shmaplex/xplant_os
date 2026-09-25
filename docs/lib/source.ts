import { loader } from "fumadocs-core/source";
import { defineDocs } from "fumadocs-mdx/macro";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { z } from "zod";
import { docsRoute } from "./shared";

/**
 * API reference pages are generated from the OpenAPI spec
 * (scripts/generate-api-pages.mjs) and carry the endpoint in frontmatter, so
 * the page header and the Markdown twin render it the same way.
 */
const endpointSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  path: z.string(),
  scopes: z.array(z.string()),
  deviceToken: z.boolean().default(false),
  idempotent: z.boolean().default(false),
});

const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: pageSchema.extend({
      endpoint: endpointSchema.optional(),
    }),
  },
  meta: {
    schema: metaSchema,
  },
});

export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [],
});

export type DocsPage = NonNullable<ReturnType<typeof source.getPage>>;
