"use client";
import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  MessageSquareQuote,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Save,
  Search,
  Upload,
  Loader2,
  Eye,
  EyeOff,
  CheckCheck,
  User,
  X,
} from "lucide-react";

export const STARTER_TESTIMONI = [
  {
    id: "testi-starter-1",
    nama: "Sahabat M. Rizky Pratama",
    statusPeran: "Alumni PMII",
    rayonAtauInstansi: "Alumni PK. PMII Sunan Ampel Malang",
    angkatan: "2019",
    fotoUrl: "",
    pesan:
      "PMII Sunan Ampel Malang bukan sekadar ruang berorganisasi, melainkan kawah candradimuka tempat kami belajar memadukan kedalaman dzikir, ketajaman fikir, dan keberpihakan nyata lewat amal sholeh.",
    status: "approved",
    createdAt: "2025-01-15T08:00:00.000Z",
  },
  {
    id: "testi-starter-2",
    nama: "Sahabati Nadia Zahra, S.Sos.",
    statusPeran: "Kader KOPRI / Alumni",
    rayonAtauInstansi: "KOPRI PK. PMII Sunan Ampel Malang",
    angkatan: "2020",
    fotoUrl: "",
    pesan:
      "Lewat ruang kaderisasi SIG dan SKP di lingkungan Komisariat Sunan Ampel, saya menemukan kepercayaan diri untuk bersuara, menulis, dan mengawal isu-isu keadilan gender berlandaskan nilai Aswaja.",
    status: "approved",
    createdAt: "2025-02-01T10:30:00.000Z",
  },
  {
    id: "testi-starter-3",
    nama: "Ahmad Fauzan Al-Farisi",
    statusPeran: "Kader Aktif",
    rayonAtauInstansi: "PR. PMII Kawah Chondrodimuko",
    angkatan: "2023",
    fotoUrl: "",
    pesan:
      "Tradisi diskusi intelektual, bedah buku, dan pendampingan masyarakat di PMII membentuk cara pandang kritis yang tidak saya dapatkan di bangku perkuliahan formal semata.",
    status: "approved",
    createdAt: "2025-02-12T14:15:00.000Z",
  },
];

