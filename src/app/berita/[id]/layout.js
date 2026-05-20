import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// FUNGSI INI AKAN DIBACA OLEH BOT WHATSAPP / FACEBOOK / GOOGLE
export async function generateMetadata({ params }) {
  const id = params.id;
  
  // 1. Tarik data artikel dari Firebase berdasarkan ID di URL
  const docRef = doc(db, "berita", id);
  const docSnap = await getDoc(docRef);

  // Jika berita tidak ada, tampilkan SEO default
  if (!docSnap.exists()) {
    return {
      title: "Artikel Tidak Ditemukan",
    };
  }

  const article = docSnap.data();
  const siteUrl = "https://pmii-uinmalang.or.id"; // Ganti dengan domain asli Anda

  // 2. Lempar data Judul, Excerpt, dan Gambar Cloudinary ke sistem SEO Next.js
  return {
    title: article.title,
    description: article.excerpt || "Baca selengkapnya di portal PMII Sunan Ampel Malang...",
    openGraph: {
      type: "article",
      locale: "id_ID",
      url: `${siteUrl}/berita/${id}`,
      title: article.title,
      description: article.excerpt || "Baca selengkapnya di portal PMII Sunan Ampel Malang...",
      siteName: "PMII Sunan Ampel Malang",
      images: [
        {
          // Jika artikel punya gambar cover, pakai itu. Jika tidak, pakai logo PMII default
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

// Pembungkus untuk merender halaman page.js di dalamnya
export default function BeritaDetailLayout({ children }) {
  return <>{children}</>;
}