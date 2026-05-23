// Tambahkan baris ini untuk memaksa Next.js selalu membaca parameter URL secara dinamis (menghindari cache Vercel)
export const dynamic = "force-dynamic";

import ApresiasiClient from "./ApresiasiClient";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Fungsi untuk membuat Meta Tags (Preview WhatsApp/Sosmed)
export async function generateMetadata({ searchParams }) {
  const kaderName = searchParams?.kader;

  // Data Default (Jika yang di-share adalah link halaman utama apresiasi)
  let title = "Apresiasi & Rekam Jejak Kader - PMII Sunan Ampel Malang";
  let description = "Galeri pencapaian prestasi akademik, lomba, dan rekam jejak kaderisasi sahabat/i PMII Komisariat.";
  let imageUrl = "https://i.ibb.co.com/nNhTXzYD/Asset-6-4x.png";

  // Jika ada nama kader di URL (hasil share link spesifik)
  if (kaderName) {
    try {
      const docRef = doc(db, "website_config", "database_apresiasi");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().listApresiasi) {
        const kader = docSnap.data().listApresiasi.find(k => k.namaLengkap === kaderName);
        
        if (kader) {
          title = `Rekam Jejak ${kader.namaLengkap} - PMII Sunan Ampel Malang`;
          description = `Lihat profil pencapaian akademik, perlombaan, dan status kaderisasi dari sahabat/i ${kader.namaLengkap} di Hall of Fame PMII.`;
          
          if (kader.fotoKader) {
            // WhatsApp hanya memunculkan preview jika URL berawalan http/https
            imageUrl = kader.fotoKader.startsWith("http") ? kader.fotoKader : imageUrl;
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
  // Memanggil kodingan tampilan aslimu
  return <ApresiasiClient />;
}