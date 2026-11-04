"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as XLSX from "xlsx";
import {
  Save,
  Users,
  Plus,
  Trash2,
  FileSpreadsheet,
  UploadCloud,
  Search,
  Filter,
  Info,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckSquare,
  GraduationCap,
  Edit,
  X,
  Download,
  Sparkles,
  Layers,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Phone,
} from "lucide-react";

const RAYON_OPTIONS = [
  "PR. PMII “KAWAH” Chondrodimuko",
  "PR. PMII “Perjuangan” Ibnu Aqil",
  "PR. PMII “Radikal” Al-Faruq",
  "PR. PMII “Penakluk” Al-Adawiyah",
  "PR. PMII “Penyelamat” Dja’far Saifuddin",
  "PR. PMII Ekonomi “Moch. Hatta”",
  "PR. PMII Pencerahan Galileo",
];

const JENJANG_KEYS = ["MAPABA", "PKD", "PKL", "SIG", "SKP", "SKK"];

const makeUniqueId = (prefix = "kdr", idx = 0) =>
  `${prefix}-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 8)}`;

const normalizeJenjang = (item = {}) => {
  const raw =
    typeof item.jenjang === "object" && item.jenjang !== null
      ? item.jenjang
      : {};
  return {
    MAPABA: String(raw.MAPABA ?? item.tahunMapaba ?? item.angkatan ?? "").trim(),
    PKD: String(raw.PKD ?? item.tahunPKD ?? "").trim(),
    PKL: String(raw.PKL ?? item.tahunPKL ?? "").trim(),
    SIG: String(raw.SIG ?? item.tahunSIG ?? "").trim(),
    SKP: String(raw.SKP ?? item.tahunSKP ?? "").trim(),
    SKK: String(raw.SKK ?? item.tahunSKK ?? "").trim(),
  };
};

