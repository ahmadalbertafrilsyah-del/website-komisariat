import { getBerita, getBeritaSEO, SITE_NAME, SITE_URL } from "@/lib/berita-server";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const article = await getBerita(id);
  if (!article) {
    return {
      title: "Artikel Tidak Ditemukan",
      robots: { index: false, follow: false },
    };
  }

  const seo = getBeritaSEO(article);
  return {
    metadataBase: new URL(SITE_URL),
    // Nama situs ditambahkan satu kali oleh template pada layout utama.
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonicalUrl },
    openGraph: {
      type: "article",
      locale: "id_ID",
      url: seo.canonicalUrl,
      siteName: SITE_NAME,
      title: seo.title,
      description: seo.description,
      ...(seo.datePublished ? { publishedTime: seo.datePublished } : {}),
      ...(seo.dateModified ? { modifiedTime: seo.dateModified } : {}),
      images: [{
        url: seo.shareImage,
        alt: seo.title,
        ...(seo.optimizedCover ? { width: 1200, height: 630, type: "image/jpeg" } : {}),
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [{ url: seo.shareImage, alt: seo.title }],
    },
  };
}

export default function BeritaDetailLayout({ children }) {
  return <>{children}</>;
}
