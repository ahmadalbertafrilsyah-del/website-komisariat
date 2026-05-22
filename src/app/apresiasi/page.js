import ApresiasiClient from "./ApresiasiClient";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Fungsi untuk membuat Meta Tags (Preview WhatsApp/Sosmed)
export async function generateMetadata({ searchParams }) {
  const kaderName = searchParams?.kader;

  // Data Default (Jika yang di-share adalah link halaman utama apresiasi)
  let title = "Apresiasi Kader - PMII Sunan Ampel Malang";
  let description = "Galeri pencapaian prestasi akademik dan non-akademik sahabat/i PMII Komisariat.";
  let imageUrl = "https://i.ibb.co.com/nNhTXzYD/Asset-6-4x.png";

  // Jika ada nama kader di URL (hasil share link spesifik)
  if (kaderName) {
    try {
      const docRef = doc(db, "website_config", "database_apresiasi");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().listApresiasi) {
        const kader = docSnap.data().listApresiasi.find(k => k.namaLengkap === kaderName);
        
        if (kader) {
          title = `Prestasi ${kader.namaLengkap} - PMII Sunan Ampel Malang`;
          description = `Lihat daftar prestasi akademik dan non-akademik dari sahabat/i ${kader.namaLengkap} di Hall of Fame PMII.`;
          
          if (kader.fotoKader) {
            imageUrl = kader.fotoKader; // Pasang foto kader ke link preview
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