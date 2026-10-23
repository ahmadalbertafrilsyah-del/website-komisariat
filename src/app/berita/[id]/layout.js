import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

const createSlug = (title) => {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const rawId = resolvedParams.id;
  const decodedId = decodeURIComponent(rawId);

  let article = null;

  try {
    const docRef = doc(db, "berita", decodedId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      article = docSnap.data();
    } else {
      const snapshot = await getDocs(collection(db, "berita"));
      const found = snapshot.docs.find(d => createSlug(d.data().title || "") === decodedId);
      if (found) article = found.data();
    }
  } catch (error) {
    console.error("Gagal menarik metadata:", error);
  }

  const siteUrl = "https://pmii-uinmalang.or.id";

  if (!article) {
    return { 
      metadataBase: new URL(siteUrl),
      title: "Artikel Tidak Ditemukan | PMII UIN Malang" 
    };
  }

  // Gunakan sampul unggahan. Gunakan logo jika sampul belum tersedia.
const fallbackImage =
  "https://res.cloudinary.com/dxeh0qwc9/image/upload/v1779290231/icon_zcnk4k.png";

const uploadedCover =
  typeof article.imageUrl === "string"
    ? article.imageUrl.trim()
    : "";

const coverImage = new URL(
  uploadedCover || fallbackImage,
  siteUrl
).href;

  return {
    metadataBase: new URL(siteUrl), 
    title: `${article.title} | PMII Sunan Ampel Malang`,
    description: article.excerpt || "Baca selengkapnya di portal pergerakan PMII Sunan Ampel Malang...",
    openGraph: {
      type: "article",
      locale: "id_ID",
      url: `/berita/${rawId}`,
      title: article.title,
      description: article.excerpt || "Baca selengkapnya di portal pergerakan PMII Sunan Ampel Malang...",
      siteName: "PMII Sunan Ampel Malang",
      images: [{ url: coverImage, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt || "Baca selengkapnya di portal pergerakan PMII Sunan Ampel Malang...",
      images: [{ url: coverImage, alt: article.title }],
    },
  };
}

export default function BeritaDetailLayout({ children }) {
  return <>{children}</>;
}