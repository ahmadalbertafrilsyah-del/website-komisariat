import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import AlumniClient from "./AlumniClient";

// FUNGSI INI BERTUGAS MENYIAPKAN TAMPILAN UNTUK WHATSAPP/SOSMED
export async function generateMetadata({ searchParams }) {
  // Ambil parameter '?nama=' dari URL
  const resolvedParams = await searchParams;
  const namaParam = resolvedParams?.nama;

  const siteUrl = "https://pmii-uinmalang.or.id";
  const defaultImage = "https://res.cloudinary.com/dxeh0qwc9/image/upload/v1779290231/icon_zcnk4k.png";
  const defaultTitle = "Direktori Alumni | PMII Sunan Ampel Malang";
  const defaultDesc = "Jaringan profesional kader dan profil keahlian alumni PMII Sunan Ampel Malang.";

  // Jika URL tidak mengandung '?nama=', berikan tampilan default
  if (!namaParam) {
    return {
      metadataBase: new URL(siteUrl),
      title: defaultTitle,
      description: defaultDesc,
      openGraph: { title: defaultTitle, description: defaultDesc, images: [defaultImage] }
    };
  }

  // Jika ada '?nama=', cari data alumni spesifik tersebut di Firebase
  let alumni = null;
  try {
    const docRef = doc(db, "website_config", "database_alumni");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().listAlumni) {
      const list = docSnap.data().listAlumni;
      alumni = list.find(a => a.nama === namaParam);
    }
  } catch (error) {
    console.error("Gagal menarik metadata alumni:", error);
  }

  if (!alumni) {
    return {
      metadataBase: new URL(siteUrl),
      title: "Alumni Tidak Ditemukan | PMII",
    };
  }

  // SIHIR CLOUDINARY UNTUK FOTO WAJAH
  // Kita paksa foto menjadi kotak (w_800,h_800), fokus ke wajah (g_face), kompresi (q_80) agar tidak pecah/terpotong di WhatsApp
  let coverImage = alumni.foto || defaultImage;
  if (coverImage.includes('cloudinary.com') && coverImage.includes('/upload/')) {
    coverImage = coverImage.replace('/upload/', '/upload/c_fill,w_800,h_800,g_face,q_80,f_jpg/');
  }

  // Susun daftar keahlian untuk ditaruh di deskripsi WhatsApp
  const bidangString = Array.isArray(alumni.bidang) 
    ? alumni.bidang.join(", ") 
    : (alumni.bidang || "Keahlian belum diisi");

  return {
    metadataBase: new URL(siteUrl),
    title: `Profil Alumni: ${alumni.nama} | PMII Sunan Ampel Malang`,
    description: `Bidang Keahlian: ${bidangString}. Klik untuk melihat profil selengkapnya di Direktori Alumni.`,
    openGraph: {
      type: "profile",
      url: `/alumni?nama=${encodeURIComponent(alumni.nama)}`,
      title: `Profil Alumni: ${alumni.nama}`,
      description: `Bidang Keahlian: ${bidangString}`,
      images: [
        {
          url: coverImage,
          width: 800,
          height: 800,
          alt: alumni.nama,
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: `Profil Alumni: ${alumni.nama}`,
      description: `Bidang Keahlian: ${bidangString}`,
      images: [coverImage],
    }
  };
}

// Memanggil kodingan visual Client Component yang tadi kita pisah
export default function AlumniPage() {
  return <AlumniClient />;
}