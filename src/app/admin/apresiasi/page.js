"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  Save,
  Plus,
  Trash2,
  Trophy,
  Search,
  Image as ImageIcon,
  Award,
  BookOpen,
  UploadCloud,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Loader2,
  Download,
  Info,
  Camera,
  ArrowLeft,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const RAYON_OPTIONS = [
  "PR. PMII “KAWAH” Chondrodimuko",
  "PR. PMII “Perjuangan” Ibnu Aqil",
  "PR. PMII “Radikal” Al-Faruq",
  "PR. PMII “Penakluk” Al-Adawiyah",
  "PR. PMII “Penyelamat” Dja’far Saifuddin",
  "PR. PMII Ekonomi “Moch. Hatta”",
  "PR. PMII Pencerahan Galileo",
];

async function uploadMediaFile(file) {
  // Coba upload lewat API internal terlebih dahulu, fallback ke unsigned preset Cloudinary
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const data = await res.json();
      if (data.url) return data.url;
    }
  } catch {
    // Lanjut ke fallback Cloudinary
  }

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Konfigurasi Cloudinary belum diatur.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );
  const data = await res.json();
  if (!data.secure_url) throw new Error("Upload gagal");
  return data.secure_url;
}

export default function AdminApresiasi() {
  const [loading, setLoading] = useState(true);
  const [kaderData, setKaderData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // State Input Kader Baru
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newNama, setNewNama] = useState("");
  const [newRayon, setNewRayon] = useState("");
  const [newFoto, setNewFoto] = useState("");

  // State Interaksi
  const [activeEditKaderId, setActiveEditKaderId] = useState(null);
  const [expandedPrestasiId, setExpandedPrestasiId] = useState(null);
  const [uploadingTarget, setUploadingTarget] = useState(null); // "new-profile" | "edit-profile" | prestasiId
  const [isSaving, setIsSaving] = useState(false);
  const excelInputRef = useRef(null);

  const inputStandardClass =
    "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition text-xs sm:text-sm bg-white text-slate-900";
  const labelStandardClass =
    "text-xs font-bold text-slate-700 block mb-1.5";

  useEffect(() => {
    async function loadData() {
      try {
        const docRef = doc(db, "website_config", "database_apresiasi");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listApresiasi) {
          const seen = new Set();
          const list = docSnap.data().listApresiasi.map((item, idx) => {
            const rawId = item.id ? String(item.id) : `apr-${idx}`;
            const uniqueId = seen.has(rawId) ? `${rawId}-${idx}` : rawId;
            seen.add(uniqueId);
            return {
              ...item,
              id: uniqueId,
              namaLengkap: item.namaLengkap || item.namaKader || item.nama || "",
              asalRayon: item.asalRayon || item.rayon || "",
              fotoKader: item.fotoKader || item.foto || "",
              prestasi: Array.isArray(item.prestasi) ? item.prestasi : [],
            };
          });
          setKaderData(list);
        }
      } catch (error) {
        console.error("Gagal load apresiasi:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeEditKader =
    kaderData.find((k) => k.id === activeEditKaderId) || null;

  // Upload foto profil kader baru, foto profil kader lama, atau bukti prestasi
  const handleUploadFile = async (file, mode, targetPrestasiId = null) => {
    if (!file) return;
    setUploadingTarget(targetPrestasiId || mode);
    try {
      const imageUrl = await uploadMediaFile(file);
      if (mode === "new-profile") {
        setNewFoto(imageUrl);
      } else if (mode === "edit-profile" && activeEditKaderId) {
        handleUpdateKaderProfile(activeEditKaderId, "fotoKader", imageUrl);
      } else if (mode === "prestasi" && activeEditKaderId && targetPrestasiId) {
        handleUpdatePrestasi(
          activeEditKaderId,
          targetPrestasiId,
          "linkOrFoto",
          imageUrl
        );
      }
    } catch (err) {
      alert("Gagal mengunggah gambar: " + err.message);
    } finally {
      setUploadingTarget(null);
    }
  };

  // Update field profil kader (namaLengkap, asalRayon, fotoKader)
  const handleUpdateKaderProfile = (kaderId, field, value) => {
    setKaderData((prev) =>
      prev.map((k) => (k.id === kaderId ? { ...k, [field]: value } : k))
    );
  };

  const handleDownloadTemplate = () => {
    const dataAkademik = [
      {
        "Nama Kader": "Ahmad Albert Afrilsyah",
        "Asal Rayon": "PR. PMII “KAWAH” Chondrodimuko",
        "Foto Profil (Upload/Link)": "",
        "Judul Jurnal / Karya / Materi Kaderisasi":
          "Penerapan AI dalam Konsep Andragogi",
        "Pencapaian / Nilai IPK": "Sinta 2",
        "Tingkat / Jenjang Kaderisasi": "Nasional",
        "Tahun Terbit / Angkatan": "2026",
        "Link DOI / Website / Raport Kaderisasi (G-Drive)":
          "https://doi.org/10...",
      },
    ];
    const dataNonAkademik = [
      {
        "Nama Kader": "Sahabat PMII",
        "Asal Rayon": "PR. PMII “Perjuangan” Ibnu Aqil",
        "Foto Profil (Upload/Link)": "",
        "Nama Kompetisi / Lomba": "Lomba Gagasan Sinergis Adaptif",
        Pencapaian: "Juara 1",
        Tingkat: "Regional Jawa Timur",
        Tahun: "2025",
        "Bukti Link Sertifikat (G-Drive) / Upload Dokumentasi":
          "https://drive.google.com/...",
      },
    ];

    const wsAkademik = XLSX.utils.json_to_sheet(dataAkademik);
    const wsNonAkademik = XLSX.utils.json_to_sheet(dataNonAkademik);
    wsAkademik["!cols"] = [
      { wch: 25 },
      { wch: 35 },
      { wch: 25 },
      { wch: 45 },
      { wch: 25 },
      { wch: 30 },
      { wch: 25 },
      { wch: 60 },
    ];
    wsNonAkademik["!cols"] = [
      { wch: 25 },
      { wch: 35 },
      { wch: 25 },
      { wch: 40 },
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 60 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsAkademik, "Akademik");
    XLSX.utils.book_append_sheet(wb, wsNonAkademik, "Non-Akademik");
    XLSX.writeFile(wb, "Template_Apresiasi_Kader.xlsx");
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        let updatedKader = [...kaderData];
        let importedRowsCount = 0;

        wb.SheetNames.forEach((sheetName) => {
          const ws = wb.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(ws);
          const isNonAkadSheet = sheetName.toLowerCase().includes("non");
          const defaultTipe = isNonAkadSheet ? "non-akademik" : "akademik";

          data.forEach((row) => {
            const nama = row["Nama Kader"];
            if (!nama) return;
            importedRowsCount++;

            let kaderIndex = updatedKader.findIndex(
              (k) =>
                (k.namaLengkap || "").toLowerCase() ===
                String(nama).toLowerCase()
            );
            if (kaderIndex === -1) {
              updatedKader.push({
                id:
                  Date.now().toString() +
                  Math.random().toString(36).substring(2, 7),
                namaLengkap: nama,
                asalRayon: row["Asal Rayon"] || "",
                fotoKader: row["Foto Profil (Upload/Link)"] || "",
                prestasi: [],
              });
              kaderIndex = updatedKader.length - 1;
            } else if (row["Foto Profil (Upload/Link)"]) {
              updatedKader[kaderIndex].fotoKader =
                row["Foto Profil (Upload/Link)"];
            }

            const judul =
              row["Judul Jurnal / Karya / Materi Kaderisasi"] ||
              row["Nama Kompetisi / Lomba"] ||
              "";
            if (judul) {
              updatedKader[kaderIndex].prestasi.push({
                id: Date.now() + Math.random(),
                tipe: defaultTipe,
                judul,
                pencapaian:
                  row["Pencapaian / Nilai IPK"] || row["Pencapaian"] || "",
                tingkat:
                  row["Tingkat / Jenjang Kaderisasi"] || row["Tingkat"] || "",
                tahun: row["Tahun Terbit / Angkatan"] || row["Tahun"] || "",
                linkOrFoto:
                  row["Link DOI / Website / Raport Kaderisasi (G-Drive)"] ||
                  row["Bukti Link Sertifikat (G-Drive) / Upload Dokumentasi"] ||
                  "",
              });
            }
          });
        });
        setKaderData(updatedKader);
        alert(
          `Berhasil mengimpor ${importedRowsCount} baris riwayat prestasi dari Excel! Klik 'Simpan Perubahan Direktori'.`
        );
      } catch {
        alert(
          "Gagal membaca file Excel. Pastikan format tabel sudah sesuai dengan Template Excel."
        );
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  const handleAddKader = (e) => {
    e.preventDefault();
    if (!newNama.trim() || !newRayon)
      return alert("Nama dan Asal Rayon wajib diisi!");
    const newId = Date.now().toString();
    const newObj = {
      id: newId,
      namaLengkap: newNama.trim(),
      asalRayon: newRayon,
      fotoKader: newFoto.trim(),
      prestasi: [],
    };
    setKaderData([newObj, ...kaderData]);
    setActiveEditKaderId(newId);
    setNewNama("");
    setNewRayon("");
    setNewFoto("");
    setIsFormOpen(false);
  };

  const handleDeleteKader = (id) => {
    if (
      !confirm(
        "Hapus kader berprestasi ini beserta seluruh riwayat prestasinya?"
      )
    )
      return;
    setKaderData(kaderData.filter((item) => item.id !== id));
    if (activeEditKaderId === id) setActiveEditKaderId(null);
  };

  const handleAddPrestasi = (kaderId, tipe) => {
    const newPrestasiId = Date.now();
    setKaderData((prev) =>
      prev.map((k) =>
        k.id === kaderId
          ? {
              ...k,
              prestasi: [
                {
                  id: newPrestasiId,
                  tipe,
                  judul: "",
                  pencapaian: "",
                  tingkat: "",
                  tahun: "",
                  linkOrFoto: "",
                },
                ...(k.prestasi || []),
              ],
            }
          : k
      )
    );
    setExpandedPrestasiId(newPrestasiId);
  };

  const handleUpdatePrestasi = (kaderId, presId, field, value) => {
    setKaderData((prev) =>
      prev.map((k) =>
        k.id === kaderId
          ? {
              ...k,
              prestasi: k.prestasi.map((p) =>
                p.id === presId ? { ...p, [field]: value } : p
              ),
            }
          : k
      )
    );
  };

  const handleDeletePrestasi = (kaderId, presId) => {
    if (!confirm("Hapus prestasi ini?")) return;
    setKaderData((prev) =>
      prev.map((k) =>
        k.id === kaderId
          ? {
              ...k,
              prestasi: k.prestasi.filter((p) => p.id !== presId),
            }
          : k
      )
    );
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "website_config", "database_apresiasi"), {
        listApresiasi: kaderData,
      });
      alert("Database Apresiasi Kader berhasil diperbarui di server!");
    } catch (error) {
      alert("Gagal menyimpan: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredData = kaderData.filter((k) => {
    const searchLower = searchQuery.toLowerCase();
    const prestasiTitles = (k.prestasi || []).map((p) => p.judul).join(" ");
    return (
      (k.namaLengkap || "").toLowerCase().includes(searchLower) ||
      (k.asalRayon || "").toLowerCase().includes(searchLower) ||
      prestasiTitles.toLowerCase().includes(searchLower)
    );
  });

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={32} className="text-blue-600 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-5 pb-12 w-full text-sm">
      {/* STICKY HEADER PANEL & TOMBOL SIMPAN DI ATAS */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600 block mb-0.5">
            Hall of Fame // {kaderData.length} Kader Tercatat
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Manajemen Apresiasi & Prestasi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola foto profil, identitas rayon, serta daftar karya & kejuaraan
            kader.
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full lg:w-auto shrink-0">
          <button
            onClick={handleDownloadTemplate}
            type="button"
            className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Download size={14} /> Template Excel
          </button>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            ref={excelInputRef}
            onChange={handleImportExcel}
          />
          <button
            onClick={() => excelInputRef.current.click()}
            type="button"
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <FileSpreadsheet size={14} /> Impor Excel
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white font-bold py-2.5 px-5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap shrink-0 text-xs sm:text-sm"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>

      {/* FORM TAMBAH KADER BARU */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="w-full px-5 py-4 flex items-center justify-between font-bold text-slate-800 hover:bg-slate-50 transition"
        >
          <span className="flex items-center gap-2 text-xs sm:text-sm">
            <Plus size={17} className="text-blue-600" /> Tambah Kader
            Berprestasi Baru
          </span>
          {isFormOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {isFormOpen && (
          <div className="p-5 border-t border-slate-200 bg-slate-50/40">
            <form
              onSubmit={handleAddKader}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
            >
              <div className="md:col-span-4">
                <label className={labelStandardClass}>Nama Lengkap Kader</label>
                <input
                  type="text"
                  required
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  className={inputStandardClass}
                  placeholder="Contoh: Sahabat Ahmad..."
                />
              </div>

              <div className="md:col-span-4">
                <label className={labelStandardClass}>Asal Rayon</label>
                <select
                  required
                  value={newRayon}
                  onChange={(e) => setNewRayon(e.target.value)}
                  className={inputStandardClass}
                >
                  <option value="" disabled>
                    Pilih Asal Rayon
                  </option>
                  {RAYON_OPTIONS.map((rayon) => (
                    <option key={rayon} value={rayon}>
                      {rayon}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4">
                <label className={labelStandardClass}>
                  Foto Profil (Upload / Link)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFoto}
                    onChange={(e) => setNewFoto(e.target.value)}
                    className={`${inputStandardClass} flex-1 font-mono text-xs`}
                    placeholder="https://..."
                  />
                  <label className="bg-blue-600 hover:bg-blue-500 text-white cursor-pointer px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition shadow-sm shrink-0">
                    {uploadingTarget === "new-profile" ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <UploadCloud size={15} />
                    )}
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleUploadFile(e.target.files[0], "new-profile")
                      }
                      disabled={Boolean(uploadingTarget)}
                    />
                  </label>
                </div>
              </div>

              <div className="md:col-span-12 pt-1">
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-slate-900 hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Daftarkan Kader ke Hall of Fame
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* MASTER - DETAIL WORKSPACE (Responsif penuh di HP & Laptop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* KOLOM KIRI: DAFTAR KADER (Sembunyikan di HP jika sedang mengedit 1 kader agar seperti aplikasi mobile) */}
        <div
          className={`lg:col-span-5 flex flex-col gap-3 ${
            activeEditKader ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama kader, rayon, atau judul prestasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={inputStandardClass + " pl-10 py-2.5 rounded-xl"}
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden flex flex-col max-h-[640px]">
            <div className="px-4 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                <Trophy size={15} className="text-amber-500" /> Pilih Kader
                untuk Diedit
              </h3>
              <span className="text-[11px] font-mono font-bold text-slate-400">
                {filteredData.length} Kader
              </span>
            </div>
            <div className="overflow-y-auto p-3 space-y-2.5">
              {filteredData.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium">
                  Data apresiasi tidak ditemukan.
                </div>
              ) : (
                filteredData.map((k) => {
                  const isSelected = activeEditKaderId === k.id;
                  return (
                    <div
                      key={k.id}
                      onClick={() => setActiveEditKaderId(k.id)}
                      className={`border p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/70 shadow-sm"
                          : "border-slate-200/80 bg-white hover:border-blue-300"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 text-amber-400 border border-slate-200 shrink-0 flex items-center justify-center font-black text-xs">
                        {k.fotoKader ? (
                          <img
                            src={k.fotoKader}
                            alt={k.namaLengkap}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>
                            {(k.namaLengkap || "K").substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                          {k.namaLengkap}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {k.asalRayon}
                        </p>
                      </div>
                      <div className="shrink-0 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-mono font-bold text-slate-700 flex items-center gap-1">
                        {k.prestasi?.length || 0}{" "}
                        <Trophy size={11} className="text-amber-500" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: DETAIL & EDIT FOTO + PRESTASI KADER */}
        <div
          className={`lg:col-span-7 ${
            activeEditKader ? "block" : "hidden lg:block"
          }`}
        >
          {activeEditKader ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden flex flex-col">
              {/* Mobile Back Button Bar */}
              <div className="lg:hidden px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveEditKaderId(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400"
                >
                  <ArrowLeft size={15} /> Kembali ke Daftar Kader
                </button>
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  Editor Profil & Prestasi
                </span>
              </div>

              {/* BAGIAN 1: EDIT FOTO PROFIL & IDENTITAS KADER */}
              <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600">
                    Identitas & Foto Profil Kader
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteKader(activeEditKader.id)}
                    className="text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition border border-transparent hover:border-rose-200 flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Trash2 size={14} /> Hapus Kader
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {/* Interactive Photo Editor Box */}
                  <div className="flex flex-col items-center gap-2 shrink-0 mx-auto sm:mx-0">
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-200 shadow-md flex items-center justify-center group">
                      {activeEditKader.fotoKader ? (
                        <img
                          src={activeEditKader.fotoKader}
                          alt={activeEditKader.namaLengkap}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon size={28} className="text-slate-500" />
                      )}

                      <label
                        className="absolute inset-0 bg-slate-950/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer text-[10px] font-bold gap-1"
                        title="Klik untuk unggah foto baru"
                      >
                        {uploadingTarget === "edit-profile" ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <>
                            <Camera size={18} className="text-amber-400" />
                            <span>Ganti Foto</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleUploadFile(e.target.files[0], "edit-profile")
                          }
                          disabled={Boolean(uploadingTarget)}
                        />
                      </label>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition">
                        {uploadingTarget === "edit-profile" ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Camera size={12} />
                        )}
                        <span>Upload Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleUploadFile(e.target.files[0], "edit-profile")
                          }
                          disabled={Boolean(uploadingTarget)}
                        />
                      </label>
                      {activeEditKader.fotoKader && (
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateKaderProfile(
                              activeEditKader.id,
                              "fotoKader",
                              ""
                            )
                          }
                          className="p-1 rounded-lg bg-slate-200 hover:bg-rose-100 text-slate-600 hover:text-rose-600 transition"
                          title="Hapus Foto"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Editable Name, Rayon, & Photo URL */}
                  <div className="flex-1 w-full space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelStandardClass}>
                          Nama Lengkap Kader
                        </label>
                        <input
                          type="text"
                          value={activeEditKader.namaLengkap || ""}
                          onChange={(e) =>
                            handleUpdateKaderProfile(
                              activeEditKader.id,
                              "namaLengkap",
                              e.target.value
                            )
                          }
                          className={inputStandardClass}
                          placeholder="Nama Lengkap"
                        />
                      </div>
                      <div>
                        <label className={labelStandardClass}>Asal Rayon</label>
                        <select
                          value={activeEditKader.asalRayon || ""}
                          onChange={(e) =>
                            handleUpdateKaderProfile(
                              activeEditKader.id,
                              "asalRayon",
                              e.target.value
                            )
                          }
                          className={inputStandardClass}
                        >
                          <option value="">Pilih Rayon</option>
                          {RAYON_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={labelStandardClass}>
                        URL Foto Profil (Bisa ditempel link langsung atau klik
                        Upload Foto)
                      </label>
                      <input
                        type="text"
                        value={activeEditKader.fotoKader || ""}
                        onChange={(e) =>
                          handleUpdateKaderProfile(
                            activeEditKader.id,
                            "fotoKader",
                            e.target.value
                          )
                        }
                        className={`${inputStandardClass} font-mono text-xs`}
                        placeholder="https://res.cloudinary.com/..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* BAGIAN 2: TOMBOL TAMBAH PRESTASI */}
              <div className="p-4 sm:px-6 bg-white border-b border-slate-100 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    handleAddPrestasi(activeEditKader.id, "akademik")
                  }
                  className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold py-2.5 px-3 rounded-xl text-xs flex justify-center items-center gap-1.5 transition"
                >
                  <Plus size={14} /> Tambah Karya / Akademik
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAddPrestasi(activeEditKader.id, "non-akademik")
                  }
                  className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold py-2.5 px-3 rounded-xl text-xs flex justify-center items-center gap-1.5 transition"
                >
                  <Plus size={14} /> Tambah Kejuaraan / Non-Akad
                </button>
              </div>

              {/* BAGIAN 3: DAFTAR RIWAYAT PRESTASI */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-3 max-h-[520px]">
                {!activeEditKader.prestasi ||
                activeEditKader.prestasi.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    Belum ada riwayat prestasi ditambahkan untuk kader ini.
                  </div>
                ) : (
                  activeEditKader.prestasi.map((p) => (
                    <div
                      key={p.id}
                      className="border border-slate-200 rounded-xl overflow-hidden"
                    >
                      <div
                        onClick={() =>
                          setExpandedPrestasiId(
                            expandedPrestasiId === p.id ? null : p.id
                          )
                        }
                        className={`px-4 py-3 flex justify-between items-center cursor-pointer transition-colors ${
                          expandedPrestasiId === p.id
                            ? "bg-blue-50/80 border-b border-blue-100"
                            : "bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden pr-3">
                          {(p.tipe || "").toLowerCase().includes("akad") &&
                          !(p.tipe || "").toLowerCase().includes("non") ? (
                            <BookOpen
                              size={16}
                              className="text-emerald-600 shrink-0"
                            />
                          ) : (
                            <Award
                              size={16}
                              className="text-amber-600 shrink-0"
                            />
                          )}
                          <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                            {p.judul || "Prestasi Baru (Klik untuk isi judul)"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePrestasi(activeEditKader.id, p.id);
                            }}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 size={15} />
                          </button>
                          {expandedPrestasiId === p.id ? (
                            <ChevronUp size={16} className="text-slate-500" />
                          ) : (
                            <ChevronDown size={16} className="text-slate-500" />
                          )}
                        </div>
                      </div>

                      {expandedPrestasiId === p.id && (
                        <div className="p-4 space-y-3.5 bg-white">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="sm:col-span-2">
                              <label className={labelStandardClass}>
                                Judul Jurnal / Nama Kompetisi
                              </label>
                              <input
                                type="text"
                                value={p.judul || ""}
                                onChange={(e) =>
                                  handleUpdatePrestasi(
                                    activeEditKader.id,
                                    p.id,
                                    "judul",
                                    e.target.value
                                  )
                                }
                                className={inputStandardClass}
                                placeholder="Contoh: Juara 1 Lomba Esai Nasional..."
                              />
                            </div>
                            <div>
                              <label className={labelStandardClass}>
                                Pencapaian / Predikat
                              </label>
                              <input
                                type="text"
                                value={p.pencapaian || ""}
                                onChange={(e) =>
                                  handleUpdatePrestasi(
                                    activeEditKader.id,
                                    p.id,
                                    "pencapaian",
                                    e.target.value
                                  )
                                }
                                className={inputStandardClass}
                                placeholder="Juara 1 / Sinta 2 / Terbaik"
                              />
                            </div>
                            <div>
                              <label className={labelStandardClass}>
                                Tingkat / Skala
                              </label>
                              <input
                                type="text"
                                value={p.tingkat || ""}
                                onChange={(e) =>
                                  handleUpdatePrestasi(
                                    activeEditKader.id,
                                    p.id,
                                    "tingkat",
                                    e.target.value
                                  )
                                }
                                className={inputStandardClass}
                                placeholder="Nasional / Regional / Kampus"
                              />
                            </div>
                            <div>
                              <label className={labelStandardClass}>
                                Tahun Capaian
                              </label>
                              <input
                                type="text"
                                value={p.tahun || ""}
                                onChange={(e) =>
                                  handleUpdatePrestasi(
                                    activeEditKader.id,
                                    p.id,
                                    "tahun",
                                    e.target.value
                                  )
                                }
                                className={inputStandardClass}
                                placeholder="2025"
                              />
                            </div>
                            <div>
                              <label className={labelStandardClass}>
                                Kategori Capaian
                              </label>
                              <select
                                value={p.tipe || "akademik"}
                                onChange={(e) =>
                                  handleUpdatePrestasi(
                                    activeEditKader.id,
                                    p.id,
                                    "tipe",
                                    e.target.value
                                  )
                                }
                                className={inputStandardClass}
                              >
                                <option value="akademik">
                                  Akademik / Kaderisasi
                                </option>
                                <option value="non-akademik">
                                  Lomba / Non-Akademik
                                </option>
                              </select>
                            </div>
                            <div className="sm:col-span-2">
                              <label className={labelStandardClass}>
                                Bukti Link (Jurnal / G-Drive) ATAU Upload Foto
                                Sertifikat
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={p.linkOrFoto || ""}
                                  onChange={(e) =>
                                    handleUpdatePrestasi(
                                      activeEditKader.id,
                                      p.id,
                                      "linkOrFoto",
                                      e.target.value
                                    )
                                  }
                                  className={`${inputStandardClass} flex-1 font-mono text-xs`}
                                  placeholder="https://..."
                                />
                                <label className="bg-slate-900 hover:bg-blue-600 text-white cursor-pointer px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition shadow-sm shrink-0">
                                  {uploadingTarget === p.id ? (
                                    <Loader2
                                      size={14}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <UploadCloud size={14} />
                                  )}
                                  <span>Upload</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) =>
                                      handleUploadFile(
                                        e.target.files[0],
                                        "prestasi",
                                        p.id
                                      )
                                    }
                                    disabled={Boolean(uploadingTarget)}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 h-full flex flex-col items-center justify-center p-10 text-center min-h-[380px]">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <Award size={30} className="text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">
                Pilih Kader untuk Mengedit Foto & Prestasi
              </h3>
              <p className="text-slate-500 mt-1.5 text-xs max-w-sm leading-relaxed">
                Klik salah satu nama kader di daftar sebelah kiri untuk mengubah
                foto profil, nama, rayon, maupun riwayat prestasi mereka.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
