// app/administrasi/page.js
"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import {
  Search, Download, FolderArchive, Mail, Briefcase, Scale, FileText, FileCheck,
  ExternalLink, Inbox, Send, ChevronLeft, ChevronRight, FileSpreadsheet,
  Building2, MonitorPlay, Share2, Package, Camera, CalendarDays,
  FileSignature, Users, Loader2, CheckCircle, XCircle, LayoutGrid, List,
  Copy, Check, X, Eye, ArrowUpRight, ShieldCheck
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";

const getExportFilename = (tab, lembaga) => `Rekap_${tab}_${lembaga.toUpperCase()}_${Date.now()}.xlsx`;

const defaultSkSchema = [
  { id: "namaOrganisasi", label: "Asal Organisasi / Nama Kepanitiaan", type: "text", required: true, placeholder: "Contoh: PR PMII Rayon XYZ" },
  { id: "email", label: "Email Pemohon (Penerima Info ACC)", type: "email", required: true, placeholder: "email_anda@gmail.com" },
  { id: "tentangSK", label: "Tentang SK", type: "textarea", required: true, placeholder: "Deskripsikan dengan singkat mengenai SK apa yang diajukan..." },
  { id: "linkBerkas", label: "Link Surat Permohonan / Berkas Dukung (G-Drive)", type: "url", required: false, placeholder: "https://drive.google.com/..." }
];

const defaultRtarSchema = [
  { id: "namaRayon", label: "Nama Rayon", type: "text", required: true, placeholder: "Contoh: PR PMII Penakluk" },
  { id: "email", label: "Email Pemohon (Penerima Info ACC)", type: "email", required: true, placeholder: "email_anda@gmail.com" },
  { id: "waktuPelaksanaan", label: "Rencana Tgl Pelaksanaan", type: "date", required: true, placeholder: "" },
  { id: "tempat", label: "Tempat Pelaksanaan", type: "text", required: true, placeholder: "Misal: Gedung NU Kota Malang" },
  { id: "linkBerkas", label: "Link Berkas / Proposal (G-Drive)", type: "url", required: false, placeholder: "https://drive.google.com/..." }
];

