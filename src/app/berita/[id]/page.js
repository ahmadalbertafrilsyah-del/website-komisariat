import { notFound } from "next/navigation";
import { getBerita, getNewsArticleSchema, serializeArticle } from "@/lib/berita-server";
import BeritaClient from "./BeritaClient";

export const dynamic = "force-dynamic";

export default async function DetailBeritaPage({ params }) {
  const { id } = await params;
  const article = await getBerita(id);
  if (!article) notFound();

  const structuredData = getNewsArticleSchema(article);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <BeritaClient key={article.id} initialArticle={serializeArticle(article)} />
    </>
  );
}
