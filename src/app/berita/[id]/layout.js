import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

// Fungsi untuk mengubah Judul menjadi URL (Slug)
const createSlug = (title) => {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

// FUNGSI INI AKAN DIBACA OLEH BOT WHATSAPP / FACEBOOK / GOOGLE
export async function generateMetadata({ params }) {
  // PERBAIKAN NEXT.JS TERBARU: Wajib di-await agar tidak terjadi Server Error!
  const resolvedParams = await params;
  const rawId = resolvedParams.id;
  const decodedId = decodeURIComponent(rawId);

  let article = null;

  try {
    // Skenario 1: Coba cari berdasarkan Document ID asli (Kode Acak Firebase)
    const docRef = doc(db, "berita", decodedId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      article = docSnap.data();
    } else {
      // Skenario 2: Jika tidak ketemu, berarti URL menggunakan Judul Berita (Slug).
      // Sistem akan mencari judul yang cocok di seluruh database berita.
      const snapshot = await getDocs(collection(db, "berita"));
      const found = snapshot.docs.find(d => createSlug(d.data().title || "") === decodedId);
      if (found) article = found.data();
    }
  } catch (error) {
    console.error("Gagal menarik metadata:", error);
  }

  // Jika berita benar-benar tidak ada
  if (!article) {
    return { title: "Artikel Tidak Ditemukan | PMII UIN Malang" };
  }

  const siteUrl = "https://pmii-uinmalang.or.id"; // Pastikan domain Anda benar

  // Tembakkan Metadata yang Sempurna untuk SEO
  return {
    title: `${article.title} | PMII Sunan Ampel Malang`,
    description: article.excerpt || "Baca selengkapnya di portal pergerakan PMII Sunan Ampel Malang...",
    openGraph: {
      type: "article",
      locale: "id_ID",
      url: `${siteUrl}/berita/${rawId}`,
      title: article.title,
      description: article.excerpt || "Baca selengkapnya di portal pergerakan PMII Sunan Ampel Malang...",
      siteName: "PMII Sunan Ampel Malang",
      images: [
        {
          // Menarik langsung gambar Cloudinary
          url: article.imageUrl || "https://res.cloudinary.com/dxeh0qwc9/image/upload/v1779290231/icon_zcnk4k.png", 
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [article.imageUrl || "https://res.cloudinary.com/dxeh0qwc9/image/upload/v1779290231/icon_zcnk4k.png"],
    },
  };
}

export default function BeritaDetailLayout({ children }) {
  return <>{children}</>;
}