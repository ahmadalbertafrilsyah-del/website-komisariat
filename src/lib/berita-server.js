import { cache } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export const SITE_URL = "https://pmii-uinmalang.or.id";
export const SITE_NAME = "PMII Sunan Ampel Malang";
export const SITE_LOGO =
  "https://res.cloudinary.com/dxeh0qwc9/image/upload/v1779290231/icon_zcnk4k.png";

export const createSlug = (title = "") =>
  String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export const toISODate = (value) => {
  if (value === null || value === undefined || value === "") return undefined;
  try {
    let date;
    if (typeof value.toDate === "function") date = value.toDate();
    else if (value instanceof Date) date = value;
    else if (typeof value === "object" && Number.isFinite(value.seconds)) {
      date = new Date(value.seconds * 1000);
    } else if (typeof value === "string" || typeof value === "number") {
      date = new Date(value);
    } else return undefined;
    return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
  } catch {
    return undefined;
  }
};

// Firestore Timestamp harus diubah menjadi data biasa sebelum dikirim
// sebagai props dari Server Component ke Client Component.
export const serializeArticle = (value) => {
  if (value === undefined) return null;
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date || typeof value.toDate === "function") {
    return toISODate(value) || null;
  }
  if (Array.isArray(value)) return value.map(serializeArticle);
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, serializeArticle(item)])
  );
};

// React cache menghindari pembacaan artikel berulang dalam satu render server,
// misalnya saat metadata dan halaman sama-sama meminta artikel yang sama.
export const getBerita = cache(async (rawId) => {
  if (typeof rawId !== "string" || !rawId) return null;

  let decodedId;
  try {
    decodedId = decodeURIComponent(rawId);
  } catch {
    decodedId = rawId;
  }

  if (!decodedId || decodedId.includes("/")) return null;

  const direct = await getDoc(doc(db, "berita", decodedId));
  if (direct.exists()) return { ...direct.data(), id: direct.id };

  // Kompatibel dengan database lama yang belum menyimpan field slug.
  const snapshot = await getDocs(collection(db, "berita"));
  const found = snapshot.docs.find(
    (item) => createSlug(item.data().title || "") === decodedId
  );
  return found ? { ...found.data(), id: found.id } : null;
});

export const absoluteImageUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const url = new URL(value.trim(), SITE_URL);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
};

const plainText = (value = "") =>
  String(value ?? "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();

export const getBeritaSEO = (article) => {
  const title = String(article.title || "Berita").trim() || "Berita";
  const text = plainText(article.excerpt) || plainText(article.content) || title;
  const description = text.length > 160
    ? `${text.slice(0, 157).replace(/\s+\S*$/, "")}...`
    : text;
  const slug = createSlug(article.title || "") || article.id;
  const canonicalUrl = `${SITE_URL}/berita/${encodeURIComponent(slug)}`;
  const image = absoluteImageUrl(article.imageUrl);
  let shareImage = image || SITE_LOGO;
  let optimizedCover = false;
  const imageUrl = new URL(shareImage);
  if (
    imageUrl.hostname === "res.cloudinary.com" &&
    imageUrl.pathname.includes("/image/upload/") &&
    !imageUrl.pathname.includes("/s--")
  ) {
    imageUrl.pathname = imageUrl.pathname.replace(
      "/image/upload/",
      "/image/upload/c_pad,w_1200,h_630,b_white,q_80,f_jpg/"
    );
    shareImage = imageUrl.href;
    optimizedCover = true;
  }

  return {
    title,
    description,
    canonicalUrl,
    image,
    shareImage,
    optimizedCover,
    datePublished: toISODate(article.createdAt),
    dateModified: toISODate(article.updatedAt),
  };
};

export const getNewsArticleSchema = (article) => {
  const seo = getBeritaSEO(article);
  const authorName = typeof article.penulis === "string" ? article.penulis.trim() : "";
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${seo.canonicalUrl}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": seo.canonicalUrl },
    url: seo.canonicalUrl,
    headline: seo.title,
    description: seo.description,
    inLanguage: "id-ID",
    ...(seo.image ? { image: [seo.image] } : {}),
    ...(seo.datePublished ? { datePublished: seo.datePublished } : {}),
    ...(seo.dateModified ? { dateModified: seo.dateModified } : {}),
    author: authorName
      ? { "@type": "Person", name: authorName }
      : { "@type": "Organization", name: "Tim Redaksi PMII" },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: SITE_LOGO },
    },
  };
};
