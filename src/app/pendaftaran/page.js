import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import PendaftaranClient from "./PendaftaranClient";

// ================= FUNGSI METADATA (TERBACA OLEH BOT WHATSAPP/FB) =================
export async function generateMetadata({ searchParams }) {
  const resolvedParams = await searchParams;
  const formId = resolvedParams?.form;

  const defaultLogo =
    "https://res.cloudinary.com/dxeh0qwc9/image/upload/v1779290231/icon_zcnk4k.png";

  if (!formId) {
    return {
      title: "Portal Pendaftaran | PMII Sunan Ampel Malang",
      description:
        "Pilih program kaderisasi atau kepanitiaan yang sedang dibuka saat ini.",
      openGraph: {
        title: "Portal Pendaftaran | PMII Sunan Ampel Malang",
        description:
          "Pilih program kaderisasi atau kepanitiaan yang sedang dibuka saat ini.",
        images: [defaultLogo],
      },
    };
  }

  try {
    let formData = null;

    // 1. Cari berdasarkan ID Firebase
    const docRef = doc(db, "formulir_kaderisasi", formId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      formData = docSnap.data();
    } else {
      // 2. Cari berdasarkan Slug Teks
      const q = query(
        collection(db, "formulir_kaderisasi"),
        where("slug", "==", formId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        formData = querySnapshot.docs[0].data();
      }
    }

    if (formData) {
      const formTitle = `Pendaftaran ${formData.judul} | PMII Sunan Ampel Malang`;

      let cleanDesc =
        formData.deskripsi ||
        "Daftar sekarang melalui portal resmi PMII Sunan Ampel Malang.";
      cleanDesc = cleanDesc.replace(/<[^>]+>/g, "").replace(/[*_]/g, "");
      const formDesc = cleanDesc.substring(0, 150) + "...";

      const formImage = formData.thumbnailUrl || defaultLogo;

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
        },
      };
    }
  } catch (error) {
    console.error("Gagal load metadata pendaftaran:", error);
  }

  return {
    title: "Formulir Tidak Ditemukan | PMII Sunan Ampel Malang",
  };
}

export default function Page() {
  return <PendaftaranClient />;
}
