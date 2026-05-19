// src/data/struktur.js
export const BPHData = [
  {
    name: "Ahmad Fauzi",
    position: "Ketua Komisariat",
    role: "User-Check Icon",
    photoPublicId: "pmii/bph_ketua", // ID di Cloudinary
    social: { instagram: "ahmdfz_", linkedin: "ahmad-fauzi-pmii" }
  },
  {
    name: "Siti Rahma",
    position: "Wakil Ketua",
    role: "Search Icon",
    photoPublicId: "pmii/bph_wakil",
    social: { instagram: "sitirhm", linkedin: "siti-rahma-pmii" }
  },
  // ... data BPH lainnya: Sekretaris, Bendahara
];

export const BiroData = [
  {
    name: "Biro Kaderisasi",
    icon: "Users Icon",
    lead: {
      name: "Budi Santoso",
      position: "Ketua Biro",
      photoPublicId: "pmii/biro_kader_lead",
      social: { instagram: "budis", linkedin: "budi-santoso-kader" }
    },
    members: [
      { name: "Andi", photoPublicId: "pmii/biro_kader_mem1", focus: "Kajian Dasar" },
      { name: "Dewi", photoPublicId: "pmii/biro_kader_mem2", focus: "Pelatihan Dasar" },
      // ... anggota biro lainnya
    ]
  },
  // ... data Biro lainnya: Kajian, Infokom, dll.
];