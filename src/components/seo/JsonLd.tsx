// src/components/seo/JsonLd.tsx
// Reusable component để inject Schema.org JSON-LD

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Inject một hoặc nhiều JSON-LD schema vào <head>
 * 
 * Cách dùng:
 *   <JsonLd data={schemaWebApp()} />
 *   <JsonLd data={[schemaArticle(), schemaBreadcrumb()]} />
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(Array.isArray(data) ? data : [data]),
      }}
    />
  );
}