function DocumentCard({ item, isHukum }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg hover:border-blue-500/40 transition-all duration-300 group flex flex-col h-full"
    >
      <div className="relative w-full pt-[130%] bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 overflow-hidden">
        {(item.thumbnail || item.thumbnailUrl) ? (
          <Image
            src={item.thumbnail || item.thumbnailUrl}
            alt={isHukum ? (item.tentangHukum || "Produk Hukum") : (item.namaLaporan || "Laporan")}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:1.5rem_1.5rem]">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center mb-2.5 text-blue-600 dark:text-blue-400">
              {isHukum ? <Scale size={26} /> : <FileCheck size={26} />}
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              DOKUMEN PDF
            </span>
          </div>
        )}
        <div className="absolute top-2.5 left-2.5 bg-[#020617]/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
          <span className={`text-[9px] font-mono font-bold uppercase tracking-widest ${isHukum ? "text-[#facc15]" : "text-sky-400"}`}>
            {isHukum ? "PRODUK HUKUM" : "LAPORAN LPJ"}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900 px-2 py-0.5 rounded w-max max-w-full truncate mb-2">
          {isHukum ? (item.nomorSK || "Tanpa Nomor SK") : (item.periode || "Periode Umum")}
        </span>
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-snug line-clamp-2 mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {isHukum ? (item.tentangHukum || "Dokumen Hukum") : (item.namaLaporan || "Laporan Kepengurusan")}
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-grow whitespace-pre-wrap">
          {isHukum ? (item.deskripsiHukum || "Tidak ada deskripsi tambahan.") : (item.deskripsiLaporan || "Tidak ada deskripsi tambahan.")}
        </p>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
          {item.linkFile ? (
            <a
              href={item.linkFile}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-blue-600 dark:bg-slate-800 dark:hover:bg-blue-600 text-white text-[11px] font-bold transition-colors"
            >
              <Download size={13} /> Buka / Unduh Berkas
            </a>
          ) : (
            <span className="w-full inline-flex items-center justify-center py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 text-[11px] font-bold cursor-not-allowed">
              Berkas Belum Tersedia
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function AdministrasiPage() {
  const [loading, setLoading] = useState(true);

  // ================= STATE RUANG KERJA (LEMBAGA) =================
  const [activeLembaga, setActiveLembaga] = useState("Komisariat");
  const [listLSO, setListLSO] = useState([]);

  // ================= STATE DATA MASTER =================
  const [masterPersuratan, setMasterPersuratan] = useState([]);
  const [masterProker, setMasterProker] = useState([]);
  const [masterProdukHukum, setMasterProdukHukum] = useState([]);
  const [masterLpj, setMasterLpj] = useState([]);
  const [masterPresentasi, setMasterPresentasi] = useState([]);
  const [masterInventaris, setMasterInventaris] = useState([]);

  // ================= STATE CUSTOM FORM SCHEMA =================
  const [skSchema, setSkSchema] = useState([]);
  const [rtarSchema, setRtarSchema] = useState([]);

  // ================= STATE NAVIGASI & FILTER =================
  const [activeTab, setActiveTab] = useState("persuratan");
  const [activeSuratTab, setActiveSuratTab] = useState("masuk");
  const [activePeriode, setActivePeriode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("auto"); // "auto" | "card" | "table"
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // ================= STATE FORM PENGAJUAN =================
  const [formSKData, setFormSKData] = useState({});
  const [formRTARData, setFormRTARData] = useState({});
  const [isSubmittingSK, setIsSubmittingSK] = useState(false);
  const [isSubmittingRTAR, setIsSubmittingRTAR] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // ================= STATE CUSTOM NOTIFICATION MODAL =================
  const [notifModal, setNotifModal] = useState({ isOpen: false, type: "success", title: "", message: "" });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const params = new URLSearchParams(window.location.search);
        const tabFromUrl = params.get("tab");
        if (tabFromUrl) setActiveTab(tabFromUrl);

        const docRef = doc(db, "website_config", "database_administrasi");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMasterPersuratan(data.masterPersuratan || []);
          setMasterProker(data.listProker || []);
          setMasterProdukHukum(data.listProdukHukum || []);
          setMasterLpj(data.listLpj || []);
          setMasterPresentasi(data.listPresentasi || []);
          setMasterInventaris(data.listInventaris || []);
          setListLSO(data.listLSO || []);
        }

        const schemaRef = doc(db, "website_config", "pengajuan_schema");
        const schemaSnap = await getDoc(schemaRef);
        if (schemaSnap.exists()) {
          const sData = schemaSnap.data();
          setSkSchema(sData.sk || defaultSkSchema);
          setRtarSchema(sData.rtar || defaultRtarSchema);
        } else {
          setSkSchema(defaultSkSchema);
          setRtarSchema(defaultRtarSchema);
        }
      } catch (error) {
        console.error("Gagal menarik database:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const availablePeriods = masterPersuratan.filter(p => (p.lembaga || "Komisariat") === activeLembaga);
  const archivedLembaga = Array.from(new Set([
    ...masterPersuratan.map(p => p.lembaga || "Komisariat"),
    ...masterProker.map(p => p.lembaga || "Komisariat"),
  ])).filter(l => l !== "Komisariat" && l !== "KOPRI" && !listLSO.includes(l));
  const resolvedPeriode = availablePeriods.some(p => p.id === activePeriode)
    ? activePeriode
    : (availablePeriods[0]?.id || "");

  const formatDisplayDate = (dateVal) => {
    if (!dateVal) return "-";
    if (typeof dateVal === "string") {
      const str = dateVal.trim();
      const parts = str.includes("/") ? str.split("/") : str.split("-");
      if (parts.length === 3) {
        if (parts[2].length >= 4) return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[2].substring(0, 4)}`;
        else if (parts[0].length === 4) return `${parts[2].substring(0, 2).padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}`;
      }
    }
    if (!isNaN(dateVal) && Number(dateVal) > 20000) {
      const dObj = new Date(Math.round((Number(dateVal) - 25569) * 86400 * 1000));
      return `${String(dObj.getDate()).padStart(2, "0")}/${String(dObj.getMonth() + 1).padStart(2, "0")}/${dObj.getFullYear()}`;
    }
    const d = new Date(dateVal);
    if (!isNaN(d)) return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    return dateVal;
  };

  const getSortableDate = (dateVal) => {
    if (!dateVal) return 0;
    if (typeof dateVal === "string") {
      const str = dateVal.trim();
      const parts = str.includes("/") ? str.split("/") : str.split("-");
      if (parts.length === 3) {
        if (parts[2].length >= 4) return new Date(`${parts[2].substring(0, 4)}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}T00:00:00`).getTime();
        else if (parts[0].length === 4) return new Date(`${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].substring(0, 2).padStart(2, "0")}T00:00:00`).getTime();
      }
    }
    if (!isNaN(dateVal) && Number(dateVal) > 20000) return new Date(Math.round((Number(dateVal) - 25569) * 86400 * 1000)).getTime();
    const d = new Date(dateVal);
    return isNaN(d) ? 0 : d.getTime();
  };

  const filterByLembaga = (dataArray) => {
    return dataArray.filter(item => (item.lembaga || "Komisariat") === activeLembaga);
  };

  const selectedPeriodData = availablePeriods.find(p => p.id === resolvedPeriode) || availablePeriods[0] || { suratMasuk: [], suratKeluar: [], linkMasuk: "", linkKeluar: "" };

  const baseSuratMasuk = [...(selectedPeriodData.suratMasuk || [])].sort((a, b) => getSortableDate(a.tglDatang) - getSortableDate(b.tglDatang));
  const baseSuratKeluar = [...(selectedPeriodData.suratKeluar || [])].sort((a, b) => {
    const getNum = (str) => {
      const match = (str || "").match(/\d+/);
      return match ? parseInt(match[0], 10) : 999999;
    };
    const numA = getNum(a.nomorSurat);
    const numB = getNum(b.nomorSurat);
    if (numA !== numB) return numA - numB;
    return (a.nomorSurat || "").localeCompare(b.nomorSurat || "");
  });

  const getDriveLink = () => {
    if (activeSuratTab === "masuk") return selectedPeriodData.linkMasuk || "#";
    return selectedPeriodData.linkKeluar || "#";
  };

  const currentProker = filterByLembaga(masterProker);
  const currentProdukHukum = masterProdukHukum;
  const currentLpj = masterLpj;
  const currentPresentasi = masterPresentasi;
  const currentInventaris = masterInventaris;

  const getFilteredData = () => {
    const q = searchQuery.toLowerCase();

    if (activeTab === "persuratan") {
      const targetData = activeSuratTab === "masuk" ? baseSuratMasuk : baseSuratKeluar;
      return targetData.filter(item =>
        (item.nomorSurat || "").toLowerCase().includes(q) ||
        (item.hal || item.perihalSurat || "").toLowerCase().includes(q) ||
        (item.asalSurat || item.tujuanSurat || "").toLowerCase().includes(q)
      );
    } else if (activeTab === "proker") {
      return currentProker.filter(item =>
        (item.namaProker || "").toLowerCase().includes(q) ||
        (item.pelaksanaProker || "").toLowerCase().includes(q) ||
        (item.tujuan || "").toLowerCase().includes(q) ||
        (item.penanggungJawab || "").toLowerCase().includes(q)
      );
    } else if (activeTab === "produkhukum") {
      return currentProdukHukum.filter(item =>
        (item.nomorSK || "").toLowerCase().includes(q) ||
        (item.tentangHukum || "").toLowerCase().includes(q) ||
        (item.deskripsiHukum || "").toLowerCase().includes(q)
      );
    } else if (activeTab === "laporan") {
      return currentLpj.filter(item =>
        (item.namaLaporan || "").toLowerCase().includes(q) ||
        (item.periode || "").toLowerCase().includes(q) ||
        (item.deskripsiLaporan || "").toLowerCase().includes(q)
      );
    } else if (activeTab === "presentasi") {
      return currentPresentasi.filter(item =>
        (item.judul || "").toLowerCase().includes(q) ||
        (item.deskripsi || "").toLowerCase().includes(q) ||
        (item.tipeDokumen || "").toLowerCase().includes(q)
      );
    } else if (activeTab === "inventaris") {
      return currentInventaris.filter(item =>
        (item.namaBarang || "").toLowerCase().includes(q) ||
        (item.kondisi || "").toLowerCase().includes(q) ||
        (item.deskripsi || "").toLowerCase().includes(q)
      );
    }
    return [];
  };

  const currentListData = getFilteredData();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery("");
    setCurrentPage(1);
    window.history.pushState(null, "", `?tab=${tab}`);
  };

  const handleSuratTabChange = (tab) => {
    setActiveSuratTab(tab);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleLembagaChange = (val) => {
    setActiveLembaga(val);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleCopyText = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const totalPages = Math.ceil(currentListData.length / ITEMS_PER_PAGE);
  const paginatedSuratData = activeTab === "persuratan"
    ? currentListData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
    : currentListData;

  const handleExportExcel = () => {
    if (currentListData.length === 0) {
      return setNotifModal({
        isOpen: true,
        type: "error",
        title: "Data Kosong",
        message: "Tidak ada data arsip pada kategori ini untuk diekspor."
      });
    }

    let formattedData = [];
    if (activeTab === "persuratan") {
      formattedData = currentListData.map((item, idx) => ({
        "No": idx + 1,
        "Nomor Surat": item.nomorSurat || "-",
        [activeSuratTab === "masuk" ? "Asal Surat" : "Tujuan Surat"]: activeSuratTab === "masuk" ? (item.asalSurat || "-") : (item.tujuanSurat || "-"),
        "Tanggal Buat": formatDisplayDate(item.tglBuat),
        [activeSuratTab === "masuk" ? "Tanggal Datang" : "Tanggal Kirim"]: activeSuratTab === "masuk" ? formatDisplayDate(item.tglDatang) : formatDisplayDate(item.tglKirim),
        "Perihal": item.hal || item.perihalSurat || "-",
        "Keterangan": item.ket || item.deskripsiSurat || "-"
      }));
    } else if (activeTab === "proker") {
      formattedData = currentListData.map((item, idx) => ({
        "No": idx + 1,
        "Biro/Pelaksana": item.pelaksanaProker || "-",
        "Nama Kegiatan": item.namaProker || "-",
        "Tujuan": item.tujuan || "-",
        "Indikator": item.indikator || "-",
        "Sasaran": item.sasaran || "-",
        "Waktu Pelaksanaan": formatDisplayDate(item.waktuPelaksanaan),
        "Penanggung Jawab": item.penanggungJawab || "-",
        "Estimasi Dana": item.estimasiDana || "-"
      }));
    } else if (activeTab === "presentasi") {
      formattedData = currentListData.map((item, idx) => ({
        "No": idx + 1,
        "Judul Dokumen": item.judul || "-",
        "Tipe Dokumen": item.tipeDokumen || "Presentasi",
        "Deskripsi": item.deskripsi || "-",
        "Link Unduh": item.downloadUrl || "Tidak Ada"
      }));
    } else if (activeTab === "inventaris") {
      formattedData = currentListData.map((item, idx) => ({
        "No": idx + 1,
        "Nama Barang": item.namaBarang || "-",
        "Jumlah": item.jumlah || "0",
        "Kondisi": item.kondisi || "-",
        "Deskripsi": item.deskripsi || "-"
      }));
    } else {
      formattedData = currentListData.map((item, idx) => ({
        "No": idx + 1,
        "Judul/Ketetapan": item.tentangHukum || item.namaLaporan || "-",
        "Nomor/Periode": item.nomorSK || item.periode || "-",
        "Deskripsi Singkat": item.deskripsiHukum || item.deskripsiLaporan || "-"
      }));
    }

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data_Arsip");
    XLSX.writeFile(wb, getExportFilename(activeTab, activeLembaga));
  };

  const handleFileUpload = async (e, fieldId, setFormData, formData) => {
    const file = e.target.files[0];
    if (!file) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return setNotifModal({ isOpen: true, type: "error", title: "Error Konfigurasi", message: "Konfigurasi Cloudinary di server belum lengkap!" });
    }

    setIsUploadingFile(true);
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("upload_preset", uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: "POST",
        body: uploadData
      });
      const data = await res.json();

      if (data.secure_url) {
        setFormData({ ...formData, [fieldId]: data.secure_url.replace("/upload/", "/upload/q_auto,f_auto/") });
      }
    } catch (err) {
      setNotifModal({ isOpen: true, type: "error", title: "Gagal Mengunggah", message: `Gagal mengunggah file ${file.name}. Pastikan koneksi stabil.` });
    } finally {
      setIsUploadingFile(false);
    }
  };

  // ================= SUBMIT PENGAJUAN (DINAMIS) =================
  const handleSubmitSK = async (e) => {
    e.preventDefault();
    if (isUploadingFile) return setNotifModal({ isOpen: true, type: "error", title: "Harap Tunggu", message: "File sedang diunggah. Mohon tunggu sesaat." });

    setIsSubmittingSK(true);
    try {
      await addDoc(collection(db, "pengajuan_sk"), {
        dataForm: formSKData,
        email: formSKData.email || "",
        status: "Diproses",
        createdAt: new Date().toISOString()
      });
      setNotifModal({ isOpen: true, type: "success", title: "Berhasil Terkirim!", message: "Pengajuan Surat Rekomendasi SK berhasil dikirim. Silakan tunggu konfirmasi yang akan dikirimkan otomatis ke email Anda." });
      setFormSKData({});
    } catch (err) {
      setNotifModal({ isOpen: true, type: "error", title: "Pengajuan Gagal", message: "Terjadi kesalahan sistem saat mengirim: " + err.message });
    } finally {
      setIsSubmittingSK(false);
    }
  };

  const handleSubmitRTAR = async (e) => {
    e.preventDefault();
    if (isUploadingFile) return setNotifModal({ isOpen: true, type: "error", title: "Harap Tunggu", message: "File sedang diunggah. Mohon tunggu sesaat." });

    setIsSubmittingRTAR(true);
    try {
      await addDoc(collection(db, "pengajuan_rtar"), {
        dataForm: formRTARData,
        email: formRTARData.email || "",
        status: "Diproses",
        createdAt: new Date().toISOString()
      });
      setNotifModal({ isOpen: true, type: "success", title: "Berhasil Terkirim!", message: "Pengajuan Kegiatan RTAR berhasil dikirim. Silakan tunggu konfirmasi dari Admin melalui email." });
      setFormRTARData({});
    } catch (err) {
      setNotifModal({ isOpen: true, type: "error", title: "Pengajuan Gagal", message: "Terjadi kesalahan sistem saat mengirim: " + err.message });
    } finally {
      setIsSubmittingRTAR(false);
    }
  };

  const inputCustomClass = "w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium";
  const labelCustomClass = "text-xs sm:text-[13px] font-bold text-slate-700 dark:text-slate-200 block mb-2 uppercase tracking-wider";

  const renderDynamicForm = (schema, formData, setFormData) => {
    return schema.map((field, idx) => {
      const isFullWidth = field.type === "textarea" || field.type === "url" || field.label.length > 35;

      return (
        <div key={idx} className={isFullWidth ? "col-span-1 sm:col-span-2" : "col-span-1"}>
          <label className={labelCustomClass}>
            {field.label} {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>

          {field.type === "textarea" ? (
            <textarea
              required={field.required}
              placeholder={field.placeholder}
              value={formData[field.id] || ""}
              onChange={e => setFormData({ ...formData, [field.id]: e.target.value })}
              className={inputCustomClass}
              rows="4"
            />
          ) : field.type === "file" || field.type === "image" ? (
            <div className="relative">
              <input
                type="file"
                accept={field.type === "image" ? "image/*" : ".pdf,.doc,.docx"}
                required={field.required && !formData[field.id]}
                onChange={(e) => handleFileUpload(e, field.id, setFormData, formData)}
                className={`w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/70 dark:bg-slate-900 ${isUploadingFile ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isUploadingFile}
              />
              {isUploadingFile && (
                <p className="mt-2 text-xs text-blue-600 flex items-center gap-1.5 font-semibold animate-pulse">
                  <Loader2 size={13} className="animate-spin" /> Mengunggah Berkas...
                </p>
              )}
              {formData[field.id] && !isUploadingFile && (
                <p className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                  <CheckCircle size={14} /> Berkas berhasil dilampirkan:{" "}
                  <a href={formData[field.id]} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-800">
                    Lihat File
                  </a>
                </p>
              )}
            </div>
          ) : (
            <input
              type={field.type}
              required={field.required}
              placeholder={field.placeholder}
              value={formData[field.id] || ""}
              onChange={e => setFormData({ ...formData, [field.id]: e.target.value })}
              className={inputCustomClass}
            />
          )}
        </div>
      );
    });
  };

  if (loading) return <LoadingScreen text="Memuat Sistem Arsip & Administrasi" />;

  const totalLettersCount = baseSuratMasuk.length + baseSuratKeluar.length;

  const navTabs = [
    { id: "persuratan", label: "Arsip Persuratan", shortLabel: "Persuratan", icon: Mail, count: totalLettersCount, group: "arsip" },
    { id: "proker", label: "Program Kerja", shortLabel: "Proker", icon: Briefcase, count: currentProker.length, group: "arsip" },
    { id: "produkhukum", label: "Produk Hukum", shortLabel: "Produk Hukum", icon: Scale, count: currentProdukHukum.length, group: "arsip" },
    { id: "laporan", label: "Laporan (LPJ)", shortLabel: "Laporan LPJ", icon: FileCheck, count: currentLpj.length, group: "arsip" },
    { id: "presentasi", label: "Presentasi & Dok", shortLabel: "Presentasi", icon: MonitorPlay, count: currentPresentasi.length, group: "arsip" },
    { id: "inventaris", label: "Inventaris Barang", shortLabel: "Inventaris", icon: Package, count: currentInventaris.length, group: "arsip" },
    { id: "pengajuan-sk", label: "Pengajuan Rekom SK", shortLabel: "Pengajuan SK", icon: FileSignature, count: null, group: "layanan" },
    { id: "pengajuan-rtar", label: "Pengajuan RTAR", shortLabel: "Pengajuan RTAR", icon: Users, count: null, group: "layanan" },
  ];

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] font-sans text-slate-900 dark:text-slate-100 w-full overflow-x-hidden flex flex-col transition-colors duration-300">
      <Navbar />

      {/* ================= HERO SECTION INSTITUSIONAL ================= */}
      <section className="relative pt-28 md:pt-32 pb-16 md:pb-20 px-4 sm:px-6 bg-[#020617] text-white overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-35 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-[#facc15] to-blue-600" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono font-bold uppercase tracking-widest text-[#facc15] mb-4">
                <FolderArchive size={14} className="text-[#facc15]" />
                <span>BIROKRASI & TATA KELOLA ORGANISASI</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.12] mb-4">
                Arsip Digital
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                Satu pintu transparansi administrasi PK. PMII Sunan Ampel Malang — mencakup registrasi surat masuk/keluar, matriks program kerja, produk hukum, LPJ, inventaris barang, hingga pengajuan surat rekomendasi SK & RTAR.
              </p>
            </div>

            {/* Live Telemetry Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Arsip Surat</p>
                <p className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">{totalLettersCount}</p>
                <p className="text-[10px] text-blue-400 font-semibold mt-0.5">{activeLembaga}</p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Program Kerja</p>
                <p className="text-xl sm:text-2xl font-black text-[#facc15] font-mono mt-0.5">{currentProker.length}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Agenda Terdaftar</p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Dokumen & SK</p>
                <p className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">{currentProdukHukum.length + currentLpj.length}</p>
                <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">Hukum & LPJ</p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Aset Inventaris</p>
                <p className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">{currentInventaris.length}</p>
                <p className="text-[10px] text-amber-400 font-semibold mt-0.5">Siap Dipinjam</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CONTROL & NAVIGATION DECK ================= */}
      <section className="px-4 sm:px-6 max-w-7xl mx-auto w-full -mt-7 relative z-20 space-y-3.5">
        {/* TABS NAVIGATION BAR */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-lg flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {navTabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            const isLayanan = t.group === "layanan";
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? isLayanan
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-[#020617] dark:bg-blue-600 text-white shadow-sm"
                    : isLayanan
                    ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100/80 border border-emerald-200/60 dark:border-emerald-900/50"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon size={15} className={isActive ? (isLayanan ? "text-white" : "text-[#facc15]") : ""} />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.shortLabel}</span>
                {t.count !== null && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? "bg-white/15 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* WORKSPACE BAR: LEMBAGA, PERIODE, & PENCARIAN */}
        {(activeTab !== "pengajuan-sk" && activeTab !== "pengajuan-rtar") && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
            {/* Row 1: Lembaga & Periode (Khusus Persuratan & Proker) */}
            {(activeTab === "persuratan" || activeTab === "proker") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-3.5 py-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Building2 size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Ruang Kerja Lembaga
                    </label>
                    <select
                      value={activeLembaga}
                      onChange={(e) => handleLembagaChange(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer truncate"
                    >
                      <option value="Komisariat" className="text-slate-900">Administrasi Komisariat</option>
                      <option value="KOPRI" className="text-slate-900">Administrasi KOPRI</option>
                      {listLSO.length > 0 && (
                        <optgroup label="LSO Aktif" className="text-slate-900">
                          {listLSO.map((lso, index) => (
                            <option key={index} value={lso} className="text-slate-900">Administrasi {lso}</option>
                          ))}
                        </optgroup>
                      )}
                      {archivedLembaga.length > 0 && (
                        <optgroup label="Arsip LSO Periode Lalu" className="text-slate-900">
                          {archivedLembaga.map((lso) => (
                            <option key={lso} value={lso} className="text-slate-900">Administrasi {lso}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </div>

                {activeTab === "persuratan" && (
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-3.5 py-2.5">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <CalendarDays size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        Periode Kepengurusan
                      </label>
                      <select
                        value={resolvedPeriode}
                        onChange={(e) => { setActivePeriode(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer truncate"
                      >
                        {availablePeriods.length > 0 ? (
                          availablePeriods.map(p => (
                            <option key={p.id} value={p.id} className="text-slate-900">{p.periode}</option>
                          ))
                        ) : (
                          <option value="" className="text-slate-900">Belum Ada Data Periode</option>
                        )}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Row 2: Search Input + Sub-actions */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder={
                    activeTab === "persuratan"
                      ? "Cari nomor surat, perihal, asal atau tujuan surat..."
                      : activeTab === "proker"
                      ? "Cari nama kegiatan, biro/LSO pelaksana, atau PJ..."
                      : activeTab === "presentasi"
                      ? "Cari judul materi presentasi atau tipe dokumen..."
                      : activeTab === "inventaris"
                      ? "Cari nama barang inventaris atau kondisi..."
                      : activeTab === "produkhukum"
                      ? "Cari nomor SK atau tentang ketetapan hukum..."
                      : "Cari judul laporan LPJ atau periode..."
                  }
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {activeTab === "persuratan" && (
                  <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
                    <button
                      onClick={() => handleSuratTabChange("masuk")}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeSuratTab === "masuk"
                          ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      <Inbox size={14} /> Masuk ({baseSuratMasuk.length})
                    </button>
                    <button
                      onClick={() => handleSuratTabChange("keluar")}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeSuratTab === "keluar"
                          ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      <Send size={14} /> Keluar ({baseSuratKeluar.length})
                    </button>
                  </div>
                )}

                {/* View Mode Toggle for Persuratan & Proker */}
                {(activeTab === "persuratan" || activeTab === "proker") && (
                  <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setViewMode("card")}
                      title="Tampilan Kartu (Ramah HP)"
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                        viewMode === "card"
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <LayoutGrid size={14} /> <span className="hidden xl:inline">Kartu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("table")}
                      title="Tampilan Tabel"
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                        viewMode === "table"
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <List size={14} /> <span className="hidden xl:inline">Tabel</span>
                    </button>
                  </div>
                )}

                {activeTab === "persuratan" && (
                  <a
                    href={getDriveLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      getDriveLink() !== "#"
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed pointer-events-none"
                    }`}
                  >
                    <FolderArchive size={14} /> Folder Drive
                  </a>
                )}

                <button
                  onClick={handleExportExcel}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
                >
                  <FileSpreadsheet size={14} /> Export Excel
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ================= MAIN CONTENT AREA ================= */}
      <section className="pb-24 px-4 sm:px-6 max-w-7xl mx-auto w-full flex-grow mt-6">
        {(activeTab !== "pengajuan-sk" && activeTab !== "pengajuan-rtar") && currentListData.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 sm:p-16 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <FileText size={28} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base sm:text-lg">
              Arsip Belum Tersedia
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Belum ada data untuk kategori ini pada ruang kerja <strong>{activeLembaga}</strong>, atau kata kunci pencarian tidak ditemukan.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeLembaga}-${activeTab}-${activeSuratTab}-${activePeriode}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {/* ================= SUB 1: PERSURATAN ================= */}
              {activeTab === "persuratan" && (
                <div className="space-y-4">
                  {/* Ledger Header Strip */}
                  <div className="bg-[#020617] text-white px-4 sm:px-6 py-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#facc15]" />
                      <h3 className="font-mono font-bold text-xs sm:text-sm uppercase tracking-wider">
                        {activeSuratTab === "masuk" ? "REGISTRASI SURAT MASUK" : "REGISTRASI SURAT KELUAR"} — {activeLembaga}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
                      <span>Total: <strong className="text-[#facc15]">{currentListData.length}</strong> surat</span>
                      <span className="text-slate-600">|</span>
                      <span>Hal. {currentPage}/{totalPages || 1}</span>
                    </div>
                  </div>

                  {/* MOBILE / CARD VIEW (Default on < md, or when viewMode === 'card') */}
                  <div className={`${viewMode === "table" ? "hidden" : viewMode === "card" ? "grid" : "grid md:hidden"} grid-cols-1 sm:grid-cols-2 gap-3`}>
                    {paginatedSuratData.map((docItem, index) => {
                      const realNumber = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                      const cardId = docItem.id || `surat-${realNumber}`;
                      return (
                        <div
                          key={cardId}
                          onClick={() => setSelectedDetailItem({ type: "surat", data: docItem, nomorUrut: realNumber })}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-blue-500/50 transition-all cursor-pointer flex flex-col justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2.5">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 border border-blue-200/70 dark:border-blue-900 px-2.5 py-1 rounded-lg break-all">
                                #{realNumber} • {docItem.nomorSurat || "Tanpa Nomor"}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyText(docItem.nomorSurat, cardId);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                                title="Salin Nomor Surat"
                              >
                                {copiedId === cardId ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                              </button>
                            </div>

                            <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug mb-1.5">
                              {docItem.hal || docItem.perihalSurat || "Tanpa Perihal"}
                            </h4>

                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                                {activeSuratTab === "masuk" ? "Dari:" : "Kepada:"}
                              </span>
                              <span className="truncate">{activeSuratTab === "masuk" ? (docItem.asalSurat || "-") : (docItem.tujuanSurat || "-")}</span>
                            </p>

                            {(docItem.ket || docItem.deskripsiSurat) && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                {docItem.ket || docItem.deskripsiSurat}
                              </p>
                            )}
                          </div>

                          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            <span>Buat: <strong className="text-slate-700 dark:text-slate-300">{formatDisplayDate(docItem.tglBuat)}</strong></span>
                            <span>
                              {activeSuratTab === "masuk" ? "Terima: " : "Kirim: "}
                              <strong className="text-emerald-600 dark:text-emerald-400">
                                {activeSuratTab === "masuk" ? formatDisplayDate(docItem.tglDatang) : formatDisplayDate(docItem.tglKirim)}
                              </strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* DESKTOP / TABLE VIEW (Default on md+, or when viewMode === 'table') */}
                  <div className={`${viewMode === "card" ? "hidden" : viewMode === "table" ? "block" : "hidden md:block"} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[1040px]">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <th className="py-3.5 px-4 w-12 text-center font-bold">No</th>
                            <th className="py-3.5 px-4 w-[310px] font-bold whitespace-nowrap">Nomor Surat</th>
                            <th className="py-3.5 px-4 w-60 font-bold">{activeSuratTab === "masuk" ? "Asal Surat" : "Tujuan Surat"}</th>
                            <th className="py-3.5 px-3 w-28 text-center font-bold whitespace-nowrap">Tgl Buat</th>
                            <th className="py-3.5 px-3 w-28 text-center font-bold whitespace-nowrap">{activeSuratTab === "masuk" ? "Tgl Terima" : "Tgl Kirim"}</th>
                            <th className="py-3.5 px-3 w-32 text-center font-bold whitespace-nowrap">Perihal / Hal</th>
                            <th className="py-3.5 px-4 min-w-[180px] font-bold">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                          {paginatedSuratData.map((docItem, index) => {
                            const realNumber = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                            const rowId = docItem.id || `row-${realNumber}`;
                            return (
                              <tr
                                key={rowId}
                                onClick={() => setSelectedDetailItem({ type: "surat", data: docItem, nomorUrut: realNumber })}
                                className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                              >
                                <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">{realNumber}</td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded border border-blue-200/60 dark:border-blue-900 whitespace-nowrap">
                                      {docItem.nomorSurat || "-"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyText(docItem.nomorSurat, rowId);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-blue-600 transition-opacity"
                                      title="Salin Nomor Surat"
                                    >
                                      {copiedId === rowId ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                                    </button>
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-200 text-xs">
                                  {activeSuratTab === "masuk" ? (docItem.asalSurat || "-") : (docItem.tujuanSurat || "-")}
                                </td>
                                <td className="py-3 px-3 text-center font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                  {formatDisplayDate(docItem.tglBuat)}
                                </td>
                                <td className="py-3 px-3 text-center font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                  {activeSuratTab === "masuk" ? formatDisplayDate(docItem.tglDatang) : formatDisplayDate(docItem.tglKirim)}
                                </td>
                                <td className="py-3 px-3 text-center whitespace-nowrap">
                                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                                    {docItem.hal || docItem.perihalSurat || "-"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                                  {docItem.ket || docItem.deskripsiSurat || "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-wrap justify-between items-center gap-2">
                      <span className="text-xs font-mono text-slate-500 px-2">
                        Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, currentListData.length)} dari {currentListData.length} surat
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => prev - 1)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white disabled:opacity-40 transition"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                          <button
                            key={num}
                            onClick={() => setCurrentPage(num)}
                            className={`w-8 h-8 rounded-xl text-xs font-mono font-bold transition-colors ${
                              currentPage === num
                                ? "bg-[#020617] dark:bg-blue-600 text-[#facc15] dark:text-white shadow-sm"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white disabled:opacity-40 transition"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ================= SUB 2: PROGRAM KERJA ================= */}
              {activeTab === "proker" && (
                <div className="space-y-6">
                  {(() => {
                    const groupedProker = currentListData.reduce((acc, curr) => {
                      const biro = curr.pelaksanaProker || "Biro / LSO Umum";
                      if (!acc[biro]) acc[biro] = [];
                      acc[biro].push(curr);
                      return acc;
                    }, {});

                    return Object.keys(groupedProker).map((biroName, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-[#020617] px-5 py-3.5 text-white flex items-center justify-between gap-2 border-b border-slate-800">
                          <div className="flex items-center gap-2.5">
                            <Briefcase size={17} className="text-[#facc15]" />
                            <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider">{biroName}</h3>
                          </div>
                          <span className="text-[11px] font-mono text-[#facc15] bg-white/10 px-2.5 py-0.5 rounded-md">
                            {groupedProker[biroName].length} Program
                          </span>
                        </div>

                        {/* MOBILE / CARD VIEW FOR PROKER */}
                        <div className={`${viewMode === "table" ? "hidden" : viewMode === "card" ? "grid" : "grid lg:hidden"} grid-cols-1 md:grid-cols-2 gap-3 p-4`}>
                          {groupedProker[biroName].map((docItem, docIdx) => (
                            <div
                              key={docIdx}
                              className="bg-slate-50/70 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-600/10 text-blue-600 dark:text-blue-400">
                                    PROKER #{docIdx + 1}
                                  </span>
                                  <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-900">
                                    {docItem.estimasiDana || "Rp -"}
                                  </span>
                                </div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-2">
                                  {docItem.namaProker || "-"}
                                </h4>

                                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                                  {docItem.tujuan && (
                                    <p><strong className="text-slate-800 dark:text-slate-200">Tujuan:</strong> {docItem.tujuan}</p>
                                  )}
                                  {docItem.indikator && (
                                    <p><strong className="text-slate-800 dark:text-slate-200">Indikator:</strong> {docItem.indikator}</p>
                                  )}
                                  {docItem.sasaran && (
                                    <p><strong className="text-slate-800 dark:text-slate-200">Sasaran:</strong> {docItem.sasaran}</p>
                                  )}
                                </div>
                              </div>

                              <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div>
                                  <p className="text-[11px] text-slate-500">
                                    PJ: <strong className="text-slate-800 dark:text-slate-200">{docItem.penanggungJawab || "-"}</strong>
                                  </p>
                                  <p className="text-[11px] font-mono text-slate-400">
                                    Waktu: {formatDisplayDate(docItem.waktuPelaksanaan)}
                                  </p>
                                </div>
                                {docItem.linkFile ? (
                                  <a
                                    href={docItem.linkFile}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] transition"
                                  >
                                    <ExternalLink size={12} /> Berkas
                                  </a>
                                ) : (
                                  <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-500 font-bold">
                                    Tanpa Berkas
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* DESKTOP TABLE VIEW FOR PROKER */}
                        <div className={`${viewMode === "card" ? "hidden" : viewMode === "table" ? "block" : "hidden lg:block"} overflow-x-auto`}>
                          <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-mono uppercase tracking-wider">
                                <th className="py-3 px-3 w-12 text-center font-bold">No</th>
                                <th className="py-3 px-4 w-52 font-bold">Nama Kegiatan</th>
                                <th className="py-3 px-4 w-52 font-bold">Tujuan</th>
                                <th className="py-3 px-4 w-44 font-bold">Indikator</th>
                                <th className="py-3 px-4 w-36 font-bold">Sasaran</th>
                                <th className="py-3 px-4 w-32 text-center font-bold">Pelaksanaan</th>
                                <th className="py-3 px-4 w-36 font-bold">PJ</th>
                                <th className="py-3 px-4 w-32 text-center font-bold">Estimasi Dana</th>
                                <th className="py-3 px-4 w-24 text-center font-bold">Berkas</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                              {groupedProker[biroName].map((docItem, docIdx) => (
                                <tr key={docIdx} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition-colors">
                                  <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-400">{docIdx + 1}</td>
                                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 leading-relaxed">{docItem.namaProker || "-"}</td>
                                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 leading-relaxed">{docItem.tujuan || "-"}</td>
                                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 leading-relaxed">{docItem.indikator || "-"}</td>
                                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 leading-relaxed">{docItem.sasaran || "-"}</td>
                                  <td className="py-3.5 px-4 text-center font-mono text-slate-600 dark:text-slate-400">{formatDisplayDate(docItem.waktuPelaksanaan)}</td>
                                  <td className="py-3.5 px-4 font-semibold text-blue-700 dark:text-blue-400">{docItem.penanggungJawab || "-"}</td>
                                  <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">{docItem.estimasiDana || "-"}</td>
                                  <td className="py-3.5 px-4 text-center">
                                    {docItem.linkFile ? (
                                      <a
                                        href={docItem.linkFile}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-1 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg transition text-[10px] uppercase tracking-wider"
                                      >
                                        <ExternalLink size={12} /> Buka
                                      </a>
                                    ) : (
                                      <span className="text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase block text-center font-bold">
                                        Kosong
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* ================= SUB 3: PRODUK HUKUM ================= */}
              {activeTab === "produkhukum" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5">
                  {currentListData.map((docItem, index) => (
                    <DocumentCard key={index} item={docItem} isHukum={true} />
                  ))}
                </div>
              )}

              {/* ================= SUB 4: LAPORAN KEPENGURUSAN ================= */}
              {activeTab === "laporan" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5">
                  {currentListData.map((docItem, index) => (
                    <DocumentCard key={index} item={docItem} isHukum={false} />
                  ))}
                </div>
              )}

              {/* ================= SUB 5: PRESENTASI & DOKUMEN ================= */}
              {activeTab === "presentasi" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {currentListData.map((docItem, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg hover:border-blue-500/40 transition-all flex flex-col group"
                    >
                      <Link
                        href={`/administrasi/dokumen/${docItem.id}`}
                        className="relative w-full pt-[52%] bg-[#020617] border-b border-slate-800 flex items-center justify-center overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-40" />
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-[#facc15] group-hover:scale-110 group-hover:border-[#facc15] transition-all">
                            <MonitorPlay size={28} />
                          </div>
                          <span className="mt-2.5 text-[10px] font-mono uppercase tracking-widest text-slate-300">
                            KLIK UNTUK PRATINJAU INTERAKTIF
                          </span>
                        </div>
                        <div className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-md">
                          {docItem.tipeDokumen || "Presentasi"}
                        </div>
                      </Link>

                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          <Link href={`/administrasi/dokumen/${docItem.id}`}>{docItem.judul}</Link>
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm line-clamp-3 flex-1 mb-4 whitespace-pre-wrap">
                          {docItem.deskripsi || "Materi presentasi dan dokumen kaderisasi."}
                        </p>
                        <div className="grid grid-cols-2 gap-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-800 mt-auto">
                          <Link
                            href={`/administrasi/dokumen/${docItem.id}`}
                            className="bg-slate-900 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Eye size={14} /> Buka Slide
                          </Link>
                          {docItem.downloadUrl ? (
                            <a
                              href={docItem.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Download size={14} /> Unduh File
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                window.open(
                                  `https://wa.me/?text=${encodeURIComponent(
                                    "Lihat Dokumen PMII: " + docItem.judul + "\n" + window.location.origin + "/administrasi/dokumen/" + docItem.id
                                  )}`,
                                  "_blank"
                                )
                              }
                              className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-emerald-200/60 dark:border-emerald-900"
                            >
                              <Share2 size={14} /> Bagikan
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ================= SUB 6: INVENTARIS ================= */}
              {activeTab === "inventaris" && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
                  {currentListData.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg hover:border-blue-500/40 transition-all flex flex-col group"
                    >
                      <div className="relative w-full pt-[72%] bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 overflow-hidden">
                        {item.fotoGroup && item.fotoGroup[0] ? (
                          <Image
                            src={item.fotoGroup[0]}
                            alt={item.namaBarang}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 50vw, 25vw"
                          />
                        ) : (
                          <Package size={36} className="absolute inset-0 m-auto text-slate-300 dark:text-slate-600" />
                        )}
                        <span
                          className={`absolute top-2.5 left-2.5 text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-sm border ${
                            item.kondisi === "Baik"
                              ? "bg-emerald-950/90 text-emerald-300 border-emerald-700"
                              : item.kondisi === "Rusak Ringan"
                              ? "bg-amber-950/90 text-amber-300 border-amber-700"
                              : "bg-red-950/90 text-red-300 border-red-700"
                          }`}
                        >
                          {item.kondisi || "Baik"}
                        </span>
                        <span className="absolute bottom-2.5 right-2.5 bg-[#020617]/90 text-[#facc15] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md border border-white/10">
                          Stok: {item.jumlah} Unit
                        </span>
                      </div>

                      <div className="p-3.5 sm:p-5 flex flex-col flex-1">
                        <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug mb-1.5">
                          {item.namaBarang}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs line-clamp-2 sm:line-clamp-3 flex-1 mb-4 leading-relaxed whitespace-pre-wrap">
                          {item.deskripsi || "Inventaris aset kepengurusan PMII."}
                        </p>

                        <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                          <Link
                            href={`/administrasi/inventaris/${item.id}?tab=foto`}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] sm:text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                          >
                            <Camera size={13} /> Detail
                          </Link>
                          <Link
                            href={`/administrasi/inventaris/${item.id}?tab=pengajuan`}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] sm:text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm"
                          >
                            <FileText size={13} /> Pinjam
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ================= SUB 7: FORM PENGAJUAN SK ================= */}
              {activeTab === "pengajuan-sk" && (
                <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="bg-[#020617] p-6 sm:p-8 text-white border-b border-slate-800">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-widest mb-3">
                      <ShieldCheck size={14} /> LAYANAN REKOMENDASI ADMINISTRASI
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
                      Pengajuan Surat Rekomendasi SK Kepengurusan
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-2xl">
                      Lengkapi formulir permohonan Surat Rekomendasi SK di bawah ini. Notifikasi persetujuan (ACC) beserta tautan surat balasan akan dikirimkan otomatis ke alamat email pemohon.
                    </p>
                  </div>

                  <form onSubmit={handleSubmitSK} className="p-6 sm:p-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                      {renderDynamicForm(skSchema, formSKData, setFormSKData)}
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="submit"
                        disabled={isSubmittingSK || isUploadingFile}
                        className={`w-full font-bold text-sm py-3.5 px-6 rounded-xl transition-all flex justify-center items-center gap-2 ${
                          isSubmittingSK || isUploadingFile
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        }`}
                      >
                        {isSubmittingSK ? (
                          <>
                            <Loader2 size={18} className="animate-spin" /> Mengirim Permohonan SK...
                          </>
                        ) : (
                          <>
                            <Send size={17} /> Kirim Pengajuan Surat Rekomendasi SK
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ================= SUB 8: FORM PENGAJUAN RTAR ================= */}
              {activeTab === "pengajuan-rtar" && (
                <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="bg-[#020617] p-6 sm:p-8 text-white border-b border-slate-800">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-[#facc15] text-[10px] font-mono font-bold uppercase tracking-widest mb-3">
                      <Users size={14} /> PERMOHONAN KEGIATAN RAYON
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
                      Pengajuan Penyelenggaraan RTAR
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-2xl">
                      Silakan lengkapi formulir pendaftaran jadwal dan berkas penyelenggaraan Rapat Tahunan Anggota Rayon (RTAR).
                    </p>
                  </div>

                  <form onSubmit={handleSubmitRTAR} className="p-6 sm:p-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                      {renderDynamicForm(rtarSchema, formRTARData, setFormRTARData)}
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="submit"
                        disabled={isSubmittingRTAR || isUploadingFile}
                        className={`w-full font-bold text-sm py-3.5 px-6 rounded-xl transition-all flex justify-center items-center gap-2 ${
                          isSubmittingRTAR || isUploadingFile
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        }`}
                      >
                        {isSubmittingRTAR ? (
                          <>
                            <Loader2 size={18} className="animate-spin" /> Mengirim Pengajuan RTAR...
                          </>
                        ) : (
                          <>
                            <Send size={17} /> Kirim Pengajuan RTAR
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {/* ================= MODAL DETAIL SURAT (UNTUK HP / KLIK BARIS) ================= */}
      <AnimatePresence>
        {selectedDetailItem && selectedDetailItem.type === "surat" && (
          <div
            onClick={() => setSelectedDetailItem(null)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="bg-[#020617] text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#facc15] block">
                    DETAIL ARSIP SURAT #{selectedDetailItem.nomorUrut}
                  </span>
                  <h3 className="font-bold text-sm sm:text-base mt-0.5">
                    {activeSuratTab === "masuk" ? "Surat Masuk" : "Surat Keluar"} • {activeLembaga}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDetailItem(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs sm:text-sm">
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Nomor Surat</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 break-all">
                      {selectedDetailItem.data.nomorSurat || "-"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(selectedDetailItem.data.nomorSurat, "modal-copy")}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0"
                  >
                    {copiedId === "modal-copy" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    {copiedId === "modal-copy" ? "Tersalin" : "Salin"}
                  </button>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Perihal / Hal Surat</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    {selectedDetailItem.data.hal || selectedDetailItem.data.perihalSurat || "-"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Tanggal Pembuatan</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {formatDisplayDate(selectedDetailItem.data.tglBuat)}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      {activeSuratTab === "masuk" ? "Tanggal Diterima" : "Tanggal Dikirim"}
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      {activeSuratTab === "masuk"
                        ? formatDisplayDate(selectedDetailItem.data.tglDatang)
                        : formatDisplayDate(selectedDetailItem.data.tglKirim)}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    {activeSuratTab === "masuk" ? "Asal / Pengirim Surat" : "Tujuan / Penerima Surat"}
                  </span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {activeSuratTab === "masuk"
                      ? (selectedDetailItem.data.asalSurat || "-")
                      : (selectedDetailItem.data.tujuanSurat || "-")}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Keterangan Tambahan</span>
                  <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {selectedDetailItem.data.ket || selectedDetailItem.data.deskripsiSurat || "Tidak ada keterangan tambahan."}
                  </p>
                </div>
              </div>

              <div className="px-5 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                {getDriveLink() !== "#" ? (
                  <a
                    href={getDriveLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                  >
                    <FolderArchive size={14} /> Buka Folder Arsip Drive <ArrowUpRight size={13} />
                  </a>
                ) : <span />}
                <button
                  onClick={() => setSelectedDetailItem(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= CUSTOM MODAL NOTIFICATION ================= */}
      <AnimatePresence>
        {notifModal.isOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-6 sm:p-8"
            >
              <div
                className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                  notifModal.type === "success"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}
              >
                {notifModal.type === "success" ? <CheckCircle size={28} /> : <XCircle size={28} />}
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{notifModal.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">
                {notifModal.message}
              </p>
              <button
                onClick={() => setNotifModal({ isOpen: false, type: "success", title: "", message: "" })}
                className={`w-full py-3 font-bold text-xs sm:text-sm rounded-xl text-white transition-all ${
                  notifModal.type === "success" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Mengerti
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
