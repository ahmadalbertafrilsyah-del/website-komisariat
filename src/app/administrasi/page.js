// app/administrasi/page.js
"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { Search, Download, FolderArchive, Mail, Briefcase, Scale, FileText, FileCheck, ExternalLink, Inbox, Send, ChevronLeft, ChevronRight, FileSpreadsheet, Building2, MonitorPlay, Share2, Package, Camera, CalendarDays, FileSignature, Users, Loader2, CheckCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx"; 

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

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // ================= STATE FORM PENGAJUAN (DINAMIS) =================
  const [formSKData, setFormSKData] = useState({});
  const [formRTARData, setFormRTARData] = useState({});
  const [isSubmittingSK, setIsSubmittingSK] = useState(false);
  const [isSubmittingRTAR, setIsSubmittingRTAR] = useState(false);
  
  // 🔥 State Upload File 🔥
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabFromUrl = params.get("tab");
    if (tabFromUrl) setActiveTab(tabFromUrl);

    async function fetchData() {
      setLoading(true);
      try {
        // 1. Tarik Data Arsip
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

        // 2. Tarik Data Custom Form Schema
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

  // Skema Default jika Admin belum mengatur custom form
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

  const availablePeriods = masterPersuratan.filter(p => (p.lembaga || "Komisariat") === activeLembaga);

  useEffect(() => {
    if (activeTab === "persuratan" && availablePeriods.length > 0) {
      if (!availablePeriods.some(p => p.id === activePeriode)) setActivePeriode(availablePeriods[0].id);
    }
  }, [activeLembaga, activeTab, masterPersuratan]); 

  const formatDisplayDate = (dateVal) => {
    if (!dateVal) return "-";
    if (typeof dateVal === 'string') {
      const str = dateVal.trim();
      const parts = str.includes('/') ? str.split('/') : str.split('-');
      if (parts.length === 3) {
        if (parts[2].length >= 4) return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2].substring(0,4)}`;
        else if (parts[0].length === 4) return `${parts[2].substring(0, 2).padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
    }
    if (!isNaN(dateVal) && Number(dateVal) > 20000) return `${String(new Date(Math.round((Number(dateVal) - 25569) * 86400 * 1000)).getDate()).padStart(2, '0')}/${String(new Date(Math.round((Number(dateVal) - 25569) * 86400 * 1000)).getMonth() + 1).padStart(2, '0')}/${new Date(Math.round((Number(dateVal) - 25569) * 86400 * 1000)).getFullYear()}`;
    const d = new Date(dateVal);
    if (!isNaN(d)) return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    return dateVal;
  };

  const getSortableDate = (dateVal) => {
    if (!dateVal) return 0;
    if (typeof dateVal === 'string') {
      const str = dateVal.trim();
      const parts = str.includes('/') ? str.split('/') : str.split('-');
      if (parts.length === 3) {
        if (parts[2].length >= 4) return new Date(`${parts[2].substring(0,4)}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T00:00:00`).getTime();
        else if (parts[0].length === 4) return new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].substring(0, 2).padStart(2, '0')}T00:00:00`).getTime();
      }
    }
    if (!isNaN(dateVal) && Number(dateVal) > 20000) return new Date(Math.round((Number(dateVal) - 25569) * 86400 * 1000)).getTime();
    const d = new Date(dateVal);
    return isNaN(d) ? 0 : d.getTime();
  };

  const filterByLembaga = (dataArray) => {
    return dataArray.filter(item => (item.lembaga || "Komisariat") === activeLembaga);
  };

  const selectedPeriodData = availablePeriods.find(p => p.id === activePeriode) || availablePeriods[0] || { suratMasuk: [], suratKeluar: [], linkMasuk: "", linkKeluar: "" };

  const baseSuratMasuk = (selectedPeriodData.suratMasuk || []).sort((a, b) => getSortableDate(a.tglDatang) - getSortableDate(b.tglDatang));
  const baseSuratKeluar = (selectedPeriodData.suratKeluar || []).sort((a, b) => {
    const getNum = (str) => {
      const match = (str || "").match(/\d+/);
      return match ? parseInt(match[0], 10) : 999999;
    };
    const numA = getNum(a.nomorSurat); const numB = getNum(b.nomorSurat);
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

  const handleSuratTabChange = (tab) => { setActiveSuratTab(tab); setSearchQuery(""); setCurrentPage(1); };
  const handleSearchChange = (e) => { setSearchQuery(e.target.value); setCurrentPage(1); };
  
  const handleLembagaChange = (e) => {
    setActiveLembaga(e.target.value);
    setActiveTab("persuratan");
    setSearchQuery("");
    setCurrentPage(1);
    window.history.pushState(null, "", `?tab=persuratan`);
  };

  const totalPages = Math.ceil(currentListData.length / ITEMS_PER_PAGE);
  const paginatedSuratData = activeTab === "persuratan" 
    ? currentListData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE) 
    : currentListData;

  const handleExportExcel = () => {
    if (currentListData.length === 0) return alert("Tidak ada data arsip untuk diekspor!");
    let formattedData = [];
    if (activeTab === "persuratan") {
      formattedData = currentListData.map((item, idx) => ({
        "No": idx + 1, "Nomor Surat": item.nomorSurat || "-", [activeSuratTab === "masuk" ? "Asal Surat" : "Tujuan Surat"]: activeSuratTab === "masuk" ? (item.asalSurat||"-") : (item.tujuanSurat||"-"), "Tanggal Buat": formatDisplayDate(item.tglBuat), [activeSuratTab === "masuk" ? "Tanggal Datang" : "Tanggal Kirim"]: activeSuratTab === "masuk" ? formatDisplayDate(item.tglDatang) : formatDisplayDate(item.tglKirim), "Perihal": item.hal || item.perihalSurat || "-", "Keterangan": item.ket || item.deskripsiSurat || "-"
      }));
    } else if (activeTab === "proker") {
      formattedData = currentListData.map((item, idx) => ({
        "No": idx + 1, "Biro/Pelaksana": item.pelaksanaProker || "-", "Nama Kegiatan": item.namaProker || "-", "Tujuan": item.tujuan || "-", "Indikator": item.indikator || "-", "Sasaran": item.sasaran || "-", "Waktu Pelaksanaan": formatDisplayDate(item.waktuPelaksanaan), "Penanggung Jawab": item.penanggungJawab || "-", "Estimasi Dana": item.estimasiDana || "-"
      }));
    } else if (activeTab === "presentasi") {
      formattedData = currentListData.map((item, idx) => ({
        "No": idx + 1, "Judul Dokumen": item.judul || "-", "Tipe Dokumen": item.tipeDokumen || "Presentasi", "Deskripsi": item.deskripsi || "-", "Link Unduh": item.downloadUrl || "Tidak Ada"
      }));
    } else if (activeTab === "inventaris") {
      formattedData = currentListData.map((item, idx) => ({
        "No": idx + 1, "Nama Barang": item.namaBarang || "-", "Jumlah": item.jumlah || "0", "Kondisi": item.kondisi || "-", "Deskripsi": item.deskripsi || "-"
      }));
    } else {
      formattedData = currentListData.map((item, idx) => ({
        "No": idx + 1, "Judul/Ketetapan": item.tentangHukum || item.namaLaporan || "-", "Nomor/Periode": item.nomorSK || item.periode || "-", "Deskripsi Singkat": item.deskripsiHukum || item.deskripsiLaporan || "-"
      }));
    }

    const ws = XLSX.utils.json_to_sheet(formattedData); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data_Arsip"); XLSX.writeFile(wb, `Rekap_${activeTab}_${activeLembaga.toUpperCase()}_${Date.now()}.xlsx`);
  };

  // 🔥 FUNGSI UPLOAD FILE KE CLOUDINARY 🔥
  const handleFileUpload = async (e, fieldId, setFormData, formData) => {
    const file = e.target.files[0];
    if (!file) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME; 
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET; 
    
    if (!cloudName || !uploadPreset) { 
      alert("Error: Konfigurasi Cloudinary belum lengkap!"); 
      return; 
    }

    setIsUploadingFile(true);
    const uploadData = new FormData();
    uploadData.append("file", file); 
    uploadData.append("upload_preset", uploadPreset);
    
    try {
      // Gunakan auto/upload agar bisa menerima PDF (raw) maupun Image
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { 
        method: "POST", 
        body: uploadData 
      });
      const data = await res.json();
      
      if (data.secure_url) {
         setFormData({...formData, [fieldId]: data.secure_url.replace("/upload/", "/upload/q_auto,f_auto/")});
      }
    } catch (err) { 
      alert(`Gagal mengunggah file ${file.name}.`); 
    } finally {
      setIsUploadingFile(false);
    }
  };

  // ================= SUBMIT PENGAJUAN (DINAMIS) =================
  const handleSubmitSK = async (e) => {
    e.preventDefault();
    if(isUploadingFile) return alert("Harap tunggu, file sedang diunggah!");
    
    setIsSubmittingSK(true);
    try {
      await addDoc(collection(db, "pengajuan_sk"), {
        dataForm: formSKData,
        email: formSKData.email || "", 
        status: "Diproses",
        createdAt: new Date().toISOString()
      });
      alert("Pengajuan SK berhasil dikirim! Silakan tunggu konfirmasi melalui email Anda.");
      setFormSKData({});
    } catch (err) { alert("Terjadi kesalahan saat mengirim pengajuan: " + err.message); } 
    finally { setIsSubmittingSK(false); }
  };

  const handleSubmitRTAR = async (e) => {
    e.preventDefault();
    if(isUploadingFile) return alert("Harap tunggu, file sedang diunggah!");
    
    setIsSubmittingRTAR(true);
    try {
      await addDoc(collection(db, "pengajuan_rtar"), {
        dataForm: formRTARData,
        email: formRTARData.email || "",
        status: "Diproses",
        createdAt: new Date().toISOString()
      });
      alert("Pengajuan Kegiatan RTAR berhasil dikirim! Silakan tunggu konfirmasi melalui email Anda.");
      setFormRTARData({});
    } catch (err) { alert("Terjadi kesalahan saat mengirim pengajuan: " + err.message); } 
    finally { setIsSubmittingRTAR(false); }
  };

  // ================= RENDER DYNAMIC FORM =================
  const inputCustomClass = "w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400";
  const labelCustomClass = "text-[13px] sm:text-sm font-bold text-slate-800 dark:text-slate-200 block mb-2";

  const renderDynamicForm = (schema, formData, setFormData) => {
    return schema.map((field, idx) => {
      const isFullWidth = field.type === 'textarea' || field.type === 'url' || field.label.length > 35;

      return (
        <div key={idx} className={isFullWidth ? "col-span-1 sm:col-span-2" : "col-span-1"}>
          <label className={labelCustomClass}>
            {field.label} {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          
          {field.type === 'textarea' ? (
            <textarea required={field.required} placeholder={field.placeholder} value={formData[field.id] || ''} onChange={e => setFormData({...formData, [field.id]: e.target.value})} className={inputCustomClass} rows="4" />
          ) : field.type === 'file' || field.type === 'image' ? (
            <div className="relative">
              <input 
                type="file" 
                accept={field.type === 'image' ? "image/*" : ".pdf,.doc,.docx"}
                required={field.required && !formData[field.id]} 
                onChange={(e) => handleFileUpload(e, field.id, setFormData, formData)} 
                className={`w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 ${isUploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isUploadingFile}
              />
              {isUploadingFile && (
                <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1 animate-pulse">
                  <Loader2 size={12} className="animate-spin" /> Mengunggah File...
                </p>
              )}
              {formData[field.id] && !isUploadingFile && (
                <p className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle size={14}/> File terlampir: <a href={formData[field.id]} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-800">Lihat File</a>
                </p>
              )}
            </div>
          ) : (
            <input type={field.type} required={field.required} placeholder={field.placeholder} value={formData[field.id] || ''} onChange={e => setFormData({...formData, [field.id]: e.target.value})} className={inputCustomClass} />
          )}
        </div>
      );
    });
  };

  if (loading) return <LoadingScreen text={`Memuat Bank Data Arsip`} />;

  const DocumentCard = ({ item, isHukum }) => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
      <div className="relative w-full pt-[141.4%] bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 overflow-hidden">
        {(item.thumbnail || item.thumbnailUrl) ? (
          <Image 
            src={item.thumbnail || item.thumbnailUrl} 
            alt="Cover" 
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500" 
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 dark:text-slate-500 bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-800 dark:to-slate-700"><FileText size={48} className="mb-2 drop-shadow-sm" /><span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Pratinjau PDF</span></div>
        )}
        <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-md shadow-sm border border-slate-100/50 dark:border-slate-700"><span className={`text-[9px] font-black uppercase tracking-widest ${isHukum ? 'text-purple-600 dark:text-purple-400' : 'text-amber-600 dark:text-amber-400'}`}>{isHukum ? 'Produk Hukum' : 'Laporan'}</span></div>
        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
           {item.linkFile ? (<a href={item.linkFile} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="bg-blue-600 text-white p-4 rounded-full hover:scale-110 hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/30"><Download size={24} /></a>) : (<span className="bg-slate-800 text-slate-300 px-4 py-2 rounded-full text-xs font-bold">File Kosong</span>)}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-grow bg-white dark:bg-slate-800">
         <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 mb-1.5 line-clamp-1">{isHukum ? (item.nomorSK || "Tanpa Nomor") : (item.periode || "Tanpa Periode")}</span>
         <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{isHukum ? (item.tentangHukum || "Dokumen Hukum") : (item.namaLaporan || "Laporan Kepengurusan")}</h3>
         <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-auto whitespace-pre-wrap">{isHukum ? (item.deskripsiHukum || "-") : (item.deskripsiLaporan || "-")}</p>
      </div>
    </motion.div>
  );

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 w-full overflow-x-hidden flex flex-col transition-colors duration-300">
      <Navbar />

      <section className="pt-28 md:pt-36 pb-16 md:pb-24 px-5 bg-[#0f172a] text-center relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute inset-0 z-0 opacity-10 mix-blend-overlay"><div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.span initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-purple-400 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full mb-5 inline-flex items-center justify-center gap-2 w-max mx-auto backdrop-blur-sm"><FolderArchive size={14} /></motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight leading-tight">Pusat <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Administrasi</span></motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-300 text-sm md:text-lg font-light max-w-2xl mx-auto leading-relaxed">Satu pintu untuk mengakses arsip persuratan, program kerja, produk hukum, pengajuan kegiatan, hingga inventaris & peminjaman barang.</motion.p>
        </div>
      </section>

      <section className="px-5 max-w-7xl mx-auto w-full -mt-10 md:-mt-12 relative z-20 space-y-4">
        
        {/* DROPDOWN LEMBAGA & PERIODE (Hanya muncul di tab Persuratan & Proker) */}
        {(activeTab === "persuratan" || activeTab === "proker") && (
          <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between relative z-30 transition-colors duration-300 gap-3">
             <div className="flex items-center gap-3 w-full sm:w-1/2">
                 <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400 hidden sm:flex shrink-0">
                     <Building2 size={20} />
                 </div>
                 <div className="flex-grow">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-0.5">Ruang Kerja / Lembaga</p>
                     <select
                       value={activeLembaga}
                       onChange={handleLembagaChange}
                       className="w-full text-sm sm:text-base font-black text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
                     >
                        <option value="Komisariat">Administrasi Komisariat</option>
                        <option value="KOPRI">Administrasi KOPRI</option>
                        {listLSO.map((lso, index) => (
                            <option key={index} value={lso}>Administrasi {lso}</option>
                        ))}
                     </select>
                 </div>
             </div>

             {activeTab === "persuratan" && (
                 <div className="flex items-center gap-3 w-full sm:w-1/2 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 pt-3 sm:pt-0 sm:pl-4">
                     <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg text-amber-600 dark:text-amber-400 hidden sm:flex shrink-0">
                         <CalendarDays size={20} />
                     </div>
                     <div className="flex-grow">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-0.5">Periode Kepengurusan</p>
                         <select
                           value={activePeriode}
                           onChange={(e) => { setActivePeriode(e.target.value); setCurrentPage(1); }}
                           className="w-full text-sm sm:text-base font-black text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer transition-all"
                         >
                            {availablePeriods.length > 0 ? (
                                availablePeriods.map(p => (
                                    <option key={p.id} value={p.id}>{p.periode}</option>
                                ))
                            ) : (
                                <option value="">Belum Ada Data Periode</option>
                            )}
                         </select>
                     </div>
                 </div>
             )}
          </div>
        )}

        <div className="bg-slate-900/90 dark:bg-slate-950/90 border border-slate-800 p-2 rounded-2xl flex flex-row gap-1 shadow-xl backdrop-blur-md overflow-x-auto whitespace-nowrap scrollbar-none w-full">
          <button onClick={() => handleTabChange("persuratan")} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "persuratan" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}><Mail size={16} /> Arsip Persuratan</button>
          <button onClick={() => handleTabChange("proker")} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "proker" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}><Briefcase size={16} /> Program Kerja</button>
          <button onClick={() => handleTabChange("produkhukum")} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "produkhukum" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}><Scale size={16} /> Produk Hukum</button>
          <button onClick={() => handleTabChange("laporan")} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "laporan" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}><FileCheck size={16} /> Laporan (LPJ)</button>
          <button onClick={() => handleTabChange("presentasi")} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "presentasi" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}><MonitorPlay size={16} /> Presentasi & Dok</button>
          <button onClick={() => handleTabChange("inventaris")} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "inventaris" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}><Package size={16} /> Inventaris Barang</button>
          <button onClick={() => handleTabChange("pengajuan-sk")} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "pengajuan-sk" ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}><FileSignature size={16} /> Pengajuan SK</button>
          <button onClick={() => handleTabChange("pengajuan-rtar")} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "pengajuan-rtar" ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}><Users size={16} /> Pengajuan RTAR</button>
        </div>

        {/* Form Pencarian disembunyikan untuk Tab Pengajuan */}
        {(activeTab !== "pengajuan-sk" && activeTab !== "pengajuan-rtar") && (
          <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 flex items-center relative transition-colors duration-300">
            <input type="text" value={searchQuery} onChange={handleSearchChange} placeholder={activeTab === "persuratan" ? "Cari nomor surat, perihal, atau tujuan/asal..." : activeTab === "proker" ? "Cari nama program kerja atau divisi pelaksana..." : activeTab === "presentasi" ? "Cari judul presentasi atau tipe dokumen..." : activeTab === "inventaris" ? "Cari nama barang atau kondisinya..." : activeTab === "produkhukum" ? "Cari nomor SK atau tentang ketetapan..." : "Cari judul laporan atau periode..."} className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400" />
            <Search className="absolute left-7 h-5 w-5 text-slate-400" />
          </div>
        )}
      </section>

      <section className="pb-24 px-5 max-w-7xl mx-auto w-full flex-grow mt-6">
        
        {/* Kategori Header disembunyikan untuk Tab Pengajuan */}
        {(activeTab !== "pengajuan-sk" && activeTab !== "pengajuan-rtar") && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4 w-full">
            <p className="text-xs font-bold text-slate-400 px-1 flex-1 text-center sm:text-left">
              Kategori: <span className="text-blue-600 dark:text-blue-400 uppercase tracking-wider">{activeTab}</span> 
              {activeTab !== "persuratan" && ` (${currentListData.length} Data)`}
              {activeTab === "persuratan" && ` (Total ${currentListData.length} Surat)`}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {activeTab === "persuratan" && (
                <div className="flex w-full sm:w-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shadow-inner border border-slate-200 dark:border-slate-700">
                  <button onClick={() => handleSuratTabChange("masuk")} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all ${activeSuratTab === "masuk" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}><Inbox size={14} /> Surat Masuk ({baseSuratMasuk.length})</button>
                  <button onClick={() => handleSuratTabChange("keluar")} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all ${activeSuratTab === "keluar" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}><Send size={14} /> Surat Keluar ({baseSuratKeluar.length})</button>
                </div>
              )}
              
              <div className="flex w-full sm:w-auto gap-2 sm:gap-3">
                {activeTab === "persuratan" && (
                  <a 
                     href={getDriveLink()} 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-colors shadow-sm ${getDriveLink() !== "#" ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed pointer-events-none'}`}
                  >
                    <FolderArchive size={14} /> <span className="truncate">Folder Arsip</span>
                  </a>
                )}

                <button onClick={handleExportExcel} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-sm">
                  <FileSpreadsheet size={14} /> <span className="truncate">Export ke Excel</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {(activeTab !== "pengajuan-sk" && activeTab !== "pengajuan-rtar") && currentListData.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-16 text-center shadow-sm mt-4">
             <FileText className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
             <h3 className="font-bold text-slate-700 dark:text-slate-300 text-lg">Data Belum Tersedia</h3>
             <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Admin belum menginput data untuk kategori ini, atau kata kunci pencarian Anda tidak ditemukan.
             </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={`${activeLembaga}-${activeTab}-${activeSuratTab}-${activePeriode}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="w-full">
              
              {/* ================= SUB 1: PERSURATAN ================= */}
              {activeTab === "persuratan" && (
                <div className="bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl shadow-md overflow-hidden flex flex-col">
                  
                  <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-3 border-b border-amber-300 dark:border-amber-700 flex items-center justify-between">
                    <h3 className="font-black text-amber-800 dark:text-amber-500 uppercase tracking-wide text-sm underline underline-offset-4">
                      {activeSuratTab === "masuk" ? "ARSIP SURAT MASUK" : "ARSIP SURAT KELUAR"}
                    </h3>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-200/50 dark:bg-amber-900/50 px-2 py-1 rounded">Hal. {currentPage} / {totalPages || 1}</span>
                  </div>

                  <div className="overflow-x-auto flex-grow">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead className="bg-amber-500 dark:bg-amber-700 text-white text-[11px] uppercase tracking-wider text-center">
                        <tr>
                          <th rowSpan={2} className="py-2 px-3 w-10 font-bold border border-amber-600 dark:border-amber-800">No</th>
                          <th rowSpan={2} className="py-2 px-4 w-64 lg:w-56 font-bold border border-amber-600 dark:border-amber-800">No. Surat</th>
                          <th rowSpan={2} className="py-2 px-4 w-64 font-bold border border-amber-600 dark:border-amber-800">{activeSuratTab === "masuk" ? "Asal Surat" : "Tujuan Surat"}</th>
                          <th colSpan={2} className="py-1.5 border border-amber-600 dark:border-amber-800 font-bold">Tgl Surat</th>
                          <th rowSpan={2} className="py-2 px-4 w-48 font-bold border border-amber-600 dark:border-amber-800">Hal</th>
                          <th rowSpan={2} className="py-2 px-4 w-64 font-bold border border-amber-600 dark:border-amber-800">Ket</th>
                        </tr>
                        <tr>
                          <th className="py-1.5 px-3 w-24 font-bold border border-amber-600 dark:border-amber-800 bg-amber-500/90 dark:bg-amber-700/90">Buat</th>
                          <th className="py-1.5 px-3 w-24 font-bold border border-amber-600 dark:border-amber-800 bg-amber-500/90 dark:bg-amber-700/90">{activeSuratTab === "masuk" ? "Datang" : "Kirim"}</th>
                        </tr>
                    </thead>
                      
                      <tbody className="divide-y divide-amber-200 dark:divide-amber-800/50 text-sm bg-white dark:bg-slate-800">
                        {paginatedSuratData.map((doc, index) => {
                          const realNumber = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                          return (
                            <tr key={index} className="hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
                              <td className="py-1.5 px-3 text-center border-r border-amber-200 dark:border-amber-800/50 font-bold text-slate-500 dark:text-slate-400">{realNumber}</td>
                              
                              <td className="py-1.5 px-4 border-r border-amber-200 dark:border-amber-800/50 max-w-[160px] md:max-w-[220px]">
                                <div className="w-full overflow-x-auto whitespace-nowrap pb-1.5 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-amber-300 dark:[&::-webkit-scrollbar-thumb]:bg-amber-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                                  <span className="font-mono text-[11px] md:text-xs font-bold text-slate-800 dark:text-slate-300 px-1">
                                    {doc.nomorSurat || "-"}
                                  </span>
                                </div>
                              </td>
                              
                              <td className="py-1.5 px-4 border-r border-amber-200 dark:border-amber-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug">{activeSuratTab === "masuk" ? (doc.asalSurat || "-") : (doc.tujuanSurat || "-")}</td>
                              
                              <td className="py-1.5 px-3 border-r border-amber-200 dark:border-amber-800/50 text-[11px] text-center text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">{formatDisplayDate(doc.tglBuat)}</td>
                              <td className="py-1.5 px-3 border-r border-amber-200 dark:border-amber-800/50 text-[11px] text-center text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">{activeSuratTab === "masuk" ? formatDisplayDate(doc.tglDatang) : formatDisplayDate(doc.tglKirim)}</td>
                              
                              <td className="py-1.5 px-4 border-r border-amber-200 dark:border-amber-800/50">
                                <div className="font-bold text-slate-800 dark:text-slate-200 text-xs leading-snug">{doc.hal || doc.perihalSurat || "-"}</div>
                              </td>
                              <td className="py-1.5 px-4">
                                <div className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug">{doc.ket || doc.deskripsiSurat || "-"}</div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="bg-amber-50 dark:bg-slate-800 border-t border-amber-200 dark:border-amber-800/50 p-3 flex justify-center items-center gap-2">
                      <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-1.5 rounded-md bg-white dark:bg-slate-700 border border-amber-300 dark:border-slate-600 text-amber-700 dark:text-amber-500 hover:bg-amber-200 dark:hover:bg-slate-600 disabled:opacity-50 transition"><ChevronLeft size={16}/></button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                        <button 
                          key={num} onClick={() => setCurrentPage(num)} 
                          className={`w-8 h-8 rounded-md text-xs font-bold transition-colors ${currentPage === num ? 'bg-amber-500 text-white shadow-sm border border-amber-600 dark:border-amber-500' : 'bg-white dark:bg-slate-700 border border-amber-300 dark:border-slate-600 text-amber-700 dark:text-amber-500 hover:bg-amber-200 dark:hover:bg-slate-600'}`}
                        >
                          {num}
                        </button>
                      ))}

                      <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-1.5 rounded-md bg-white dark:bg-slate-700 border border-amber-300 dark:border-slate-600 text-amber-700 dark:text-amber-500 hover:bg-amber-200 dark:hover:bg-slate-600 disabled:opacity-50 transition"><ChevronRight size={16}/></button>
                    </div>
                  )}
                </div>
              )}

              {/* ================= SUB 2: PROGRAM KERJA ================= */}
              {activeTab === "proker" && (
                <div className="space-y-8">
                  {(() => {
                    const groupedProker = currentListData.reduce((acc, curr) => {
                      const biro = curr.pelaksanaProker || "Biro / LSO Umum";
                      if (!acc[biro]) acc[biro] = [];
                      acc[biro].push(curr);
                      return acc;
                    }, {});

                    return Object.keys(groupedProker).map((biroName, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-emerald-600 dark:bg-emerald-700 px-5 py-3.5 text-white flex items-center gap-2">
                          <Briefcase size={18} />
                          <h3 className="font-bold text-sm uppercase tracking-wider">{biroName}</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[1250px]">
                            <thead className="bg-emerald-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
                              <tr>
                                <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 w-12 text-center font-bold">No</th>
                                <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 w-48 text-center font-bold">Nama Kegiatan</th>
                                <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 w-48 text-center font-bold">Tujuan</th>
                                <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 w-40 text-center font-bold">Indikator</th>
                                <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 w-32 text-center font-bold">Sasaran</th>
                                <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 w-36 text-center font-bold">Waktu Pelaksanaan</th>
                                <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 w-36 text-center font-bold">Penanggung Jawab</th>
                                <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 text-center font-bold">Estimasi Dana</th>
                                <th className="py-3 px-4 font-bold text-center w-24">Berkas</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                              {groupedProker[biroName].map((doc, docIdx) => (
                                <tr key={docIdx} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors">
                                  <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-700 text-center font-bold text-slate-400 dark:text-slate-500">{docIdx + 1}</td>
                                  <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 text-xs leading-relaxed">{doc.namaProker || "-"}</td>
                                  <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{doc.tujuan || "-"}</td>
                                  <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{doc.indikator || "-"}</td>
                                  <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{doc.sasaran || "-"}</td>
                                  <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{formatDisplayDate(doc.waktuPelaksanaan)}</td>
                                  <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-700 font-semibold text-emerald-700 dark:text-emerald-500 text-xs leading-relaxed">{doc.penanggungJawab || "-"}</td>
                                  <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-700 text-center font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/50">{doc.estimasiDana || "-"}</td>
                                  <td className="py-3 px-4 text-center">
                                    {doc.linkFile ? (
                                      <a href={doc.linkFile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1 w-full bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white font-bold px-3 py-1.5 rounded-lg transition text-[10px] uppercase tracking-wider shadow-sm">
                                        <ExternalLink size={12} /> Buka
                                      </a>
                                    ) : (
                                      <span className="text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider block text-center font-bold">Kosong</span>
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                   {currentListData.map((doc, index) => <DocumentCard key={index} item={doc} isHukum={true} />)}
                </div>
              )}

              {/* ================= SUB 4: LAPORAN KEPENGURUSAN ================= */}
              {activeTab === "laporan" && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                   {currentListData.map((doc, index) => <DocumentCard key={index} item={doc} isHukum={false} />)}
                </div>
              )}

              {/* ================= SUB 5: PRESENTASI & DOKUMEN ================= */}
              {activeTab === "presentasi" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentListData.map((docItem, index) => (
                    <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col group">
                      <a href={`/administrasi/dokumen/${docItem.id}`} className="relative w-full pt-[56.25%] bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden cursor-pointer">
                        <MonitorPlay className="w-16 h-16 text-slate-300 dark:text-slate-500 group-hover:scale-110 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-all duration-500" />
                        <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/5 dark:group-hover:bg-blue-400/10 transition-colors duration-300"></div>
                        <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                           <ExternalLink size={12} /> Buka Presentasi
                        </div>
                      </a>
                      <div className="p-5 flex flex-col flex-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/50 w-max px-2.5 py-1 rounded-md">
                          {docItem.tipeDokumen || "Presentasi Canva"}
                        </span>
                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          <a href={`/administrasi/dokumen/${docItem.id}`}>{docItem.judul}</a>
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 flex-1 mb-4 whitespace-pre-wrap">{docItem.deskripsi}</p>
                        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
                           <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Lihat Dokumen PMII: ' + docItem.judul + '\n' + window.location.origin + '/administrasi/dokumen/' + docItem.id)}`, '_blank')} className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white font-bold text-xs py-2 rounded-md transition-colors flex items-center justify-center gap-2 border border-emerald-200/50 dark:border-emerald-800/50">
                             <Share2 size={14}/> Bagikan
                           </button>
                           {docItem.downloadUrl ? (
                             <a href={docItem.downloadUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 border border-slate-200 dark:border-slate-600 hover:border-blue-600 font-bold text-xs py-2 rounded-md transition-colors flex items-center justify-center gap-2">
                               <Download size={14}/> Unduh
                             </a>
                           ) : (
                             <span className="flex-1 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 font-bold text-xs py-2 rounded-md flex items-center justify-center gap-2 cursor-not-allowed border border-slate-100 dark:border-slate-700">
                               File Kosong
                             </span>
                           )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ================= SUB 6: INVENTARIS ================= */}
              {activeTab === "inventaris" && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                  {currentListData.map((item, index) => (
                    <div key={index} className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col group">
                      
                      <div className="relative w-full pt-[75%] bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 overflow-hidden">
                        {item.fotoGroup && item.fotoGroup[0] ? (
                          <Image 
                            src={item.fotoGroup[0]} 
                            alt={item.namaBarang} 
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500" 
                            sizes="(max-width: 640px) 50vw, 33vw"
                          />
                        ) : (
                          <Package size={36} className="absolute inset-0 m-auto text-slate-300 dark:text-slate-500" />
                        )}
                        <span className={`absolute top-2 left-2 text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm border ${item.kondisi === 'Baik' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-800' : item.kondisi === 'Rusak Ringan' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-800' : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-400 dark:border-red-800'}`}>
                           {item.kondisi || "Baik"}
                        </span>
                      </div>

                      <div className="p-3 md:p-5 flex flex-col flex-1">
                        <h3 className="text-sm md:text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug mb-1.5">{item.namaBarang}</h3>
                        
                        <div className="mb-2">
                           <span className="bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] md:text-xs font-bold border border-slate-200 dark:border-slate-600">
                             Stok: {item.jumlah}
                           </span>
                        </div>
                        
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-sm line-clamp-3 md:line-clamp-4 flex-1 mb-4 leading-relaxed whitespace-pre-wrap">
                          {item.deskripsi || "Tidak ada detail untuk barang ini."}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                           <a href={`/administrasi/inventaris/${item.id}?tab=foto`} className="flex-1 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-bold text-[10px] md:text-xs py-2 md:py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                             <Camera size={14}/> Galeri
                           </a>
                           <a href={`/administrasi/inventaris/${item.id}?tab=pengajuan`} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] md:text-xs py-2 md:py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                             <FileText size={14}/> Pinjam
                           </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 🔥 ================= SUB 7: FORM PENGAJUAN SK ================= 🔥 */}
              {activeTab === "pengajuan-sk" && (
                <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-8 sm:p-10 md:p-12 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 w-full">
                  <div className="flex items-center gap-4 mb-3">
                     <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400">
                        <FileSignature size={28} strokeWidth={2} />
                     </div>
                     <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100">Pengajuan SK Kepengurusan</h2>
                  </div>
                  <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mb-8 border-b border-slate-100 dark:border-slate-700 pb-6">
                     Silakan lengkapi formulir pengajuan SK. Notifikasi status ACC akan dikirimkan otomatis melalui alamat email pemohon.
                  </p>
                  
                  <form onSubmit={handleSubmitSK} className="space-y-6 md:space-y-8">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 w-full">
                        {renderDynamicForm(skSchema, formSKData, setFormSKData)}
                     </div>

                     <div className="pt-6">
                        <button type="submit" disabled={isSubmittingSK || isUploadingFile} className={`w-full font-bold text-sm md:text-base py-4 rounded-xl transition-all flex justify-center items-center gap-2 ${(isSubmittingSK || isUploadingFile) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg'}`}>
                           {isSubmittingSK ? <><Loader2 size={18} className="animate-spin"/> Mengirim Pengajuan...</> : <><Send size={18}/> Kirim Pengajuan SK</>}
                        </button>
                     </div>
                  </form>
                </div>
              )}

              {/* 🔥 ================= SUB 8: FORM PENGAJUAN RTAR ================= 🔥 */}
              {activeTab === "pengajuan-rtar" && (
                <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-8 sm:p-10 md:p-12 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 w-full">
                  <div className="flex items-center gap-4 mb-3">
                     <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400">
                        <Users size={28} strokeWidth={2} />
                     </div>
                     <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100">Pengajuan Kegiatan RTAR</h2>
                  </div>
                  <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mb-8 border-b border-slate-100 dark:border-slate-700 pb-6">
                     Silakan lengkapi formulir pendaftaran untuk penyelenggaraan Rapat Tahunan Anggota Rayon (RTAR).
                  </p>
                  
                  <form onSubmit={handleSubmitRTAR} className="space-y-6 md:space-y-8">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 w-full">
                        {renderDynamicForm(rtarSchema, formRTARData, setFormRTARData)}
                     </div>

                     <div className="pt-6">
                        <button type="submit" disabled={isSubmittingRTAR || isUploadingFile} className={`w-full font-bold text-sm md:text-base py-4 rounded-xl transition-all flex justify-center items-center gap-2 ${(isSubmittingRTAR || isUploadingFile) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg'}`}>
                           {isSubmittingRTAR ? <><Loader2 size={18} className="animate-spin"/> Mengirim Pengajuan...</> : <><Send size={18}/> Kirim Pengajuan RTAR</>}
                        </button>
                     </div>
                  </form>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </section>

      <Footer />
    </main>
  );
}