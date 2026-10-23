import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

// Perbarui sitemap secara berkala agar berita baru ikut ditemukan.
export const revalidate = 300;

const BASE_URL = "https://pmii-uinmalang.or.id";

// Harus sama dengan pembentukan slug pada halaman detail dan metadata berita.
const createSlug = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const toValidDate = (value) => {
  if (value === null || value === undefined || value === "") return null;

  try {
    let date;

    if (typeof value.toDate === "function") {
      date = value.toDate();
    } else if (value instanceof Date) {
      date = value;
    } else if (typeof value === "object" && Number.isFinite(value.seconds)) {
      date = new Date(value.seconds * 1000);
    } else if (typeof value === "string" || typeof value === "number") {
      date = new Date(value);
    } else {
      return null;
    }

    return date instanceof Date && Number.isFinite(date.getTime()) ? date : null;
  } catch {
    return null;
  }
};

const getImageUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value.trim(), BASE_URL);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

export default async function sitemap() {
  // Jangan membuat tanggal pembaruan palsu untuk halaman statis.
  const staticRoutes = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/berita`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/pendaftaran`, changeFrequency: "always", priority: 0.9 },
    { url: `${BASE_URL}/rayon`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/struktur`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/administrasi`, changeFrequency: "weekly", priority: 0.7 },
  ];

  // Gunakan sumber data yang sama dengan halaman berita publik saat ini.
  // Jika pembacaan gagal, biarkan request gagal agar sitemap parsial tidak
  // menggantikan daftar artikel yang sebelumnya berhasil diambil.
  const snapshot = await getDocs(collection(db, "berita"));
  const articleRoutes = new Map();
  let latestArticleDate = null;

  for (const document of snapshot.docs) {
    const article = document.data();
    const title = typeof article.title === "string" ? article.title.trim() : "";
    if (!title) continue;

    const slug = createSlug(title) || document.id;
    const url = `${BASE_URL}/berita/${encodeURIComponent(slug)}`;

    // Halaman detail mencari kecocokan pertama untuk slug yang sama.
    if (articleRoutes.has(url)) continue;

    const lastModified =
      toValidDate(article.updatedAt) || toValidDate(article.createdAt);
    const imageUrl = getImageUrl(article.imageUrl);

    articleRoutes.set(url, {
      url,
      ...(lastModified ? { lastModified } : {}),
      ...(imageUrl ? { images: [imageUrl] } : {}),
      changeFrequency: "weekly",
      priority: 0.8,
    });

    if (lastModified && (!latestArticleDate || lastModified > latestArticleDate)) {
      latestArticleDate = lastModified;
    }
  }

  if (latestArticleDate) {
    staticRoutes[1].lastModified = latestArticleDate;
  }

  return [...staticRoutes, ...articleRoutes.values()];
}
