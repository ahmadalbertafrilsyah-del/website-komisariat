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

  // Gunakan sampul unggahan untuk pratinjau tautan.
  const fallbackImage =
    "https://res.cloudinary.com/dxeh0qwc9/image/upload/v1779290231/icon_zcnk4k.png";

  const uploadedCover =
    typeof article.imageUrl === "string" ? article.imageUrl.trim() : "";

  let coverImage = fallbackImage;
  let optimizedCover = false;
  try {
    const imageUrl = new URL(uploadedCover || fallbackImage, siteUrl);
    if (imageUrl.protocol === "https:" || imageUrl.protocol === "http:") {
      // Buat versi JPEG yang ringan untuk pratinjau sosial.
      // Padding menjaga seluruh desain sampul tetap terlihat.
      if (
        imageUrl.hostname === "res.cloudinary.com" &&
        imageUrl.pathname.includes("/image/upload/") &&
        !imageUrl.pathname.includes("/s--")
      ) {
        imageUrl.pathname = imageUrl.pathname.replace(
          "/image/upload/",
          "/image/upload/c_pad,w_1200,h_630,b_white,q_80,f_jpg/"
        );
        optimizedCover = true;
      }
      coverImage = imageUrl.href;
    }
  } catch {
    // URL tidak valid: gunakan gambar cadangan agar metadata tetap tersedia.
  }

  const canonicalSlug = createSlug(article.title || "") || decodedId;
  const canonicalUrl = `${siteUrl}/berita/${encodeURIComponent(canonicalSlug)}`;

  return {
    metadataBase: new URL(siteUrl),
    alternates: { canonical: canonicalUrl },
    title: `${article.title} | PMII Sunan Ampel Malang`,
    description: article.excerpt || "Baca selengkapnya di portal pergerakan PMII Sunan Ampel Malang...",
    openGraph: {
      type: "article",
      locale: "id_ID",
      url: canonicalUrl,
      title: article.title,
      description: article.excerpt || "Baca selengkapnya di portal pergerakan PMII Sunan Ampel Malang...",
      siteName: "PMII Sunan Ampel Malang",
      // Gunakan gambar sampul yang sama dengan halaman artikel
      images: [{
        url: coverImage,
        alt: article.title,
        ...(optimizedCover ? { width: 1200, height: 630, type: "image/jpeg" } : {})
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt || "Baca selengkapnya di portal pergerakan PMII Sunan Ampel Malang...",
      images: [{
        url: coverImage,
        alt: article.title
      }],
    },
  };
}

export default function BeritaDetailLayout({ children }) {
  return <>{children}</>;
}