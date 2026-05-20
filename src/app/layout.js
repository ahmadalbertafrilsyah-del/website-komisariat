import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ================= PENGATURAN SEO GOOGLE =================
// PENTING: Ganti tulisan di bawah ini dengan nama domain asli Anda (contoh: https://pmiisunanampel.com)
const siteUrl = "https://pmii-uinmalang.or.id"; 

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PMII Sunan Ampel Malang",
    template: "%s | PMII Sunan Ampel Malang"
  },
  description: "Website Resmi PK. PMII Sunan Ampel Malang. Wadah pergerakan mahasiswa Islam berlandaskan Ahlussunnah Wal Jama'ah.",
  keywords: ["PMII", "Sunan Ampel", "Malang", "Pergerakan Mahasiswa Islam Indonesia", "UIN Malang", "Kaderisasi", "Mahasiswa"],
  authors: [{ name: "PMII Sunan Ampel Malang" }],
  creator: "PMII Sunan Ampel Malang",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    title: "PMII Sunan Ampel Malang",
    description: "Website Resmi PK. PMII Sunan Ampel Malang.",
    siteName: "PMII Sunan Ampel Malang",
    // Anda bisa mengganti link gambar di bawah dengan logo PMII Sunan Ampel asli di Cloudinary Anda
    images: [
      {
        url: "https://res.cloudinary.com/dxeh0qwc9/image/upload/v1779290231/icon_zcnk4k.png", 
        width: 1200,
        height: 630,
        alt: "Banner PMII Sunan Ampel Malang",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PMII Sunan Ampel Malang",
    description: "Website Resmi PK. PMII Sunan Ampel Malang.",
    images: ["https://res.cloudinary.com/dxeh0qwc9/image/upload/v1779290231/icon_zcnk4k.png"], // Ganti dengan URL gambar Cloudinary Anda
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id" // Diganti ke "id" agar Google tahu ini website berbahasa Indonesia
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}