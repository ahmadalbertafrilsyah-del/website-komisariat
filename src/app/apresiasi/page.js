// Memaksa Next.js selalu membaca parameter URL secara dinamis (menghindari cache Vercel)
export const dynamic = "force-dynamic";

import ApresiasiClient from "./ApresiasiClient";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Fungsi untuk membuat Meta Tags (Preview WhatsApp/Sosmed)
export async function generateMetadata({ searchParams }) {
  // PERBAIKAN NEXT.JS TERBARU: Wajib di-await!
  const resolvedParams = await searchParams;
  const kaderName = resolvedParams?.kader;

  // Data Default
  let title = "Apresiasi & Rekam Jejak Kader - PMII Sunan Ampel Malang";
  let description = "Galeri pencapaian prestasi akademik, lomba, dan rekam jejak kaderisasi sahabat/i PMII Komisariat.";
  let imageUrl = "https://i.ibb.co.com/nNhTXzYD/Asset-6-4x.png";

  if (kaderName) {
    try {
      const docRef = doc(db, "website_config", "database_apresiasi");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().listApresiasi) {
        const kader = docSnap.data().listApresiasi.find(k => (k.namaLengkap || k.namaKader || k.nama) === kaderName);
        
        if (kader) {
          title = `Rekam Jejak ${kaderName} - PMII Sunan Ampel Malang`;
          description = `Lihat profil pencapaian akademik, perlombaan, dan status kaderisasi dari sahabat/i ${kaderName} di Hall of Fame PMII.`;
          
          const foto = kader.fotoKader || kader.foto || "";
          if (foto.startsWith("http")) {
            // Jika foto dari cloudinary, kita resize otomatis agar tidak error di WhatsApp
            imageUrl = foto.includes('cloudinary.com') 
              ? foto.replace('/upload/', '/upload/c_fill,w_800,h_800,g_face,q_80,f_jpg/') 
              : foto;
          }
        }
      }
    } catch (error) {
      console.error("Gagal memuat metadata:", error);
    }
  }

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [imageUrl],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [imageUrl],
    }
  };
}

export default function Page() {
  return <ApresiasiClient />;
}``