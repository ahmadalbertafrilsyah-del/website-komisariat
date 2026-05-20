export default function robots() {
  const baseUrl = "https://pmii-uinmalang.or.id"; // Ganti dengan domain asli Anda

  return {
    rules: {
      userAgent: '*', // Berlaku untuk semua bot pencari (Google, Bing, Yahoo)
      allow: '/',     // Izinkan melacak halaman utama dan isinya
      disallow: [
        '/admin/',    // DILARANG melacak halaman dashboard admin!
        '/api/',      // DILARANG melacak jembatan API server
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`, // Tunjukkan letak peta situs
  }
}