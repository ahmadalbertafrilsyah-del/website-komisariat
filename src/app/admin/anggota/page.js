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
  SlidersHorizontal,
  X,
  Download,
  Sparkles,
  Layers,
  ArrowRightLeft,
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
  const [isMutatingAlumni, setIsMutatingAlumni] = useState(false);
  const [anggotaData, setAnggotaData] = useState([]);

  // State UI Panel Atas
  const [activePanel, setActivePanel] = useState(null); // 'manual' | 'excel' | null

  // State Modal Edit Jenjang & Keahlian Spesifik
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

  // State Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRayon, setFilterRayon] = useState("Semua");
  const [filterAngkatan, setFilterAngkatan] = useState("Semua");

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
              uniqueId = `kdr-${Date.now()}-${index}-${Math.random()
                .toString(36)
                .substring(2, 9)}`;
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
              id: `xls-${Date.now()}-${index}-${Math.random()
                .toString(36)
                .substring(2, 9)}`,
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
          `Berhasil mengimpor ${newData.length} data anggota baru! Jangan lupa klik "Simpan Pembaruan Data".`
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
      id: `mnl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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

  // 4. HAPUS & EDIT (INLINE & MODAL)
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
        // Jika angkatan diubah dan MAPABA masih kosong, sinkronkan
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
      // Gabungkan yang sudah terpilih dengan semua yang ada di filter saat ini
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

  // 6. FITUR UTAMA: MUTASI / PINDAHKAN KE DATABASE ALUMNI (SATUAN ATAU MASSAL)
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
      // Ambil data alumni saat ini dari Firebase
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

        // Cek apakah sudah ada di daftar alumni berdasarkan nama + rayon / NIM
        const existingIndex = updatedAlumniList.findIndex(
          (a) =>
            (a.nim && kader.nim && a.nim === kader.nim) ||
            (a.nama || "").toLowerCase().trim() ===
              (kader.nama || "").toLowerCase().trim()
        );

        const alumniPayload = {
          id: `alm-${Date.now()}-${idx}-${Math.random()
            .toString(36)
            .substring(2, 7)}`,
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

      // Simpan kedua database secara paralel ke Firebase
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
    try {
      const docRef = doc(db, "website_config", "database_anggota");
      await setDoc(docRef, { listAnggota: anggotaData });
      alert(
        "Database Anggota berhasil diperbarui dan disimpan secara permanen!"
      );
    } catch (error) {
      alert("Gagal menyimpan data: " + error.message);
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

  const allFilteredSelected =
    filteredData.length > 0 &&
    filteredData.every((item) => selectedIds.includes(item.id));

  const editingMember = editingMemberId
    ? anggotaData.find((m) => m.id === editingMemberId)
    : null;

  const inputClass =
    "w-full bg-transparent border border-transparent hover:bg-slate-100 hover:border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 px-2.5 py-1.5 rounded-md outline-none text-xs sm:text-sm text-slate-700 transition-all placeholder:text-slate-300";

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={32} className="text-blue-600 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* HEADER & STATISTIK */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Database Anggota & Kaderisasi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola profil kader, bidang keahlian, jenjang kaderisasi (MAPABA,
            PKD, PKL, SIG, SKP, SKK), serta mutasi otomatis ke Alumni.
          </p>
        </div>
        <div className="bg-blue-50 px-5 py-3 rounded-xl border border-blue-100 shadow-xs flex items-center gap-4 shrink-0">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest leading-none mb-1">
              Total Kader Aktif
            </p>
            <p className="text-xl font-black text-blue-900 leading-none">
              {anggotaData.length}{" "}
              <span className="text-xs font-semibold text-blue-600">Orang</span>
            </p>
          </div>
        </div>
      </div>

      {/* PANEL KENDALI ATAS (TAMBAH & IMPOR) */}
      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() =>
            setActivePanel(activePanel === "manual" ? null : "manual")
          }
          className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
            activePanel === "manual"
              ? "bg-blue-600 text-white border-blue-700 shadow-md"
              : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700 shadow-xs"
          }`}
        >
          <span className="flex items-center gap-3 font-bold text-sm">
            <UserPlus size={18} /> Tambah Kader Manual (+ Keahlian & Jenjang)
          </span>
          {activePanel === "manual" ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </button>

        <button
          onClick={() =>
            setActivePanel(activePanel === "excel" ? null : "excel")
          }
          className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
            activePanel === "excel"
              ? "bg-emerald-600 text-white border-emerald-700 shadow-md"
              : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50 text-slate-700 shadow-xs"
          }`}
        >
          <span className="flex items-center gap-3 font-bold text-sm">
            <FileSpreadsheet size={18} /> Impor / Template Excel
          </span>
          {activePanel === "excel" ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </button>
      </div>

      {/* ISI PANEL MANUAL */}
      {activePanel === "manual" && (
        <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-xs animate-in slide-in-from-top-2">
          <form onSubmit={submitManualAdd} className="space-y-5">
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: Desain Grafis, Jurnalistik, Public Speaking, Web Dev"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: 2024"
                />
              </div>
            </div>

            {/* Input Tahun Jenjang Kaderisasi */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
                <Layers size={14} className="text-blue-600" />
                <span>
                  Riwayat Jenjang Kaderisasi (Isi tahun kelulusan jika sudah
                  mengikuti, kosongkan jika belum)
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
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
                      placeholder="Thn (2024)"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition flex items-center gap-2"
              >
                <Plus size={16} /> Masukkan ke Tabel Anggota
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ISI PANEL EXCEL */}
      {activePanel === "excel" && (
        <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-xs animate-in slide-in-from-top-2 space-y-4">
          <div className="bg-emerald-50 text-emerald-800 text-xs p-4 rounded-lg">
            <h4 className="font-bold mb-2 flex items-center gap-1.5">
              <Info size={16} /> Kolom Excel yang Didukung:
            </h4>
            <div className="flex flex-wrap gap-1.5 font-mono text-[10px] uppercase font-bold tracking-wider">
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
                  className="bg-white border border-emerald-200 px-2 py-1 rounded shadow-2xs"
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
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition"
            >
              <Download size={16} /> Unduh Template Excel (.xlsx)
            </button>

            <div className="relative flex-1 max-w-md">
              <button
                type="button"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-sm"
              >
                <UploadCloud size={18} /> Unggah File Excel (.xlsx / .xls)
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
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 sm:p-5 rounded-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 animate-in slide-in-from-top-2 shadow-lg border border-blue-800/50">
          <div className="flex items-start sm:items-center gap-3">
            <div className="bg-yellow-400 text-slate-950 p-2.5 rounded-xl shrink-0">
              <CheckSquare size={20} />
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base text-white">
                {selectedIds.length} Kader Dipilih{" "}
                {filterAngkatan !== "Semua" && `(Filter Angkatan ${filterAngkatan})`}
              </p>
              <p className="text-slate-300 text-xs mt-0.5">
                Anda dapat memindahkan kader yang sudah lulus langsung ke{" "}
                <strong className="text-yellow-400">Direktori Alumni</strong>{" "}
                tanpa perlu mengunggah data ulang.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              disabled={isMutatingAlumni}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold rounded-lg border border-white/15 transition"
            >
              Batal Pilih
            </button>

            <button
              type="button"
              onClick={() => moveMembersToAlumni(selectedIds)}
              disabled={isMutatingAlumni}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-xs font-black rounded-lg transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {isMutatingAlumni ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Memindahkan ke Alumni...</span>
                </>
              ) : (
                <>
                  <GraduationCap size={16} />
                  <span>
                    Pindahkan ke Alumni ({selectedIds.length} Kader)
                  </span>
                  <ArrowRightLeft size={14} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isMutatingAlumni}
              className="px-3.5 py-2.5 bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5"
            >
              <Trash2 size={14} />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      )}

      {/* AREA TABEL UTAMA */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Toolbar: Search & Filter (Bisa Filter Tahun Angkatan lalu Centang Semua) */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2.5 flex-1">
            <div className="relative flex-grow">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Cari nama, NIM, NIA, atau keahlian..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              />
            </div>

            <div className="relative w-full sm:w-56 shrink-0">
              <Filter
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={15}
              />
              <select
                value={filterRayon}
                onChange={(e) => setFilterRayon(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold text-slate-700 cursor-pointer"
              >
                {uniqueRayon.map((r, i) => (
                  <option key={i} value={r}>
                    {r === "Semua" ? "Semua Rayon" : r}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-48 shrink-0">
              <GraduationCap
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={15}
              />
              <select
                value={filterAngkatan}
                onChange={(e) => setFilterAngkatan(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold text-slate-700 cursor-pointer"
              >
                {uniqueAngkatan.map((a, i) => (
                  <option key={i} value={a}>
                    {a === "Semua" ? "Semua Angkatan" : `Angkatan ${a}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pintasan Centang Semua Hasil Filter */}
          {filteredData.length > 0 && (
            <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200 shrink-0">
              <span>
                Hasil filter: <strong>{filteredData.length}</strong> kader
              </span>
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
                  ? "Batal Centang Hasil Filter"
                  : `Centang Semua (${filteredData.length})`}
              </button>
            </div>
          )}
        </div>

        {/* Tabel Data */}
        <div className="overflow-x-auto max-h-[65vh] relative">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1150px]">
            <thead className="bg-slate-100 sticky top-0 z-10 shadow-2xs border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAllFiltered}
                    checked={allFilteredSelected}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="Pilih Semua yang Ditampilkan"
                  />
                </th>
                <th className="py-3 px-2 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider w-10 text-center">
                  No
                </th>
                <th className="py-3 px-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider min-w-[190px]">
                  Nama Lengkap
                </th>
                <th className="py-3 px-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider w-32">
                  NIM & NIA
                </th>
                <th className="py-3 px-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider min-w-[170px]">
                  Rayon & Angkatan
                </th>
                <th className="py-3 px-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider min-w-[230px]">
                  Jenjang (MAPABA–SKK) & Keahlian
                </th>
                <th className="py-3 px-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider w-32">
                  WhatsApp
                </th>
                <th className="py-3 px-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider w-32 text-center">
                  Aksi / Alumni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => {
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
                        isSelected ? "bg-amber-50/70" : "hover:bg-blue-50/30"
                      } transition-colors group`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelect(item.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono font-medium text-slate-400 text-xs">
                        {index + 1}
                      </td>

                      {/* Nama Lengkap */}
                      <td className="py-2.5 px-2">
                        <input
                          type="text"
                          value={item.nama || ""}
                          onChange={(e) =>
                            handleInputChange(item.id, "nama", e.target.value)
                          }
                          className={`${inputClass} font-bold text-slate-900`}
                          placeholder="Nama lengkap..."
                        />
                      </td>

                      {/* NIM & NIA */}
                      <td className="py-2.5 px-2 space-y-1">
                        <input
                          type="text"
                          value={item.nim || ""}
                          onChange={(e) =>
                            handleInputChange(item.id, "nim", e.target.value)
                          }
                          className={`${inputClass} font-mono text-xs py-1`}
                          placeholder="NIM..."
                        />
                        <input
                          type="text"
                          value={item.nia || ""}
                          onChange={(e) =>
                            handleInputChange(item.id, "nia", e.target.value)
                          }
                          className={`${inputClass} font-mono text-[11px] text-blue-600 py-1`}
                          placeholder="NIA..."
                        />
                      </td>

                      {/* Rayon & Angkatan */}
                      <td className="py-2.5 px-2 space-y-1">
                        <input
                          type="text"
                          value={item.rayon || ""}
                          onChange={(e) =>
                            handleInputChange(item.id, "rayon", e.target.value)
                          }
                          className={`${inputClass} text-xs py-1`}
                          placeholder="Rayon..."
                        />
                        <div className="flex items-center gap-1 px-2">
                          <span className="text-[10px] font-mono text-slate-400">
                            Angkatan:
                          </span>
                          <input
                            type="text"
                            value={item.angkatan || ""}
                            onChange={(e) =>
                              handleInputChange(
                                item.id,
                                "angkatan",
                                e.target.value
                              )
                            }
                            className="w-20 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 text-xs font-mono font-bold text-slate-700 outline-none px-1 py-0.5"
                            placeholder="Tahun..."
                          />
                        </div>
                      </td>

                      {/* Jenjang Kaderisasi & Bidang Keahlian */}
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-1">
                            {passedJenjang.length > 0 ? (
                              passedJenjang.map((k) => (
                                <span
                                  key={k}
                                  className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold"
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

                          <div className="flex flex-wrap items-center gap-1">
                            {bidangArr.slice(0, 2).map((b, bIdx) => (
                              <span
                                key={bIdx}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium truncate max-w-[110px]"
                              >
                                {b}
                              </span>
                            ))}
                            {bidangArr.length > 2 && (
                              <span className="text-[10px] font-mono text-slate-400">
                                +{bidangArr.length - 2}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingMemberId(item.id);
                              setSkillInputModal("");
                            }}
                            className="self-start inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50/70 hover:bg-blue-100/80 px-2 py-1 rounded-md transition"
                          >
                            <SlidersHorizontal size={12} />
                            <span>Atur Jenjang & Keahlian</span>
                          </button>
                        </div>
                      </td>

                      {/* WhatsApp */}
                      <td className="py-2.5 px-2">
                        <input
                          type="text"
                          value={item.whatsapp || ""}
                          onChange={(e) =>
                            handleInputChange(
                              item.id,
                              "whatsapp",
                              e.target.value
                            )
                          }
                          className={`${inputClass} font-mono text-xs`}
                          placeholder="628..."
                        />
                      </td>

                      {/* Aksi: Luluskan ke Alumni / Hapus */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveMembersToAlumni([item.id])}
                            disabled={isMutatingAlumni}
                            className="text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition"
                            title="Tandai Sudah Alumni & Pindahkan ke Halaman Alumni"
                          >
                            <GraduationCap size={13} />
                            <span>Alumni</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all border border-transparent hover:border-red-200"
                            title="Hapus Kader"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Search size={32} className="mb-3 opacity-20" />
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
      </div>

      {/* ================= MODAL EDIT JENJANG KADERISASI & BIDANG KEAHLIAN ================= */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-yellow-400 block">
                  Pengaturan Kompetensi & Kaderisasi
                </span>
                <h3 className="font-bold text-base truncate">
                  {editingMember.nama || "Kader PMII"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingMemberId(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Bagian 1: Tahun Jenjang Kaderisasi */}
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                  <Layers size={15} className="text-blue-600" />
                  <span>
                    Jenjang Kaderisasi yang Sudah Dilalui (Isi Tahun)
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Ketik tahun kelulusan (misal: <strong>2024</strong>) pada
                  jenjang yang sudah diikuti. Kosongkan jika belum mengikuti.
                </p>

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
                          placeholder="Tahun (mis: 2024)"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bagian 2: Bidang Keahlian */}
              <div className="pt-4 border-t border-slate-200">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                  <Sparkles size={15} className="text-blue-600" />
                  <span>Bidang Keahlian / Kompetensi Kader</span>
                </label>

                <div className="flex flex-wrap gap-1.5 mb-3 min-h-[32px] p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  {normalizeBidangArray(editingMember.bidang).length > 0 ? (
                    normalizeBidangArray(editingMember.bidang).map(
                      (skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 shadow-2xs"
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
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleAddSkillToMember(editingMember.id, skillInputModal);
                      setSkillInputModal("");
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0"
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
                  className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg inline-flex items-center gap-1.5"
                >
                  <GraduationCap size={15} />
                  <span>Pindahkan Kader Ini ke Alumni</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingMemberId(null)}
                  className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Bar (Simpan) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl sticky bottom-6 z-40 shadow-2xl shadow-slate-900/20">
        <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 max-w-2xl px-2">
          <Info size={20} className="shrink-0 text-blue-400" />
          <p>
            Simpan perubahan tabel agar modifikasi jenjang kaderisasi dan bidang
            keahlian langsung tampil di halaman publik. (Untuk mutasi ke Alumni
            tersimpan otomatis saat tombol diklik).
          </p>
        </div>
        <button
          onClick={handleSave}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 whitespace-nowrap shrink-0 text-sm"
        >
          <Save size={18} /> Simpan Pembaruan Data
        </button>
      </div>
    </div>
  );
}