const normalizeBidangArray = (raw) => {
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

export default function AdminAnggotaEditor() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMutatingAlumni, setIsMutatingAlumni] = useState(false);
  const [anggotaData, setAnggotaData] = useState([]);

  // State UI Panel Atas
  const [activePanel, setActivePanel] = useState(null); // 'manual' | 'excel' | null

  // State Modal Edit Lengkap (Profil + Jenjang + Keahlian)
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [skillInputModal, setSkillInputModal] = useState("");

  // State Form Manual
  const [newAnggota, setNewAnggota] = useState({
    nama: "",
    nim: "",
    nia: "",
    rayon: "",
    angkatan: "",
    whatsapp: "",
    bidangText: "",
    jenjang: {
      MAPABA: "",
      PKD: "",
      PKL: "",
      SIG: "",
      SKP: "",
      SKK: "",
    },
  });

  // State Filter, Pencarian, & Paginasi
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRayon, setFilterRayon] = useState("Semua");
  const [filterAngkatan, setFilterAngkatan] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // State Centang Massal (Bulk Delete & Bulk Mutasi ke Alumni)
  const [selectedIds, setSelectedIds] = useState([]);

  const fileInputRef = useRef(null);

  // 1. LOAD DATA & AUTO-NORMALIZE
  useEffect(() => {
    async function loadAnggota() {
      try {
        const docRef = doc(db, "website_config", "database_anggota");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listAnggota) {
          const seenIds = new Set();
          const loadedData = docSnap.data().listAnggota.map((item, index) => {
            let uniqueId = item.id;
            if (!uniqueId || seenIds.has(uniqueId)) {
              uniqueId = makeUniqueId("kdr", index);
            }
            seenIds.add(uniqueId);
            return {
              ...item,
              id: uniqueId,
              bidang: normalizeBidangArray(item.bidang ?? item.keahlian),
              jenjang: normalizeJenjang(item),
            };
          });
          setAnggotaData(loadedData);
        }
      } catch (error) {
        console.error("Gagal mengambil data anggota:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAnggota();
  }, []);

  // 2. UNDUH TEMPLATE EXCEL & UPLOAD EXCEL
  const handleDownloadTemplate = () => {
    const templateRows = [
      {
        "Nama Lengkap": "Ahmad Fauzi",
        NIM: "220101110001",
        NIA: "04.05.2022.001",
        Rayon: "PR. PMII “KAWAH” Chondrodimuko",
        Angkatan: "2022",
        WhatsApp: "6281234567890",
        "Bidang Keahlian": "Desain Grafis, Web Development, Jurnalistik",
        MAPABA: "2022",
        PKD: "2023",
        PKL: "2024",
        SIG: "2023",
        SKP: "",
        SKK: "2024",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Anggota");
    XLSX.writeFile(wb, "Template_Database_Anggota_PMII.xlsx");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const newData = [];
        data.forEach((row, index) => {
          if (row["Nama Lengkap"] || row["Nama"]) {
            const angkatanStr = String(
              row["Angkatan"] || row["Tahun"] || row["MAPABA"] || ""
            ).trim();
            const mapabaYear = String(row["MAPABA"] || angkatanStr || "").trim();

            newData.push({
              id: makeUniqueId("xls", index),
              nama: String(row["Nama Lengkap"] || row["Nama"] || "").trim(),
              nim: String(row["NIM"] || "").trim(),
              nia: String(row["NIA"] || "").trim(),
              rayon: String(row["Rayon"] || row["Asal Rayon"] || "").trim(),
              angkatan: angkatanStr,
              whatsapp: String(row["WhatsApp"] || row["WA"] || "").trim(),
              bidang: normalizeBidangArray(
                row["Bidang Keahlian"] || row["Keahlian"] || row["Bidang"] || ""
              ),
              jenjang: {
                MAPABA: mapabaYear,
                PKD: String(row["PKD"] || "").trim(),
                PKL: String(row["PKL"] || "").trim(),
                SIG: String(row["SIG"] || "").trim(),
                SKP: String(row["SKP"] || "").trim(),
                SKK: String(row["SKK"] || "").trim(),
              },
            });
          }
        });

        setAnggotaData((prev) => [...newData, ...prev]);
        setActivePanel(null);
        alert(
          `Berhasil mengimpor ${newData.length} data anggota baru! Jangan lupa klik "Simpan Perubahan".`
        );
      } catch {
        alert("Gagal memproses file Excel. Pastikan format kolom benar.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  // 3. TAMBAH BARIS MANUAL DARI FORM
  const submitManualAdd = (e) => {
    e.preventDefault();
    if (!newAnggota.nama.trim()) return alert("Nama Lengkap wajib diisi!");

    const mapabaYear =
      newAnggota.jenjang.MAPABA.trim() || newAnggota.angkatan.trim();
    const angkatanYear =
      newAnggota.angkatan.trim() || newAnggota.jenjang.MAPABA.trim();

    const newEntry = {
      id: makeUniqueId("mnl", 0),
      nama: newAnggota.nama.trim(),
      nim: newAnggota.nim.trim(),
      nia: newAnggota.nia.trim(),
      rayon: newAnggota.rayon,
      angkatan: angkatanYear,
      whatsapp: newAnggota.whatsapp.trim(),
      bidang: normalizeBidangArray(newAnggota.bidangText),
      jenjang: {
        ...newAnggota.jenjang,
        MAPABA: mapabaYear,
      },
    };

    setAnggotaData([newEntry, ...anggotaData]);
    setNewAnggota({
      nama: "",
      nim: "",
      nia: "",
      rayon: "",
      angkatan: "",
      whatsapp: "",
      bidangText: "",
      jenjang: { MAPABA: "", PKD: "", PKL: "", SIG: "", SKP: "", SKK: "" },
    });
    setActivePanel(null);
  };

  // 4. HAPUS & EDIT
  const handleDelete = (id) => {
    if (!confirm("Yakin ingin menghapus anggota ini dari database?")) return;
    setAnggotaData(anggotaData.filter((item) => item.id !== id));
    setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
  };

  const handleInputChange = (id, field, value) => {
    setAnggotaData((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "angkatan" && !item.jenjang?.MAPABA) {
          updated.jenjang = { ...normalizeJenjang(item), MAPABA: value };
        }
        return updated;
      })
    );
  };

  const handleJenjangChange = (id, jenjangKey, tahunValue) => {
    setAnggotaData((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const currentJenjang = normalizeJenjang(item);
        const updatedJenjang = { ...currentJenjang, [jenjangKey]: tahunValue };
        return {
          ...item,
          jenjang: updatedJenjang,
          angkatan:
            jenjangKey === "MAPABA" && tahunValue
              ? tahunValue
              : item.angkatan,
        };
      })
    );
  };

  const handleAddSkillToMember = (id, skillText) => {
    const val = skillText.trim();
    if (!val) return;
    setAnggotaData((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const existing = normalizeBidangArray(item.bidang);
        if (existing.includes(val)) return item;
        return { ...item, bidang: [...existing, val] };
      })
    );
  };

  const handleRemoveSkillFromMember = (id, skillIndex) => {
    setAnggotaData((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const existing = normalizeBidangArray(item.bidang);
        return {
          ...item,
          bidang: existing.filter((_, idx) => idx !== skillIndex),
        };
      })
    );
  };

  // 5. FITUR PILIH CENTANG MASSAL (BULK SELECT)
  const handleSelectAllFiltered = (e) => {
    const filteredIds = filteredData.map((item) => item.id);
    if (e.target.checked) {
      const merged = Array.from(new Set([...selectedIds, ...filteredIds]));
      setSelectedIds(merged);
    } else {
      setSelectedIds(selectedIds.filter((id) => !filteredIds.includes(id)));
    }
  };

  const handleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    if (
      !confirm(
        `PERINGATAN! Anda yakin ingin menghapus ${selectedIds.length} anggota yang dipilih?`
      )
    )
      return;
    setAnggotaData(anggotaData.filter((item) => !selectedIds.includes(item.id)));
    setSelectedIds([]);
  };

  // 6. FITUR UTAMA: MUTASI / PINDAHKAN KE DATABASE ALUMNI
  const moveMembersToAlumni = async (targetIds) => {
    if (!targetIds || targetIds.length === 0) return;
    const membersToMove = anggotaData.filter((item) =>
      targetIds.includes(item.id)
    );
    if (membersToMove.length === 0) return;

    const confirmMsg =
      membersToMove.length === 1
        ? `Tandai "${membersToMove[0].nama}" sebagai Alumni dan pindahkan otomatis datanya ke halaman Direktori Alumni?`
        : `Pindahkan ${membersToMove.length} kader yang dicentang ke Direktori Alumni sekarang?\n\nData diri, asal rayon, tahun angkatan/Mapaba, dan bidang keahlian akan langsung ditransfer ke halaman Alumni tanpa perlu upload ulang.`;

    if (!confirm(confirmMsg)) return;

    setIsMutatingAlumni(true);
    try {
      const alumniRef = doc(db, "website_config", "database_alumni");
      const alumniSnap = await getDoc(alumniRef);
      const currentAlumniList =
        alumniSnap.exists() && Array.isArray(alumniSnap.data().listAlumni)
          ? alumniSnap.data().listAlumni
          : [];

      const updatedAlumniList = [...currentAlumniList];

      membersToMove.forEach((kader, idx) => {
        const jenjangMap = normalizeJenjang(kader);
        const bidangArr = normalizeBidangArray(kader.bidang);
        const tahunMapaba = jenjangMap.MAPABA || kader.angkatan || "";

        const existingIndex = updatedAlumniList.findIndex(
          (a) =>
            (a.nim && kader.nim && a.nim === kader.nim) ||
            (a.nama || "").toLowerCase().trim() ===
              (kader.nama || "").toLowerCase().trim()
        );

        const alumniPayload = {
          id: makeUniqueId("alm", idx),
          nama: kader.nama || "",
          nim: kader.nim || "",
          nia: kader.nia || "",
          whatsapp: kader.whatsapp || "",
          tahunMapaba: tahunMapaba,
          asalRayon: kader.rayon || "",
          profesi: Array.isArray(kader.profesi) ? kader.profesi : [],
          deskripsiProfesi:
            typeof kader.deskripsiProfesi === "object" &&
            kader.deskripsiProfesi !== null
              ? kader.deskripsiProfesi
              : {},
          bidang: bidangArr,
          jenjang: jenjangMap,
          foto: kader.foto || "",
          status: "approved",
        };

        if (existingIndex === -1) {
          updatedAlumniList.unshift(alumniPayload);
        } else {
          updatedAlumniList[existingIndex] = {
            ...updatedAlumniList[existingIndex],
            tahunMapaba:
              updatedAlumniList[existingIndex].tahunMapaba || tahunMapaba,
            asalRayon:
              updatedAlumniList[existingIndex].asalRayon || kader.rayon || "",
            bidang:
              bidangArr.length > 0
                ? Array.from(
                    new Set([
                      ...(updatedAlumniList[existingIndex].bidang || []),
                      ...bidangArr,
                    ])
                  )
                : updatedAlumniList[existingIndex].bidang || [],
            jenjang: jenjangMap,
            nim: updatedAlumniList[existingIndex].nim || kader.nim || "",
            nia: updatedAlumniList[existingIndex].nia || kader.nia || "",
            whatsapp:
              updatedAlumniList[existingIndex].whatsapp || kader.whatsapp || "",
          };
        }
      });

      const remainingAnggota = anggotaData.filter(
        (item) => !targetIds.includes(item.id)
      );

      await Promise.all([
        setDoc(alumniRef, { listAlumni: updatedAlumniList }),
        setDoc(doc(db, "website_config", "database_anggota"), {
          listAnggota: remainingAnggota,
        }),
      ]);

      setAnggotaData(remainingAnggota);
      setSelectedIds((prev) => prev.filter((id) => !targetIds.includes(id)));
      if (editingMemberId && targetIds.includes(editingMemberId)) {
        setEditingMemberId(null);
      }

      alert(
        `Berhasil! ${membersToMove.length} kader telah dipindahkan ke Direktori Alumni dan disimpan ke server.`
      );
    } catch (error) {
      console.error("Gagal memindahkan ke alumni:", error);
      alert("Terjadi kesalahan saat memindahkan data ke Alumni: " + error.message);
    } finally {
      setIsMutatingAlumni(false);
    }
  };

  // 7. SIMPAN KE FIREBASE
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, "website_config", "database_anggota");
      await setDoc(docRef, { listAnggota: anggotaData });
      alert(
        "Database Anggota berhasil diperbarui dan disimpan secara permanen!"
      );
    } catch (error) {
      alert("Gagal menyimpan data: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // FILTERING LOGIC
  const uniqueRayon = [
    "Semua",
    ...new Set(anggotaData.map((item) => item.rayon).filter((r) => r !== "")),
  ];
  const uniqueAngkatan = [
    "Semua",
    ...new Set(
      anggotaData.map((item) => item.angkatan).filter((a) => a !== "")
    ),
  ].sort();

  const filteredData = anggotaData.filter((item) => {
    const q = searchQuery.toLowerCase();
    const bidangStr = normalizeBidangArray(item.bidang).join(" ").toLowerCase();
    const matchSearch =
      (item.nama || "").toLowerCase().includes(q) ||
      (item.nim || "").toLowerCase().includes(q) ||
      (item.nia || "").toLowerCase().includes(q) ||
      bidangStr.includes(q);
    const matchRayon = filterRayon === "Semua" || item.rayon === filterRayon;
    const matchAngkatan =
      filterAngkatan === "Semua" || item.angkatan === filterAngkatan;
    return matchSearch && matchRayon && matchAngkatan;
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedData = filteredData.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );

  const allFilteredSelected =
    filteredData.length > 0 &&
    filteredData.every((item) => selectedIds.includes(item.id));

  const editingMember = editingMemberId
    ? anggotaData.find((m) => m.id === editingMemberId)
    : null;

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={32} className="text-blue-600 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4 pb-12 w-full">
      {/* ================= STICKY TOP ACTION BAR (FLUSH KE ATAS, TIDAK MENUTUPI TABEL) ================= */}
      <div className="sticky top-0 z-30 -mx-3.5 sm:-mx-6 px-3.5 sm:px-6 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:flex w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-slate-900 truncate">
                Database Anggota & Kaderisasi
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-mono font-bold shrink-0">
                {anggotaData.length} Kader
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block truncate">
              Kelola biodata kader, jenjang (MAPABA–SKK), keahlian, dan mutasi ke Alumni.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <button
            type="button"
            onClick={() =>
              setActivePanel(activePanel === "manual" ? null : "manual")
            }
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              activePanel === "manual"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            <UserPlus size={14} />
            <span className="hidden sm:inline">Tambah Manual</span>
            <span className="sm:hidden">+ Kader</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActivePanel(activePanel === "excel" ? null : "excel")
            }
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              activePanel === "excel"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
            }`}
          >
            <FileSpreadsheet size={14} />
            <span className="hidden sm:inline">Impor Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl transition flex items-center gap-1.5 shadow-sm text-xs whitespace-nowrap"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>

      {/* ================= PANEL TAMBAH MANUAL (COLLAPSIBLE) ================= */}
      {activePanel === "manual" && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <UserPlus size={16} className="text-blue-600" /> Tambah Data Kader Baru
            </h3>
            <button
              type="button"
              onClick={() => setActivePanel(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={submitManualAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={newAnggota.nama}
                  onChange={(e) =>
                    setNewAnggota({ ...newAnggota, nama: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:border-blue-600 outline-none bg-slate-50/70 focus:bg-white"
                  placeholder="Masukkan nama lengkap kader..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Asal Rayon
                </label>
                <select
                  value={newAnggota.rayon}
                  onChange={(e) =>
                    setNewAnggota({ ...newAnggota, rayon: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:border-blue-600 outline-none bg-slate-50/70 focus:bg-white"
                >
                  <option value="">Pilih Rayon...</option>
                  {RAYON_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIM
                </label>
                <input
                  type="text"
                  value={newAnggota.nim}
                  onChange={(e) =>
                    setNewAnggota({ ...newAnggota, nim: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:border-blue-600 outline-none bg-slate-50/70 focus:bg-white"
                  placeholder="230..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIA
                </label>
                <input
                  type="text"
                  value={newAnggota.nia}
                  onChange={(e) =>
                    setNewAnggota({ ...newAnggota, nia: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:border-blue-600 outline-none bg-slate-50/70 focus:bg-white"
                  placeholder="04.05..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  No. WhatsApp
                </label>
                <input
                  type="text"
                  value={newAnggota.whatsapp}
                  onChange={(e) =>
                    setNewAnggota({ ...newAnggota, whatsapp: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:border-blue-600 outline-none bg-slate-50/70 focus:bg-white"
                  placeholder="628..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bidang Keahlian (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={newAnggota.bidangText}
                  onChange={(e) =>
                    setNewAnggota({ ...newAnggota, bidangText: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:border-blue-600 outline-none bg-slate-50/70 focus:bg-white"
                  placeholder="Contoh: Desain Grafis, Jurnalistik, Public Speaking"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tahun Angkatan / Mapaba
                </label>
                <input
                  type="text"
                  value={newAnggota.angkatan}
                  onChange={(e) =>
                    setNewAnggota({
                      ...newAnggota,
                      angkatan: e.target.value,
                      jenjang: {
                        ...newAnggota.jenjang,
                        MAPABA: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:border-blue-600 outline-none bg-slate-50/70 focus:bg-white"
                  placeholder="Contoh: 2025"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
                <Layers size={14} className="text-blue-600" />
                <span>Riwayat Jenjang Kaderisasi (Isi tahun kelulusan)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {JENJANG_KEYS.map((jKey) => (
                  <div key={jKey}>
                    <span className="text-[11px] font-mono font-bold text-slate-600 block mb-1">
                      {jKey}
                    </span>
                    <input
                      type="text"
                      value={newAnggota.jenjang[jKey]}
                      onChange={(e) =>
                        setNewAnggota({
                          ...newAnggota,
                          jenjang: {
                            ...newAnggota.jenjang,
                            [jKey]: e.target.value,
                          },
                          angkatan:
                            jKey === "MAPABA" && e.target.value
                              ? e.target.value
                              : newAnggota.angkatan,
                        })
                      }
                      placeholder="Thn (2025)"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-white outline-none focus:border-blue-600"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-xl text-xs transition flex items-center gap-1.5"
              >
                <Plus size={15} /> Tambahkan ke Daftar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= PANEL IMPOR EXCEL (COLLAPSIBLE) ================= */}
      {activePanel === "excel" && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-emerald-600" /> Impor Database Anggota via Excel
            </h4>
            <button
              type="button"
              onClick={() => setActivePanel(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X size={16} />
            </button>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 text-xs p-3.5 rounded-xl">
            <p className="font-bold mb-2 flex items-center gap-1.5">
              <Info size={14} /> Kolom Excel yang Didukung:
            </p>
            <div className="flex flex-wrap gap-1.5 font-mono text-[10px] uppercase font-bold">
              {[
                "Nama Lengkap",
                "NIM",
                "NIA",
                "Rayon",
                "Angkatan",
                "WhatsApp",
                "Bidang Keahlian",
                "MAPABA",
                "PKD",
                "PKL",
                "SIG",
                "SKP",
                "SKK",
              ].map((col) => (
                <span
                  key={col}
                  className="bg-white border border-emerald-200 px-2 py-0.5 rounded"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              <Download size={15} /> Unduh Template Excel (.xlsx)
            </button>

            <div className="relative flex-1 max-w-sm">
              <button
                type="button"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm"
              >
                <UploadCloud size={16} /> Pilih & Unggah File Excel (.xlsx)
              </button>
              <input
                type="file"
                accept=".xlsx, .xls"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= PANEL AKSI MASSAL: PINDAH KE ALUMNI / HAPUS MASSAL ================= */}
      {selectedIds.length > 0 && (
        <div className="bg-[#020617] text-white p-4 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 shadow-md border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-[#facc15] text-slate-950 p-2 rounded-xl shrink-0">
              <CheckSquare size={18} />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-white">
                {selectedIds.length} Kader Dipilih{" "}
                {filterAngkatan !== "Semua" && `(Angkatan ${filterAngkatan})`}
              </p>
              <p className="text-slate-400 text-[11px]">
                Pindahkan kader terpilih ke Direktori Alumni atau hapus secara massal.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              disabled={isMutatingAlumni}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
            >
              Batal Pilih
            </button>

            <button
              type="button"
              onClick={() => moveMembersToAlumni(selectedIds)}
              disabled={isMutatingAlumni}
              className="flex-1 sm:flex-none px-4 py-2 bg-[#facc15] hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isMutatingAlumni ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Memindahkan...</span>
                </>
              ) : (
                <>
                  <GraduationCap size={15} />
                  <span>Pindahkan ke Alumni ({selectedIds.length})</span>
                  <ArrowRightLeft size={13} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isMutatingAlumni}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Trash2 size={14} />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= TOOLBAR FILTER & PENCARIAN ================= */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2.5 flex-1">
          <div className="relative flex-grow">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={15}
            />
            <input
              type="text"
              placeholder="Cari nama kader, NIM, NIA, atau bidang keahlian..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-blue-600 outline-none bg-slate-50/70 focus:bg-white"
            />
          </div>

          <div className="relative w-full sm:w-56 shrink-0">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <select
              value={filterRayon}
              onChange={(e) => {
                setFilterRayon(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none bg-slate-50/70 focus:bg-white cursor-pointer truncate"
            >
              {uniqueRayon.map((r, i) => (
                <option key={i} value={r}>
                  {r === "Semua" ? "Semua Rayon" : r}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-44 shrink-0">
            <GraduationCap
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <select
              value={filterAngkatan}
              onChange={(e) => {
                setFilterAngkatan(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none bg-slate-50/70 focus:bg-white cursor-pointer"
            >
              {uniqueAngkatan.map((a, i) => (
                <option key={i} value={a}>
                  {a === "Semua" ? "Semua Angkatan" : `Angkatan ${a}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span>
              Hasil: <strong>{filteredData.length}</strong> kader
            </span>
            {filteredData.length > 0 && (
              <>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() =>
                    handleSelectAllFiltered({
                      target: { checked: !allFilteredSelected },
                    })
                  }
                  className="font-bold text-blue-600 hover:underline"
                >
                  {allFilteredSelected
                    ? "Batal Pilih Semua"
                    : `Pilih Semua (${filteredData.length})`}
                </button>
              </>
            )}
          </div>

          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 outline-none cursor-pointer"
          >
            <option value={25}>25 / hal</option>
            <option value={50}>50 / hal</option>
            <option value={100}>100 / hal</option>
            <option value={500}>500 / hal</option>
          </select>
        </div>
      </div>

      {/* ================= MOBILE CARDS VIEW (< md) ================= */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {paginatedData.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-xs">
            Tidak ada data anggota ditemukan.
          </div>
        ) : (
          paginatedData.map((item, idx) => {
            const realNumber = (safePage - 1) * itemsPerPage + idx + 1;
            const isSelected = selectedIds.includes(item.id);
            const jenjangMap = normalizeJenjang(item);
            const bidangArr = normalizeBidangArray(item.bidang);
            const passedJenjang = JENJANG_KEYS.filter(
              (k) => jenjangMap[k] && jenjangMap[k] !== "-"
            );

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 transition ${
                  isSelected
                    ? "border-blue-500 bg-blue-50/20"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelect(item.id)}
                      className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-bold text-slate-400 block">
                        #{realNumber} • Angkatan {item.angkatan || "-"}
                      </span>
                      <h4 className="font-black text-slate-900 text-sm leading-snug break-words">
                        {item.nama || "Tanpa Nama"}
                      </h4>
                      <p className="text-xs font-semibold text-blue-600 truncate mt-0.5">
                        {item.rayon || "Rayon Belum Diatur"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingMemberId(item.id);
                      setSkillInputModal("");
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    <Edit size={13} /> Edit
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">NIM</span>
                    <span className="font-bold text-slate-800 break-all">{item.nim || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">NIA</span>
                    <span className="font-bold text-blue-700 break-all">{item.nia || "-"}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {passedJenjang.map((k) => (
                    <span
                      key={k}
                      className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold"
                    >
                      {k} &apos;{String(jenjangMap[k]).slice(-2)}
                    </span>
                  ))}
                  {bidangArr.map((b, bIdx) => (
                    <span
                      key={bIdx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                    >
                      {b}
                    </span>
                  ))}
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                    <Phone size={12} /> {item.whatsapp || "-"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveMembersToAlumni([item.id])}
                      disabled={isMutatingAlumni}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold flex items-center gap-1"
                    >
                      <GraduationCap size={13} /> Alumni
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= DESKTOP TABLE VIEW (md+, BERSIH & TIDAK TABRAKAN) ================= */}
      <div className="hidden md:block bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAllFiltered}
                    checked={allFilteredSelected}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="Pilih Semua Hasil Filter"
                  />
                </th>
                <th className="py-3.5 px-2 w-12 text-center font-bold">No</th>
                <th className="py-3.5 px-4 min-w-[200px] font-bold">Nama Lengkap & WA</th>
                <th className="py-3.5 px-4 w-48 font-bold">NIM & NIA</th>
                <th className="py-3.5 px-4 min-w-[210px] font-bold">Rayon & Angkatan</th>
                <th className="py-3.5 px-4 min-w-[220px] font-bold">Jenjang & Keahlian</th>
                <th className="py-3.5 px-4 w-44 text-center font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => {
                  const realNumber = (safePage - 1) * itemsPerPage + index + 1;
                  const isSelected = selectedIds.includes(item.id);
                  const jenjangMap = normalizeJenjang(item);
                  const bidangArr = normalizeBidangArray(item.bidang);
                  const passedJenjang = JENJANG_KEYS.filter(
                    (k) => jenjangMap[k] && jenjangMap[k] !== "-"
                  );

                  return (
                    <tr
                      key={item.id}
                      className={`${
                        isSelected ? "bg-blue-50/50" : "hover:bg-slate-50/80"
                      } transition-colors`}
                    >
                      <td className="py-3 px-3 text-center align-top pt-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelect(item.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-400 text-xs align-top pt-4">
                        {realNumber}
                      </td>

                      {/* Nama Lengkap & WhatsApp */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-bold text-slate-900 text-sm leading-snug">
                          {item.nama || "-"}
                        </div>
                        {item.whatsapp ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 mt-1">
                            <Phone size={11} className="text-emerald-600" />
                            {item.whatsapp}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic mt-0.5 block">
                            WA belum diisi
                          </span>
                        )}
                      </td>

                      {/* NIM & NIA — Stacked Cleanly, Never Overlapping */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1 font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 w-7 shrink-0">
                              NIM
                            </span>
                            <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                              {item.nim || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-blue-500 w-7 shrink-0">
                              NIA
                            </span>
                            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              {item.nia || "-"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Rayon & Angkatan — Clean Badges */}
                      <td className="py-3 px-4 align-top">
                        <p className="font-semibold text-slate-800 text-xs leading-snug">
                          {item.rayon || "-"}
                        </p>
                        <span className="inline-block mt-1 text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          Angkatan: {item.angkatan || "-"}
                        </span>
                      </td>

                      {/* Jenjang Kaderisasi & Bidang Keahlian */}
                      <td className="py-3 px-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-1">
                            {passedJenjang.length > 0 ? (
                              passedJenjang.map((k) => (
                                <span
                                  key={k}
                                  className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold"
                                >
                                  {k} &apos;{String(jenjangMap[k]).slice(-2)}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                Belum ada jenjang
                              </span>
                            )}
                          </div>

                          {bidangArr.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                              {bidangArr.slice(0, 3).map((b, bIdx) => (
                                <span
                                  key={bIdx}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium truncate max-w-[130px]"
                                >
                                  {b}
                                </span>
                              ))}
                              {bidangArr.length > 3 && (
                                <span className="text-[10px] font-mono text-slate-400">
                                  +{bidangArr.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 align-top text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMemberId(item.id);
                              setSkillInputModal("");
                            }}
                            className="text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 px-2.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition"
                            title="Edit Biodata, Jenjang & Keahlian"
                          >
                            <Edit size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => moveMembersToAlumni([item.id])}
                            disabled={isMutatingAlumni}
                            className="text-amber-700 bg-amber-50 hover:bg-amber-500 hover:text-white border border-amber-200 px-2.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition"
                            title="Mutasi ke Direktori Alumni"
                          >
                            <GraduationCap size={13} />
                            <span>Alumni</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-xl transition border border-transparent hover:border-red-200"
                            title="Hapus Kader"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Search size={28} className="mb-2 opacity-30" />
                      <p className="font-bold text-slate-600 text-sm">
                        Tidak ada data anggota ditemukan.
                      </p>
                      <p className="text-xs mt-1 text-slate-400">
                        Sesuaikan filter pencarian atau tambahkan data baru.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-mono text-slate-500">
              Menampilkan {(safePage - 1) * itemsPerPage + 1}–
              {Math.min(safePage * itemsPerPage, filteredData.length)} dari{" "}
              {filteredData.length} kader
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs font-mono font-bold px-2.5 text-slate-700">
                Hal. {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL EDIT LENGKAP: BIODATA, JENJANG KADERISASI & KEAHLIAN ================= */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Sticky Top Header inside Modal */}
            <div className="sticky top-0 z-20 bg-[#020617] text-white px-5 py-4 flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#facc15] block">
                  EDIT PROFIL, JENJANG & KEAHLIAN KADER
                </span>
                <h3 className="font-bold text-sm sm:text-base truncate">
                  {editingMember.nama || "Kader PMII"}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    await handleSave();
                    setEditingMemberId(null);
                  }}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>Simpan & Tutup</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMemberId(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
              {/* Bagian 1: Biodata & Identitas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Nama Lengkap Kader
                  </label>
                  <input
                    type="text"
                    value={editingMember.nama || ""}
                    onChange={(e) =>
                      handleInputChange(editingMember.id, "nama", e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 bg-slate-50/70 focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Nomor Induk Mahasiswa (NIM)
                  </label>
                  <input
                    type="text"
                    value={editingMember.nim || ""}
                    onChange={(e) =>
                      handleInputChange(editingMember.id, "nim", e.target.value)
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono bg-slate-50/70 focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Nomor Induk Anggota (NIA)
                  </label>
                  <input
                    type="text"
                    value={editingMember.nia || ""}
                    onChange={(e) =>
                      handleInputChange(editingMember.id, "nia", e.target.value)
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono bg-slate-50/70 focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Asal Rayon
                  </label>
                  <select
                    value={editingMember.rayon || ""}
                    onChange={(e) =>
                      handleInputChange(editingMember.id, "rayon", e.target.value)
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/70 focus:bg-white focus:border-blue-600 outline-none"
                  >
                    <option value="">Pilih Rayon...</option>
                    {RAYON_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Angkatan
                    </label>
                    <input
                      type="text"
                      value={editingMember.angkatan || ""}
                      onChange={(e) =>
                        handleInputChange(
                          editingMember.id,
                          "angkatan",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono bg-slate-50/70 focus:bg-white focus:border-blue-600 outline-none"
                      placeholder="2025"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      WhatsApp
                    </label>
                    <input
                      type="text"
                      value={editingMember.whatsapp || ""}
                      onChange={(e) =>
                        handleInputChange(
                          editingMember.id,
                          "whatsapp",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono bg-slate-50/70 focus:bg-white focus:border-blue-600 outline-none"
                      placeholder="628..."
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 2: Tahun Jenjang Kaderisasi */}
              <div className="pt-4 border-t border-slate-200">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                  <Layers size={15} className="text-blue-600" />
                  <span>Jenjang Kaderisasi yang Sudah Dilalui (Isi Tahun)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {JENJANG_KEYS.map((jKey) => {
                    const currentMap = normalizeJenjang(editingMember);
                    const val = currentMap[jKey] || "";
                    return (
                      <div
                        key={jKey}
                        className={`p-3 rounded-xl border ${
                          val
                            ? "bg-blue-50/60 border-blue-300"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-mono font-black text-slate-800">
                            {jKey}
                          </span>
                          {val && (
                            <span className="text-[10px] font-mono font-bold text-blue-600 bg-white px-1.5 py-0.5 rounded border border-blue-200">
                              Lulus
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) =>
                            handleJenjangChange(
                              editingMember.id,
                              jKey,
                              e.target.value
                            )
                          }
                          placeholder="Tahun (mis: 2025)"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-800 focus:border-blue-600 outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bagian 3: Bidang Keahlian */}
              <div className="pt-4 border-t border-slate-200">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                  <Sparkles size={15} className="text-blue-600" />
                  <span>Bidang Keahlian / Kompetensi Kader</span>
                </label>

                <div className="flex flex-wrap gap-1.5 mb-3 min-h-[36px] p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  {normalizeBidangArray(editingMember.bidang).length > 0 ? (
                    normalizeBidangArray(editingMember.bidang).map(
                      (skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveSkillFromMember(
                                editingMember.id,
                                sIdx
                              )
                            }
                            className="text-slate-400 hover:text-red-600 font-bold"
                          >
                            &times;
                          </button>
                        </span>
                      )
                    )
                  ) : (
                    <span className="text-xs text-slate-400">
                      Belum ada keahlian ditambahkan.
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInputModal}
                    onChange={(e) => setSkillInputModal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        handleAddSkillToMember(
                          editingMember.id,
                          skillInputModal
                        );
                        setSkillInputModal("");
                      }
                    }}
                    placeholder="Ketik keahlian (misal: Desain Grafis) lalu Enter..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleAddSkillToMember(editingMember.id, skillInputModal);
                      setSkillInputModal("");
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold shrink-0 transition"
                  >
                    + Tambah
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => moveMembersToAlumni([editingMember.id])}
                  disabled={isMutatingAlumni}
                  className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5"
                >
                  <GraduationCap size={15} />
                  <span>Mutasikan Kader Ini ke Direktori Alumni</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingMemberId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
