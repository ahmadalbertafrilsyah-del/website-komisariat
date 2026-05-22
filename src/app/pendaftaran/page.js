import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import PendaftaranClient from "./PendaftaranClient";

// ================= FUNGSI METADATA (TERBACA OLEH BOT WHATSAPP/FB) =================
export async function generateMetadata({ searchParams }) {
  const formId = searchParams?.form;
  
  // Masukkan link logo default dari Cloudinary Anda di bawah ini
  // Ini akan muncul jika Admin tidak mengupload gambar Cover di formulir
  const defaultLogo = "https://res.cloudinary.com/dxeh0qwc9/image/upload/v1779290231/icon_zcnk4k.png"; 

  // Jika pengunjung hanya membuka /pendaftaran tanpa link form spesifik
  if (!formId) {
    return {
      title: "Portal Pendaftaran | PMII Sunan Ampel Malang",
      description: "Pilih program kaderisasi atau kepanitiaan yang sedang dibuka saat ini.",
      openGraph: {
        title: "Portal Pendaftaran | PMII Sunan Ampel Malang",
        description: "Pilih program kaderisasi atau kepanitiaan yang sedang dibuka saat ini.",
        images: [defaultLogo],
      }
    };
  }

  // Jika pengunjung membuka link spesifik (contoh: /pendaftaran?form=ABC)
  try {
    const docRef = doc(db, "formulir_kaderisasi", formId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const formTitle = `Pendaftaran ${data.judul} | PMII Sunan Ampel Malang`;
      
      // Mengambil deskripsi dan membersihkannya dari bintang (*) dan tag HTML agar rapi saat dibaca di chat WA
      let cleanDesc = data.deskripsi || "Daftar sekarang melalui portal resmi PMII Sunan Ampel Malang.";
      cleanDesc = cleanDesc.replace(/<[^>]+>/g, '').replace(/[*_]/g, '');
      const formDesc = cleanDesc.substring(0, 150) + "..."; 
      
      // Gunakan thumbnail form, jika kosong gunakan default logo
      const formImage = data.thumbnailUrl || defaultLogo;

      return {
        title: formTitle,
        description: formDesc,
        openGraph: {
          title: formTitle,
          description: formDesc,
          images: [formImage],
        },
        twitter: {
          card: "summary_large_image",
          title: formTitle,
          description: formDesc,
          images: [formImage],
        }
      };
    }
  } catch (error) {
    console.error("Gagal load metadata pendaftaran:", error);
  }

  // Jika ID form tidak ditemukan di database
  return {
    title: "Formulir Tidak Ditemukan | PMII Sunan Ampel Malang",
  };
}

// ================= RENDER HALAMAN PENGUNJUNG =================
export default function Page() {
  // Langsung memanggil komponen form yang sudah kita buat tadi
  return <PendaftaranClient />;
}