const PERAN_OPTIONS = [
  "Kader Aktif",
  "Alumni PMII",
  "Pengurus Rayon / Komisariat",
  "Kader KOPRI",
  "Tokoh / Mabincab / Dosen",
  "Mahasiswa / Umum",
];

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "PK";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export default function AdminTestimoniPage() {
  const [listTestimoni, setListTestimoni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filter & Pencarian
  const [activeTab, setActiveTab] = useState("all"); // all | pending | approved | rejected
  const [searchQuery, setSearchQuery] = useState("");

  // State Modal / Form Tambah & Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    nama: "",
    statusPeran: "Kader Aktif",
    rayonAtauInstansi: "",
    angkatan: "",
    fotoUrl: "",
    pesan: "",
    status: "approved",
  });

  useEffect(() => {
    async function fetchTestimoni() {
      try {
        const docRef = doc(db, "website_config", "database_testimoni");
        const docSnap = await getDoc(docRef);
        if (
          docSnap.exists() &&
          Array.isArray(docSnap.data().listTestimoni)
        ) {
          setListTestimoni(docSnap.data().listTestimoni);
        } else {
          setListTestimoni(STARTER_TESTIMONI);
        }
      } catch (err) {
        console.error("Gagal memuat data testimoni:", err);
        setListTestimoni(STARTER_TESTIMONI);
      } finally {
        setLoading(false);
      }
    }
    fetchTestimoni();
  }, []);

  const persistToFirestore = async (updatedList) => {
    setSaving(true);
    try {
      const docRef = doc(db, "website_config", "database_testimoni");
      await setDoc(docRef, { listTestimoni: updatedList }, { merge: true });
      setListTestimoni(updatedList);
      return true;
    } catch (error) {
      console.error("Gagal menyimpan ke Firestore:", error);
      alert("Gagal menyimpan perubahan ke database.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Ubah status 1 item (ACC / Sembunyikan / Pending)
  const handleStatusChange = async (id, newStatus) => {
    const updated = listTestimoni.map((item) =>
      String(item.id) === String(id) ? { ...item, status: newStatus } : item
    );
    await persistToFirestore(updated);
  };

  // ACC Semua yang masih Pending
  const handleApproveAllPending = async () => {
    const pendingCount = listTestimoni.filter(
      (x) => x.status === "pending"
    ).length;
    if (pendingCount === 0) return;
    if (
      !window.confirm(
        `Setujui (ACC) dan tampilkan seluruh ${pendingCount} kiriman yang sedang menunggu?`
      )
    ) {
      return;
    }
    const updated = listTestimoni.map((item) =>
      item.status === "pending" ? { ...item, status: "approved" } : item
    );
    await persistToFirestore(updated);
  };

  // Hapus 1 testimoni
  const handleDelete = async (id, nama) => {
    if (
      !window.confirm(`Hapus permanen kata-kata dari "${nama}"?`)
    ) {
      return;
    }
    const updated = listTestimoni.filter(
      (item) => String(item.id) !== String(id)
    );
    await persistToFirestore(updated);
  };

  // Buka Form Tambah Baru
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      nama: "",
      statusPeran: "Kader Aktif",
      rayonAtauInstansi: "",
      angkatan: "",
      fotoUrl: "",
      pesan: "",
      status: "approved",
    });
    setIsFormOpen(true);
  };

  // Buka Form Edit
  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      nama: item.nama || "",
      statusPeran: item.statusPeran || "Kader Aktif",
      rayonAtauInstansi: item.rayonAtauInstansi || "",
      angkatan: item.angkatan || "",
      fotoUrl: item.fotoUrl || "",
      pesan: item.pesan || "",
      status: item.status || "approved",
    });
    setIsFormOpen(true);
  };

  // Upload Foto Profil
  const handleUploadFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.url) {
        setFormData((prev) => ({ ...prev, fotoUrl: data.url }));
      } else {
        alert("Gagal mengunggah foto.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Terjadi kesalahan saat mengunggah foto.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Simpan Form Tambah / Edit
  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.pesan.trim()) {
      alert("Nama lengkap dan isi kata-kata wajib diisi!");
      return;
    }

    let updated = [];
    if (editingId) {
      updated = listTestimoni.map((item) =>
        String(item.id) === String(editingId)
          ? {
              ...item,
              ...formData,
              nama: formData.nama.trim(),
              pesan: formData.pesan.trim(),
            }
          : item
      );
    } else {
      const newEntry = {
        id: `testi-${Date.now()}`,
        nama: formData.nama.trim(),
        statusPeran: formData.statusPeran || "Kader Aktif",
        rayonAtauInstansi: formData.rayonAtauInstansi.trim(),
        angkatan: formData.angkatan.trim(),
        fotoUrl: formData.fotoUrl.trim(),
        pesan: formData.pesan.trim(),
        status: formData.status || "approved",
        createdAt: new Date().toISOString(),
      };
      updated = [newEntry, ...listTestimoni];
    }

    const ok = await persistToFirestore(updated);
    if (ok) {
      setIsFormOpen(false);
      setEditingId(null);
    }
  };

  // Statistik Ringkas
  const counts = useMemo(() => {
    const pending = listTestimoni.filter((x) => x.status === "pending").length;
    const approved = listTestimoni.filter(
      (x) => x.status === "approved"
    ).length;
    const rejected = listTestimoni.filter(
      (x) => x.status === "rejected"
    ).length;
    return {
      all: listTestimoni.length,
      pending,
      approved,
      rejected,
    };
  }, [listTestimoni]);

  // Daftar yang sudah difilter
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return listTestimoni.filter((item) => {
      const matchTab =
        activeTab === "all" ? true : item.status === activeTab;
      const matchSearch =
        !q ||
        (item.nama || "").toLowerCase().includes(q) ||
        (item.pesan || "").toLowerCase().includes(q) ||
        (item.rayonAtauInstansi || "").toLowerCase().includes(q) ||
        (item.statusPeran || "").toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [listTestimoni, activeTab, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-mono uppercase tracking-widest">
          Memuat Data Kata Mereka...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* ================= STICKY HEADER & TOMBOL AKSI UTAMA ================= */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
              <MessageSquareQuote className="w-3.5 h-3.5" />
              <span>Moderasi & Kurasi Beranda</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Apa Kata Mereka Tentang PMII?
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Kelola dan setujui (ACC) kiriman kesan, pesan, serta testimoni dari
              kader, alumni, maupun tokoh sebelum ditayangkan di halaman Beranda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {counts.pending > 0 && (
              <button
                type="button"
                onClick={handleApproveAllPending}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                <span>ACC Semua ({counts.pending})</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-yellow-400" />
              <span>Tambah Kata Mereka</span>
            </button>
          </div>
        </div>

        {/* Statistik Ringkas 4 Kartu */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-slate-50 hover:bg-slate-100/80 border-slate-200/80 text-slate-800"
            }`}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider opacity-75 block">
              Total Kiriman
            </span>
            <p className="text-2xl font-black mt-0.5 tabular-nums">
              {counts.all}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === "pending"
                ? "bg-amber-500 text-slate-950 border-amber-500"
                : "bg-amber-50/70 hover:bg-amber-100/70 border-amber-200 text-amber-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                Menunggu ACC
              </span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <p className="text-2xl font-black mt-0.5 tabular-nums">
              {counts.pending}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("approved")}
            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === "approved"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-200 text-emerald-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                Tayang (ACC)
              </span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <p className="text-2xl font-black mt-0.5 tabular-nums">
              {counts.approved}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rejected")}
            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === "rejected"
                ? "bg-rose-600 text-white border-rose-600"
                : "bg-rose-50/60 hover:bg-rose-100/60 border-rose-200 text-rose-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                Disembunyikan
              </span>
              <EyeOff className="w-3.5 h-3.5" />
            </div>
            <p className="text-2xl font-black mt-0.5 tabular-nums">
              {counts.rejected}
            </p>
          </button>
        </div>
      </div>

      {/* ================= BAR PENCARIAN & FILTER TAB ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pengirim, rayon/instansi, atau isi kata-kata..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: `Semua (${counts.all})` },
            { id: "pending", label: `Menunggu ACC (${counts.pending})` },
            { id: "approved", label: `Tayang (${counts.approved})` },
            { id: "rejected", label: `Disembunyikan (${counts.rejected})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= DAFTAR KARTU TESTIMONI (MODERASI) ================= */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <MessageSquareQuote className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">
            Tidak ada data testimoni pada filter ini.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Kiriman baru dari pengunjung halaman Beranda akan otomatis muncul di
            tab &ldquo;Menunggu ACC&rdquo;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((item) => {
            const isPending = item.status === "pending";
            const isApproved = item.status === "approved";

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-all bg-white ${
                  isPending
                    ? "border-amber-400 ring-2 ring-amber-400/20"
                    : isApproved
                    ? "border-slate-200/90 hover:border-blue-400"
                    : "border-slate-200/70 opacity-75"
                }`}
              >
                <div>
                  {/* Baris Atas: Status Badge & Waktu */}
                  <div className="flex items-center justify-between gap-2 mb-3.5 pb-3 border-b border-slate-100">
                    <div>
                      {isPending ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 text-[11px] font-mono font-bold uppercase">
                          <Clock className="w-3 h-3" />
                          <span>Menunggu ACC Admin</span>
                        </span>
                      ) : isApproved ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold uppercase">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Tayang di Beranda</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 text-[11px] font-mono font-bold uppercase">
                          <XCircle className="w-3 h-3" />
                          <span>Disembunyikan</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        title="Edit Kata-Kata"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.nama)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Hapus Permanen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Profil Pengirim */}
                  <div className="flex items-center gap-3 mb-3.5">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-yellow-400 font-black text-sm flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                      {item.fotoUrl ? (
                        <img
                          src={item.fotoUrl}
                          alt={item.nama}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{getInitials(item.nama)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          {item.nama}
                        </h3>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-mono font-bold">
                          {item.statusPeran || "Kader"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {item.rayonAtauInstansi || "PK. PMII Sunan Ampel Malang"}
                        {item.angkatan ? ` • Angkatan ${item.angkatan}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Isi Kutipan / Kata-Kata */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                    &ldquo;{item.pesan}&rdquo;
                  </div>
                </div>

                {/* Tombol Aksi Moderasi (ACC / Sembunyikan) */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  {!isApproved ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleStatusChange(item.id, "approved")}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ACC & Tampilkan di Beranda</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleStatusChange(item.id, "pending")}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Tarik ke Antrean (Pending)</span>
                    </button>
                  )}

                  {item.status !== "rejected" && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleStatusChange(item.id, "rejected")}
                      className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Sembunyikan</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL TAMBAH / EDIT TESTIMONI ================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-5 sm:p-6 shadow-2xl my-8">
            <div className="sticky top-0 z-10 bg-white flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600 block">
                  {editingId ? "Edit Kiriman" : "Input Manual Admin"}
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {editingId
                    ? "Perbarui Kata Mereka"
                    : "Tambah Kata Mereka Tentang PMII"}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  form="adminTestimoniForm"
                  disabled={saving || uploadingPhoto}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form id="adminTestimoniForm" onSubmit={handleSaveForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) =>
                      setFormData({ ...formData, nama: e.target.value })
                    }
                    placeholder="Contoh: Sahabat Ahmad Fauzi"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status / Peran *
                  </label>
                  <select
                    value={formData.statusPeran}
                    onChange={(e) =>
                      setFormData({ ...formData, statusPeran: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    {PERAN_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Asal Rayon / Instansi / Profesi
                  </label>
                  <input
                    type="text"
                    value={formData.rayonAtauInstansi}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rayonAtauInstansi: e.target.value,
                      })
                    }
                    placeholder="Contoh: PR. PMII Kawah Chondrodimuko"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Angkatan / Tahun
                  </label>
                  <input
                    type="text"
                    value={formData.angkatan}
                    onChange={(e) =>
                      setFormData({ ...formData, angkatan: e.target.value })
                    }
                    placeholder="Contoh: 2022"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Upload Foto Profil (Opsional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Foto Profil (Opsional)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {formData.fotoUrl ? (
                      <img
                        src={formData.fotoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold cursor-pointer transition shrink-0">
                      {uploadingPhoto ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {uploadingPhoto ? "Mengunggah..." : "Upload Foto"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadFoto}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={formData.fotoUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, fotoUrl: e.target.value })
                      }
                      placeholder="Atau tempel URL foto..."
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Isi Kutipan / Kata-Kata */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata-Kata / Kesan & Pesan Tentang PMII *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.pesan}
                  onChange={(e) =>
                    setFormData({ ...formData, pesan: e.target.value })
                  }
                  placeholder="Tuliskan kesan, refleksi, atau pesan tentang PMII..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Status Publikasi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Penayangan
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="approved">
                    Langsung Tayangkan di Beranda (ACC)
                  </option>
                  <option value="pending">Simpan di Antrean (Pending)</option>
                  <option value="rejected">Sembunyikan (Draft/Arsip)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingPhoto}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Simpan Data</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

