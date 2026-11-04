"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  Save,
  Plus,
  Trash2,
  BookOpen,
  Search,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  Loader2,
  Info,
  FileText,
  Image as ImageIcon,
  ArrowLeft,
  ExternalLink,
  BookMarked,
  Layers,
} from "lucide-react";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const KATEGORI_BUKU = [
  "Materi MAPABA",
  "Materi PKD",
  "Materi SIG & Korpri",
  "Aswaja & Ke-PMII-an",
  "Filsafat & Epistemologi",
  "Gerakan & Sosial-Politik",
  "Kajian & Riset Kader",
  "Sastra & Budaya",
];

async function uploadFileToCloud(file) {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const data = await res.json();
      if (data.url) return data.url;
    }
  } catch {
    // Fallback ke Cloudinary langsung
  }

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Konfigurasi Cloudinary belum diatur di .env.local");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
    {
      method: "POST",
      body: formData,
    }
  );
  const data = await res.json();
  if (!data.secure_url) throw new Error("Gagal mengunggah berkas ke cloud");
  return data.secure_url;
}

export default function AdminBukuPage() {
  const [loading, setLoading] = useState(true);
  const [bukuList, setBukuList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  // State tambah buku baru
  const [newJudul, setNewJudul] = useState("");
  const [newPenulis, setNewPenulis] = useState("");
  const [newKategori, setNewKategori] = useState(KATEGORI_BUKU[0]);
  const [newTahun, setNewTahun] = useState("2026");
  const [newHalaman, setNewHalaman] = useState("");
  const [newDeskripsi, setNewDeskripsi] = useState("");
  const [newCoverUrl, setNewCoverUrl] = useState("");
  const [newFileUrl, setNewFileUrl] = useState("");

  // State edit buku terpilih
  const [activeBookId, setActiveBookId] = useState(null);
  const [uploadingTarget, setUploadingTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const inputClass =
    "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition text-xs sm:text-sm bg-white text-slate-900";
  const labelClass = "text-xs font-bold text-slate-700 block mb-1.5";

  useEffect(() => {
    async function loadBuku() {
      try {
        const docRef = doc(db, "website_config", "database_buku");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && Array.isArray(docSnap.data().listBuku)) {
          const seen = new Set();
          const list = docSnap.data().listBuku.map((item, idx) => {
            const rawId = item.id ? String(item.id) : `buku-${idx}`;
            const uniqueId = seen.has(rawId) ? `${rawId}-${idx}` : rawId;
            seen.add(uniqueId);
            return {
              ...item,
              id: uniqueId,
              babList: Array.isArray(item.babList) ? item.babList : [],
            };
          });
          setBukuList(list);
        }
      } catch (err) {
        console.error("Gagal memuat database buku:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBuku();
  }, []);

  const activeBook = bukuList.find((b) => b.id === activeBookId) || null;

  const handleUpload = async (file, targetType) => {
    if (!file) return;
    setUploadingTarget(targetType);
    try {
      const url = await uploadFileToCloud(file);
      if (targetType === "new-cover") setNewCoverUrl(url);
      else if (targetType === "new-file") setNewFileUrl(url);
      else if (targetType === "edit-cover" && activeBookId) {
        handleUpdateBook(activeBookId, "coverUrl", url);
      } else if (targetType === "edit-file" && activeBookId) {
        handleUpdateBook(activeBookId, "fileUrl", url);
      }
    } catch (err) {
      alert("Gagal mengunggah berkas: " + err.message);
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleAddBuku = (e) => {
    e.preventDefault();
    if (!newJudul.trim()) return alert("Judul bacaan wajib diisi!");
    const newId = `bk-${Date.now()}`;
    const entry = {
      id: newId,
      judul: newJudul.trim(),
      penulis: newPenulis.trim() || "Tim Kaderisasi PMII",
      kategori: newKategori,
      tahun: newTahun.trim() || "2026",
      tebalHalaman: newHalaman.trim() || "",
      deskripsi: newDeskripsi.trim(),
      coverUrl: newCoverUrl.trim(),
      fileUrl: newFileUrl.trim(),
      babList: [],
      createdAt: new Date().toISOString(),
    };
    setBukuList([entry, ...bukuList]);
    setActiveBookId(newId);
    setNewJudul("");
    setNewPenulis("");
    setNewHalaman("");
    setNewDeskripsi("");
    setNewCoverUrl("");
    setNewFileUrl("");
    setIsFormOpen(false);
  };

  const handleUpdateBook = (bookId, field, value) => {
    setBukuList((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, [field]: value } : b))
    );
  };

  const handleDeleteBook = (bookId) => {
    if (!confirm("Yakin ingin menghapus bahan bacaan ini dari perpustakaan?"))
      return;
    setBukuList((prev) => prev.filter((b) => b.id !== bookId));
    if (activeBookId === bookId) setActiveBookId(null);
  };

  // Fitur Tambah / Edit Halaman Bab Teks (Opsional pendamping PDF)
  const handleAddBab = (bookId) => {
    const newBab = {
      id: `bab-${Date.now()}`,
      judulBab: `Halaman / Bagian Baru`,
      isi: "",
    };
    setBukuList((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? { ...b, babList: [...(b.babList || []), newBab] }
          : b
      )
    );
  };

  const handleUpdateBab = (bookId, babId, field, val) => {
    setBukuList((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? {
              ...b,
              babList: (b.babList || []).map((bab) =>
                bab.id === babId ? { ...bab, [field]: val } : bab
              ),
            }
          : b
      )
    );
  };

  const handleDeleteBab = (bookId, babId) => {
    setBukuList((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? {
              ...b,
              babList: (b.babList || []).filter((bab) => bab.id !== babId),
            }
          : b
      )
    );
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "website_config", "database_buku"), {
        listBuku: bukuList,
      });
      alert(
        "Perpustakaan Bahan Bacaan Kader berhasil disimpan & dipublikasikan!"
      );
    } catch (err) {
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredBooks = bukuList.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      (b.judul || "").toLowerCase().includes(q) ||
      (b.penulis || "").toLowerCase().includes(q) ||
      (b.kategori || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={32} className="text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12 w-full text-sm">
      {/* STICKY HEADER PANEL & TOMBOL SIMPAN DI ATAS */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600 block mb-0.5">
            Perpustakaan Digital // {bukuList.length} Koleksi Buku
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Bahan Bacaan & Modul Kader
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unggah file PDF buku/modul atau susun lembar bacaan yang dapat
            dibuka dengan animasi Flipbook 3D oleh kader.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Plus size={15} className="text-amber-400" /> Tambah Buku / Modul
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white font-bold py-2.5 px-5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap text-xs sm:text-sm"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>Simpan Perpustakaan Kader</span>
          </button>
        </div>
      </div>

      {/* FORM TAMBAH BUKU BARU */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border border-blue-200 shadow-md overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
            <span className="font-bold text-xs sm:text-sm flex items-center gap-2">
              <BookOpen size={16} className="text-amber-400" /> Formulir Unggah
              Bahan Bacaan Baru
            </span>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              Tutup ✕
            </button>
          </div>

          <form onSubmit={handleAddBuku} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-6">
                <label className={labelClass}>Judul Buku / Modul *</label>
                <input
                  type="text"
                  required
                  value={newJudul}
                  onChange={(e) => setNewJudul(e.target.value)}
                  className={inputClass}
                  placeholder="Contoh: Modul MAPABA Raya & Aswaja..."
                />
              </div>

              <div className="sm:col-span-3">
                <label className={labelClass}>Penulis / Penyusun</label>
                <input
                  type="text"
                  value={newPenulis}
                  onChange={(e) => setNewPenulis(e.target.value)}
                  className={inputClass}
                  placeholder="Contoh: Biro Kaderisasi"
                />
              </div>

              <div className="sm:col-span-3">
                <label className={labelClass}>Kategori Bacaan</label>
                <select
                  value={newKategori}
                  onChange={(e) => setNewKategori(e.target.value)}
                  className={inputClass}
                >
                  {KATEGORI_BUKU.map((kat) => (
                    <option key={kat} value={kat}>
                      {kat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Tahun Terbit</label>
                <input
                  type="text"
                  value={newTahun}
                  onChange={(e) => setNewTahun(e.target.value)}
                  className={inputClass}
                  placeholder="2026"
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Jumlah Halaman</label>
                <input
                  type="text"
                  value={newHalaman}
                  onChange={(e) => setNewHalaman(e.target.value)}
                  className={inputClass}
                  placeholder="Contoh: 48 Hal"
                />
              </div>

              <div className="sm:col-span-4">
                <label className={labelClass}>
                  Sampul / Cover Buku (Upload / Link)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCoverUrl}
                    onChange={(e) => setNewCoverUrl(e.target.value)}
                    className={`${inputClass} flex-1 font-mono text-xs`}
                    placeholder="https://..."
                  />
                  <label className="bg-slate-900 hover:bg-blue-600 text-white cursor-pointer px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition shrink-0">
                    {uploadingTarget === "new-cover" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ImageIcon size={14} />
                    )}
                    <span>Cover</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleUpload(e.target.files[0], "new-cover")
                      }
                      disabled={Boolean(uploadingTarget)}
                    />
                  </label>
                </div>
              </div>

              <div className="sm:col-span-4">
                <label className={labelClass}>
                  File PDF Buku / Link G-Drive
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFileUrl}
                    onChange={(e) => setNewFileUrl(e.target.value)}
                    className={`${inputClass} flex-1 font-mono text-xs`}
                    placeholder="Upload PDF atau tempel link..."
                  />
                  <label className="bg-blue-600 hover:bg-blue-500 text-white cursor-pointer px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition shrink-0">
                    {uploadingTarget === "new-file" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <UploadCloud size={14} />
                    )}
                    <span>File PDF</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleUpload(e.target.files[0], "new-file")
                      }
                      disabled={Boolean(uploadingTarget)}
                    />
                  </label>
                </div>
              </div>

              <div className="sm:col-span-12">
                <label className={labelClass}>
                  Sinopsis / Pengantar Singkat Buku
                </label>
                <textarea
                  rows="2"
                  value={newDeskripsi}
                  onChange={(e) => setNewDeskripsi(e.target.value)}
                  className={`${inputClass} resize-none`}
                  placeholder="Jelaskan secara singkat isi pokok dari buku atau modul kaderisasi ini..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm transition"
              >
                <Plus size={16} /> Tambahkan ke Daftar Buku
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MASTER - DETAIL WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* KOLOM KIRI: DAFTAR BUKU */}
        <div
          className={`lg:col-span-5 flex flex-col gap-3 ${
            activeBook ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul buku, penulis, atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={inputClass + " pl-10 py-2.5 rounded-xl"}
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden flex flex-col max-h-[650px]">
            <div className="px-4 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                <BookMarked size={15} className="text-blue-600" /> Koleksi Bahan
                Bacaan
              </h3>
              <span className="text-[11px] font-mono font-bold text-slate-400">
                {filteredBooks.length} Buku
              </span>
            </div>

            <div className="overflow-y-auto p-3 space-y-2.5">
              {filteredBooks.length === 0 ? (
                <div className="text-center py-12 px-4 text-slate-400 text-xs">
                  Belum ada bahan bacaan yang diunggah. Klik tombol{" "}
                  <strong>Tambah Buku / Modul Baru</strong> di atas.
                </div>
              ) : (
                filteredBooks.map((b) => {
                  const isSelected = activeBookId === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setActiveBookId(b.id)}
                      className={`border p-3 rounded-xl flex items-center gap-3.5 cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/70 shadow-sm"
                          : "border-slate-200/80 bg-white hover:border-blue-300"
                      }`}
                    >
                      <div className="w-12 h-16 rounded-lg overflow-hidden bg-slate-900 text-amber-400 border border-slate-200 shrink-0 flex items-center justify-center">
                        {b.coverUrl ? (
                          <img
                            src={b.coverUrl}
                            alt={b.judul}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen size={18} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700 inline-block mb-1">
                          {b.kategori || "Umum"}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                          {b.judul}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {b.penulis || "Tim Redaksi"} • {b.tahun || "-"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: EDITOR BUKU & LEMBAR BACAAN */}
        <div
          className={`lg:col-span-7 ${
            activeBook ? "block" : "hidden lg:block"
          }`}
        >
          {activeBook ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden flex flex-col">
              {/* Mobile Back Button */}
              <div className="lg:hidden px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveBookId(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400"
                >
                  <ArrowLeft size={15} /> Kembali ke Koleksi Buku
                </button>
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  Editor Buku
                </span>
              </div>

              {/* Detail & File Upload Editor */}
              <div className="p-4 sm:p-6 border-b border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600">
                    Detail Identitas & Berkas Buku
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteBook(activeBook.id)}
                    className="text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Trash2 size={14} /> Hapus Buku
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  {/* Cover Preview & Upload */}
                  <div className="flex flex-col items-center gap-2 shrink-0 mx-auto sm:mx-0">
                    <div className="w-28 h-36 rounded-xl overflow-hidden bg-slate-900 border-2 border-slate-200 shadow-md flex items-center justify-center relative group">
                      {activeBook.coverUrl ? (
                        <img
                          src={activeBook.coverUrl}
                          alt={activeBook.judul}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2 text-amber-400">
                          <BookOpen size={26} className="mx-auto mb-1" />
                          <span className="text-[9px] font-mono uppercase block">
                            Tanpa Cover
                          </span>
                        </div>
                      )}
                    </div>

                    <label className="cursor-pointer w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition shadow-sm">
                      {uploadingTarget === "edit-cover" ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <UploadCloud size={12} />
                      )}
                      <span>Ganti Cover</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleUpload(e.target.files[0], "edit-cover")
                        }
                        disabled={Boolean(uploadingTarget)}
                      />
                    </label>
                  </div>

                  {/* Metadata Inputs */}
                  <div className="flex-1 w-full space-y-3">
                    <div>
                      <label className={labelClass}>Judul Buku / Modul</label>
                      <input
                        type="text"
                        value={activeBook.judul || ""}
                        onChange={(e) =>
                          handleUpdateBook(
                            activeBook.id,
                            "judul",
                            e.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Penulis / Penyusun</label>
                        <input
                          type="text"
                          value={activeBook.penulis || ""}
                          onChange={(e) =>
                            handleUpdateBook(
                              activeBook.id,
                              "penulis",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Kategori</label>
                        <select
                          value={activeBook.kategori || KATEGORI_BUKU[0]}
                          onChange={(e) =>
                            handleUpdateBook(
                              activeBook.id,
                              "kategori",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        >
                          {KATEGORI_BUKU.map((kat) => (
                            <option key={kat} value={kat}>
                              {kat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Tahun Terbit</label>
                        <input
                          type="text"
                          value={activeBook.tahun || ""}
                          onChange={(e) =>
                            handleUpdateBook(
                              activeBook.id,
                              "tahun",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          Keterangan Halaman
                        </label>
                        <input
                          type="text"
                          value={activeBook.tebalHalaman || ""}
                          onChange={(e) =>
                            handleUpdateBook(
                              activeBook.id,
                              "tebalHalaman",
                              e.target.value
                            )
                          }
                          className={inputClass}
                          placeholder="Contoh: 64 Halaman"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* File PDF & Cover URL Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className={labelClass}>URL Gambar Cover</label>
                    <input
                      type="text"
                      value={activeBook.coverUrl || ""}
                      onChange={(e) =>
                        handleUpdateBook(
                          activeBook.id,
                          "coverUrl",
                          e.target.value
                        )
                      }
                      className={`${inputClass} font-mono text-xs`}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      File PDF Buku / Link Dokumen (Utama untuk Flipbook)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={activeBook.fileUrl || ""}
                        onChange={(e) =>
                          handleUpdateBook(
                            activeBook.id,
                            "fileUrl",
                            e.target.value
                          )
                        }
                        className={`${inputClass} flex-1 font-mono text-xs`}
                        placeholder="https://... (.pdf / link G-Drive)"
                      />
                      <label className="bg-blue-600 hover:bg-blue-500 text-white cursor-pointer px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition shrink-0">
                        {uploadingTarget === "edit-file" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <UploadCloud size={14} />
                        )}
                        <span>Upload PDF</span>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleUpload(e.target.files[0], "edit-file")
                          }
                          disabled={Boolean(uploadingTarget)}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Sinopsis / Deskripsi Buku</label>
                  <textarea
                    rows="2"
                    value={activeBook.deskripsi || ""}
                    onChange={(e) =>
                      handleUpdateBook(
                        activeBook.id,
                        "deskripsi",
                        e.target.value
                      )
                    }
                    className={`${inputClass} resize-none`}
                    placeholder="Ringkasan isi buku..."
                  />
                </div>
              </div>

              {/* OPSIONAL: LEMBAR / BAB BACAAN TEKS */}
              <div className="p-4 sm:p-6 bg-slate-50/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                      <Layers size={15} className="text-blue-600" /> Lembar Bab
                      / Isi Teks Tambahan (Opsional)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Selain file PDF di atas, Anda juga dapat menulis isi
                      per-halaman/bab di sini untuk dibaca langsung di mode
                      Flipbook.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddBab(activeBook.id)}
                    className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition shadow-sm"
                  >
                    <Plus size={13} /> Tambah Lembar Halaman
                  </button>
                </div>

                {activeBook.babList && activeBook.babList.length > 0 && (
                  <div className="space-y-3 pt-2">
                    {activeBook.babList.map((bab, idx) => (
                      <div
                        key={bab.id || idx}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            Lembar #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={bab.judulBab || ""}
                            onChange={(e) =>
                              handleUpdateBab(
                                activeBook.id,
                                bab.id,
                                "judulBab",
                                e.target.value
                              )
                            }
                            placeholder="Judul Bab / Halaman..."
                            className="flex-1 px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteBab(activeBook.id, bab.id)
                            }
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <textarea
                          rows="4"
                          value={bab.isi || ""}
                          onChange={(e) =>
                            handleUpdateBab(
                              activeBook.id,
                              bab.id,
                              "isi",
                              e.target.value
                            )
                          }
                          placeholder="Ketik isi bacaan untuk halaman ini..."
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-500 resize-y"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 h-full flex flex-col items-center justify-center p-10 text-center min-h-[380px]">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen size={30} className="text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">
                Pilih Buku untuk Mengelola Isi & File PDF
              </h3>
              <p className="text-slate-500 mt-1.5 text-xs max-w-sm leading-relaxed">
                Klik salah satu buku di sebelah kiri atau tambahkan buku baru
                untuk mengunggah cover dan file PDF bahan bacaan kader.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

