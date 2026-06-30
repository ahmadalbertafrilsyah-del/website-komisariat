"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, query, orderBy } from "firebase/firestore";
import * as XLSX from "xlsx";
import { 
  FolderArchive, Mail, Briefcase, Scale, FileCheck, Inbox, Send, Search, 
  Download, Plus, Trash2, Edit, Save, FileSpreadsheet, Building2, 
  Loader2, Sparkles, X, ExternalLink, UploadCloud, MonitorPlay, Package, Camera, CalendarDays, ClipboardList, CheckCircle, XCircle, Settings, Tag
} from "lucide-react";

export default function AdminAdministrasi() {
  const [loading, setLoading] = useState(true);
  const [activeLembaga, setActiveLembaga] = useState("Komisariat"); 
  const [listLSO, setListLSO] = useState([]); 
  
  // State Data Master
  const [masterSuratMasuk, setMasterSuratMasuk] = useState([]); 
  const [masterSuratKeluar, setMasterSuratKeluar] = useState([]); 
  const [masterProker, setMasterProker] = useState([]);
  const [masterProdukHukum, setMasterProdukHukum] = useState([]);
  const [masterLpj, setMasterLpj] = useState([]); 
  const [masterPresentasi, setMasterPresentasi] = useState([]); 
  const [masterInventaris, setMasterInventaris] = useState([]); 
  const [masterPeminjaman, setMasterPeminjaman] = useState([]);
  const [globalCalendarUrl, setGlobalCalendarUrl] = useState("");
  
  // State Navigasi
  const [activeTab, setActiveTab] = useState("persuratan"); 
  const [activeSuratTab, setActiveSuratTab] = useState("masuk"); 
  const [searchQuery, setSearchQuery] = useState("");

  // State Modal & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDataId, setEditDataId] = useState(null);
  const [formData, setFormData] = useState({});
  const [expandedRowId, setExpandedRowId] = useState(null);
  
  // State Modal LSO
  const [isLsoModalOpen, setIsLsoModalOpen] = useState(false);
  const [newLsoName, setNewLsoName] = useState("");

  // STATE UNTUK FOTO CLOUDINARY
  const [fotoUrls, setFotoUrls] = useState([]); 
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);
  
  const excelInputRef = useRef(null);

  // STYLE ENTERPRISE FORMAL
  const inputStandardClass = "w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-[13px] bg-white text-slate-800";
  const labelStandardClass = "text-[13px] font-semibold text-slate-700 block mb-1.5";

  useEffect(() => {
    fetchAdministrasiData();
    fetchPeminjamanData();
  }, []); 

  async function fetchAdministrasiData() {
    try {
      const docRef = doc(db, "website_config", "database_administrasi");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMasterSuratMasuk(data.listSuratMasuk || []); 
        setMasterSuratKeluar(data.listSuratKeluar || data.listDokumen || []); 
        setMasterProker(data.listProker || []);   
        setMasterProdukHukum(data.listProdukHukum || []); 
        setMasterLpj(data.listLpj || []); 
        setMasterPresentasi(data.listPresentasi || []); 
        setMasterInventaris(data.listInventaris || []); 
        setListLSO(data.listLSO || []);
        setGlobalCalendarUrl(data.globalCalendarUrl || "");
      }
    } catch (error) {
      console.error("Gagal menarik database:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPeminjamanData() {
    try {
      const q = query(collection(db, "peminjaman_inventaris"));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(b.waktuPinjam) - new Date(a.waktuPinjam));
      setMasterPeminjaman(data);
    } catch (error) {
      console.error("Gagal mengambil data peminjaman:", error);
    }
  }

  // ================= MANAJEMEN KATEGORI LSO =================
  const handleAddLSO = async (e) => {
    e.preventDefault();
    if (!newLsoName.trim()) return;
    const isExist = listLSO.some(lso => lso.toLowerCase() === newLsoName.trim().toLowerCase());
    if (isExist) return alert("Nama LSO ini sudah ada!");

    const updatedLSO = [...listLSO, newLsoName.trim()];
    try {
      await setDoc(doc(db, "website_config", "database_administrasi"), { listLSO: updatedLSO }, { merge: true });
      setListLSO(updatedLSO);
      setNewLsoName("");
      alert("Kategori LSO berhasil ditambahkan!");
    } catch (error) {
      alert("Gagal menambahkan LSO.");
    }
  };

  const handleDeleteLSO = async (lsoToDelete) => {
    if (!confirm(`Hapus kategori administrasi LSO "${lsoToDelete}"?\nData arsip yang sudah menggunakan label LSO ini tidak akan terhapus, namun labelnya mungkin menjadi tidak sinkron.`)) return;
    const updatedLSO = listLSO.filter(lso => lso !== lsoToDelete);
    try {
      await setDoc(doc(db, "website_config", "database_administrasi"), { listLSO: updatedLSO }, { merge: true });
      setListLSO(updatedLSO);
      if (activeLembaga === lsoToDelete) setActiveLembaga("Komisariat");
    } catch (error) {
      alert("Gagal menghapus LSO.");
    }
  };

  // ================= CLOUDINARY & CALENDAR =================
  const handleSaveGlobalCalendar = async () => {
    try {
      const docRef = doc(db, "website_config", "database_administrasi");
      await setDoc(docRef, { globalCalendarUrl: globalCalendarUrl }, { merge: true });
      alert("Link Kalender Global untuk Inventaris berhasil disimpan!");
    } catch (error) {
      alert("Gagal menyimpan link kalender: " + error.message);
    }
  };

  const handleUpdateStatusPeminjaman = async (id, newStatus) => {
    if (!confirm(`Yakin mengubah status pengajuan ini menjadi ${newStatus}?`)) return;
    try {
      await updateDoc(doc(db, "peminjaman_inventaris", id), { status: newStatus });
      setMasterPeminjaman(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    } catch (error) {
      alert("Gagal mengubah status: " + error.message);
    }
  };

  const uploadToCloudinary = async (files) => {
    if (!files || files.length === 0) return;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME; 
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET; 

    if (!cloudName || !uploadPreset) return alert("Konfigurasi Cloudinary di .env belum lengkap!");
    setIsUploadingFoto(true);
    const uploadedUrls = [];

    for (let i = 0; i < files.length; i++) {
      const formDataObj = new FormData();
      formDataObj.append("file", files[i]);
      formDataObj.append("upload_preset", uploadPreset);

      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formDataObj });
        const data = await res.json();
        if (data.secure_url) uploadedUrls.push(data.secure_url.replace("/upload/", "/upload/q_auto,f_auto/"));
      } catch (err) { alert(`Gagal mengunggah ${files[i].name}.`); }
    }
    setFotoUrls((prev) => [...prev, ...uploadedUrls]);
    setIsUploadingFoto(false);
  };
  const removeFoto = (indexToRemove) => setFotoUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));

  // ================= UTILITIES & LOGIC =================
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
    if (!isNaN(dateVal) && Number(dateVal) > 20000) {
      const date = new Date(Math.round((Number(dateVal) - 25569) * 86400 * 1000));
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    }
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
    const d = new Date(dateVal); return isNaN(d) ? 0 : d.getTime();
  };

  // 🔥 LOGIKA FILTERING (PERSURATAN & PROKER = FILTERED LSO, LAINNYA = GLOBAL) 🔥
  const filterByLembaga = (dataArray) => dataArray.filter(item => (item.lembaga || "Komisariat") === activeLembaga);

  const currentSuratMasuk = filterByLembaga(masterSuratMasuk).sort((a, b) => getSortableDate(b.tglDatang) - getSortableDate(a.tglDatang));
  const currentSuratKeluar = filterByLembaga(masterSuratKeluar).sort((a, b) => {
    const numA = parseInt((a.nomorSurat||"").match(/\d+/)?.[0] || 999999, 10);
    const numB = parseInt((b.nomorSurat||"").match(/\d+/)?.[0] || 999999, 10);
    if (numA !== numB) return numA - numB;
    return (a.nomorSurat || "").localeCompare(b.nomorSurat || "");
  });
  const currentProker = filterByLembaga(masterProker);

  // Data Global (Tanpa Filter LSO)
  const currentProdukHukum = masterProdukHukum;
  const currentLpj = masterLpj;
  const currentPresentasi = masterPresentasi;
  const currentInventaris = masterInventaris;

  const getFilteredData = () => {
    const q = searchQuery.toLowerCase();
    if (activeTab === "persuratan") {
      const targetData = activeSuratTab === "masuk" ? currentSuratMasuk : currentSuratKeluar;
      return targetData.filter(i => (i.nomorSurat||"").toLowerCase().includes(q) || (i.hal||"").toLowerCase().includes(q) || (i.asalSurat||i.tujuanSurat||"").toLowerCase().includes(q));
    } else if (activeTab === "proker") {
      return currentProker.filter(i => (i.namaProker||"").toLowerCase().includes(q) || (i.pelaksanaProker||"").toLowerCase().includes(q));
    } else if (activeTab === "produkhukum") {
      return currentProdukHukum.filter(i => (i.nomorSK||"").toLowerCase().includes(q) || (i.tentangHukum||"").toLowerCase().includes(q));
    } else if (activeTab === "laporan") {
      return currentLpj.filter(i => (i.namaLaporan||"").toLowerCase().includes(q) || (i.periode||"").toLowerCase().includes(q));
    } else if (activeTab === "presentasi") {
      return currentPresentasi.filter(i => (i.judul||"").toLowerCase().includes(q) || (i.deskripsi||"").toLowerCase().includes(q));
    } else if (activeTab === "inventaris") {
      return currentInventaris.filter(i => (i.namaBarang||"").toLowerCase().includes(q) || (i.kondisi||"").toLowerCase().includes(q));
    } else if (activeTab === "peminjaman") {
      return masterPeminjaman.filter(i => (i.namaBarang||"").toLowerCase().includes(q) || (i.namaOrganisasi||"").toLowerCase().includes(q) || (i.peminjam||"").toLowerCase().includes(q));
    }
    return [];
  };
  const currentListData = getFilteredData();

  // ================= MANAJEMEN SIMPAN & HAPUS =================
  const handleOpenModal = (data = null) => {
    if (data) {
      setEditDataId(data.id || Math.random());
      setFormData(data);
      if (activeTab === "inventaris" && data.fotoGroup) setFotoUrls(data.fotoGroup); else setFotoUrls([]);
    } else {
      setEditDataId(null);
      // Jika tab spesifik, gunakan activeLembaga. Jika tab global, labelkan 'Umum'
      setFormData({ lembaga: (activeTab === "persuratan" || activeTab === "proker") ? activeLembaga : "Umum" });
      setFotoUrls([]);
    }
    setIsModalOpen(true);
  };

  const handleSaveData = async (e) => {
    e.preventDefault();
    if (isUploadingFoto) return alert("Harap tunggu foto sedang diunggah...");
    try {
      let finalLembaga = (activeTab === "persuratan" || activeTab === "proker") ? activeLembaga : "Umum";
      let finalPayload = { ...formData, id: editDataId || Date.now().toString(), lembaga: finalLembaga };
      let newMaster;

      if (activeTab === "inventaris") finalPayload = { ...finalPayload, fotoGroup: fotoUrls };

      if (activeTab === "persuratan") {
        if (activeSuratTab === "masuk") {
          newMaster = editDataId ? masterSuratMasuk.map(i => i.id === editDataId ? finalPayload : i) : [finalPayload, ...masterSuratMasuk];
          setMasterSuratMasuk(newMaster);
        } else {
          newMaster = editDataId ? masterSuratKeluar.map(i => i.id === editDataId ? finalPayload : i) : [finalPayload, ...masterSuratKeluar];
          setMasterSuratKeluar(newMaster);
        }
      } else if (activeTab === "proker") {
        newMaster = editDataId ? masterProker.map(i => i.id === editDataId ? finalPayload : i) : [finalPayload, ...masterProker];
        setMasterProker(newMaster);
      } else if (activeTab === "produkhukum") {
        newMaster = editDataId ? masterProdukHukum.map(i => i.id === editDataId ? finalPayload : i) : [finalPayload, ...masterProdukHukum];
        setMasterProdukHukum(newMaster);
      } else if (activeTab === "laporan") {
        newMaster = editDataId ? masterLpj.map(i => i.id === editDataId ? finalPayload : i) : [finalPayload, ...masterLpj];
        setMasterLpj(newMaster);
      } else if (activeTab === "presentasi") {
        newMaster = editDataId ? masterPresentasi.map(i => i.id === editDataId ? finalPayload : i) : [finalPayload, ...masterPresentasi];
        setMasterPresentasi(newMaster);
      } else if (activeTab === "inventaris") {
        newMaster = editDataId ? masterInventaris.map(i => i.id === editDataId ? finalPayload : i) : [finalPayload, ...masterInventaris];
        setMasterInventaris(newMaster);
      }

      await saveDataToFirebase(activeTab, activeSuratTab, newMaster);
      setIsModalOpen(false);
    } catch (error) { alert("Gagal menyimpan data: " + error.message); }
  };

  const handleDeleteData = async (idToDelete) => {
    if (!confirm("Hapus data ini secara permanen?")) return;
    try {
      let newMaster;
      if (activeTab === "persuratan") {
        if (activeSuratTab === "masuk") { newMaster = masterSuratMasuk.filter(i => i.id !== idToDelete); setMasterSuratMasuk(newMaster); } 
        else { newMaster = masterSuratKeluar.filter(i => i.id !== idToDelete); setMasterSuratKeluar(newMaster); }
      } else if (activeTab === "proker") { newMaster = masterProker.filter(i => i.id !== idToDelete); setMasterProker(newMaster);
      } else if (activeTab === "produkhukum") { newMaster = masterProdukHukum.filter(i => i.id !== idToDelete); setMasterProdukHukum(newMaster);
      } else if (activeTab === "laporan") { newMaster = masterLpj.filter(i => i.id !== idToDelete); setMasterLpj(newMaster); 
      } else if (activeTab === "presentasi") { newMaster = masterPresentasi.filter(i => i.id !== idToDelete); setMasterPresentasi(newMaster); 
      } else if (activeTab === "inventaris") { newMaster = masterInventaris.filter(i => i.id !== idToDelete); setMasterInventaris(newMaster); }

      await saveDataToFirebase(activeTab, activeSuratTab, newMaster);
    } catch (error) {}
  };

  const saveDataToFirebase = async (tab, suratTab, newMasterData) => {
    const docRef = doc(db, "website_config", "database_administrasi");
    let updateField = {};
    if (tab === "persuratan") updateField = suratTab === "masuk" ? { listSuratMasuk: newMasterData } : { listSuratKeluar: newMasterData };
    else if (tab === "proker") updateField = { listProker: newMasterData };
    else if (tab === "produkhukum") updateField = { listProdukHukum: newMasterData };
    else if (tab === "laporan") updateField = { listLpj: newMasterData };
    else if (tab === "presentasi") updateField = { listPresentasi: newMasterData }; 
    else if (tab === "inventaris") updateField = { listInventaris: newMasterData }; 
    await setDoc(docRef, updateField, { merge: true });
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="text-blue-600 animate-spin"/></div>;

  return (
    <div className="space-y-6 pb-12 w-full text-sm">
      
      {/* HEADER PANEL */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">Sistem Administrasi</h1>
          <p className="text-[13px] text-slate-500 mt-1">Kelola arsip surat, program kerja, dan inventaris barang organisasi.</p>
        </div>
        
        {/* DROPDOWN LSO HANYA MUNCUL DI TAB PERSURATAN & PROKER */}
        {(activeTab === "persuratan" || activeTab === "proker") && (
          <div className="flex items-center gap-2">
            <div className="bg-white px-3 py-2 rounded-md border border-slate-300 flex items-center gap-2 shadow-sm min-w-[240px]">
               <Building2 size={16} className="text-blue-600 shrink-0" />
               <select value={activeLembaga} onChange={e => {setActiveLembaga(e.target.value); setSearchQuery("");}} className="w-full text-[13px] font-bold text-slate-800 bg-transparent border-none focus:ring-0 outline-none cursor-pointer truncate">
                  <option value="Komisariat">Administrasi Komisariat</option>
                  <option value="KOPRI">Administrasi KOPRI</option>
                  {listLSO.map(lso => <option key={lso} value={lso}>Administrasi {lso}</option>)}
               </select>
            </div>
            <button onClick={() => setIsLsoModalOpen(true)} className="p-2.5 bg-white border border-slate-300 rounded-md text-slate-600 hover:text-blue-600 hover:bg-slate-50 shadow-sm transition" title="Kelola Kategori LSO">
               <Settings size={16}/>
            </button>
          </div>
        )}
      </div>

      {/* TABS MENU STANDAR */}
      <div className="flex overflow-x-auto gap-1 border-b border-slate-200 pb-px scrollbar-none mb-6">
        <button onClick={() => {setActiveTab("persuratan"); setSearchQuery("");}} className={`px-4 py-2.5 font-semibold text-[13px] transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "persuratan" ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}><Mail size={15} /> Arsip Persuratan</button>
        <button onClick={() => {setActiveTab("proker"); setSearchQuery("");}} className={`px-4 py-2.5 font-semibold text-[13px] transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "proker" ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}><Briefcase size={15} /> Program Kerja</button>
        <button onClick={() => {setActiveTab("produkhukum"); setSearchQuery("");}} className={`px-4 py-2.5 font-semibold text-[13px] transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "produkhukum" ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}><Scale size={15} /> Produk Hukum</button>
        <button onClick={() => {setActiveTab("laporan"); setSearchQuery("");}} className={`px-4 py-2.5 font-semibold text-[13px] transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "laporan" ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}><FileCheck size={15} /> Laporan (LPJ)</button>
        <button onClick={() => {setActiveTab("presentasi"); setSearchQuery("");}} className={`px-4 py-2.5 font-semibold text-[13px] transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "presentasi" ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}><MonitorPlay size={15} /> Dokumen Presentasi</button>
        <button onClick={() => {setActiveTab("inventaris"); setSearchQuery("");}} className={`px-4 py-2.5 font-semibold text-[13px] transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "inventaris" ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}><Package size={15} /> Inventaris Barang</button>
        <button onClick={() => {setActiveTab("peminjaman"); setSearchQuery("");}} className={`px-4 py-2.5 font-semibold text-[13px] transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "peminjaman" ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}><ClipboardList size={15} /> Pengajuan Pinjaman</button>
      </div>

      {/* KALENDER GLOBAL INVENTARIS */}
      {activeTab === "inventaris" && (
        <div className="bg-white border border-slate-200 p-4 rounded-md shadow-sm flex flex-col md:flex-row gap-4 items-center mb-6">
          <div className="flex-1 w-full">
            <label className="text-[12px] font-bold text-slate-700 mb-1 flex items-center gap-1.5"><CalendarDays size={14} className="text-blue-600"/> Link Publik Google Calendar</label>
            <input type="url" value={globalCalendarUrl} onChange={(e) => setGlobalCalendarUrl(e.target.value)} className={inputStandardClass} placeholder="Masukkan link HTML Google Calendar..." />
          </div>
          <button onClick={handleSaveGlobalCalendar} className="bg-slate-800 hover:bg-slate-900 text-white font-medium text-[13px] px-5 py-2 rounded-md shadow-sm transition-colors w-full md:w-auto mt-5 shrink-0">
            Simpan Link
          </button>
        </div>
      )}

      {/* FILTER & AKSI */}
      <div className="flex flex-col xl:flex-row justify-between gap-4 items-center mb-4">
         <div className="flex w-full xl:w-auto gap-3 items-center">
           {activeTab === "persuratan" && (
             <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200 items-center shrink-0">
               <button onClick={() => setActiveSuratTab("masuk")} className={`px-3 py-1.5 rounded-md text-[12px] font-semibold flex items-center gap-1.5 transition ${activeSuratTab === "masuk" ? "bg-white text-blue-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}><Inbox size={14}/> Masuk</button>
               <button onClick={() => setActiveSuratTab("keluar")} className={`px-3 py-1.5 rounded-md text-[12px] font-semibold flex items-center gap-1.5 transition ${activeSuratTab === "keluar" ? "bg-white text-blue-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}><Send size={14}/> Keluar</button>
             </div>
           )}
           <div className="relative flex-1 xl:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
              <input type="text" placeholder="Cari data..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className={`${inputStandardClass} pl-9`} />
           </div>
         </div>
         
         <div className="flex w-full xl:w-auto flex-wrap gap-2 justify-end">
           {activeTab !== "peminjaman" && (
             <button onClick={() => handleOpenModal()} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-[13px] transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
                <Plus size={16} /> Tambah Data
             </button>
           )}
         </div>
      </div>

      {/* TABEL DATA FORMAL ENTERPRISE */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-600 text-[11px] uppercase font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                
                {activeTab === "persuratan" && (
                  <>
                    <th className="py-3 px-4 text-center">Nomor Surat</th>
                    <th className="py-3 px-4 text-center">{activeSuratTab === "masuk" ? "Asal Surat" : "Tujuan Surat"}</th>
                    <th className="py-3 px-4 text-center">Tanggal</th>
                    <th className="py-3 px-4 text-center">Perihal</th>
                    <th className="py-3 px-4 max-w-[200px] text-center">Keterangan</th>
                  </>
                )}

                {activeTab === "proker" && (
                  <>
                    <th className="py-3 px-4 text-center">Nama Kegiatan</th>
                    <th className="py-3 px-4 text-center">Sasaran & Tujuan</th>
                    <th className="py-3 px-4 text-center">Pelaksanaan</th>
                    <th className="py-3 px-4 text-center">PJ</th>
                    <th className="py-3 px-4 text-center">Dana</th>
                  </>
                )}

                {(activeTab === "produkhukum" || activeTab === "laporan") && (
                  <>
                    <th className="py-3 px-4 text-center">{activeTab === "produkhukum" ? "Nomor SK / Judul" : "Judul Laporan"}</th>
                    <th className="py-3 px-4 max-w-[300px] text-center">Deskripsi Singkat</th>
                  </>
                )}

                {activeTab === "presentasi" && (
                  <>
                    <th className="py-3 px-4 text-center">Judul Dokumen</th>
                    <th className="py-3 px-4 text-center">Tipe</th>
                    <th className="py-3 px-4 max-w-[300px] text-center">Deskripsi Singkat</th>
                  </>
                )}

                {activeTab === "inventaris" && (
                  <>
                    <th className="py-3 px-4 text-center">Nama Barang</th>
                    <th className="py-3 px-4 w-24 text-center">Jumlah</th>
                    <th className="py-3 px-4 w-32 text-center">Kondisi</th>
                    <th className="py-3 px-4 max-w-[300px] text-center">Deskripsi</th>
                  </>
                )}

                {activeTab === "peminjaman" && (
                  <>
                    <th className="py-3 px-4 text-center">Peminjam</th>
                    <th className="py-3 px-4 text-center">Barang</th>
                    <th className="py-3 px-4 text-center">Jadwal Pinjam</th>
                    <th className="py-3 px-4 text-center">Surat</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </>
                )}

                <th className="py-3 px-4 text-center w-24">{activeTab === "inventaris" ? "Media" : activeTab === "peminjaman" ? "Tindakan" : "Berkas"}</th>
                {activeTab !== "peminjaman" && <th className="py-3 px-4 w-24 text-center">Aksi</th>}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700 bg-white">
              {currentListData.length === 0 ? (
                <tr><td colSpan="10" className="py-12 text-center text-slate-500">Tidak ada data ditemukan.</td></tr>
              ) : (
                currentListData.map((item, index) => {
                  return (
                    <tr key={index} className="hover:bg-slate-50 transition-colors group">
                      <td className="py-2.5 px-4 text-center font-medium text-slate-400">{index + 1}</td>
                        
                        {activeTab === "persuratan" && (
                          <>
                            <td className="py-2.5 px-4 font-semibold text-slate-800">{item.nomorSurat || "-"}</td>
                            <td className="py-2.5 px-4 text-slate-600 truncate max-w-[150px]">{activeSuratTab === "masuk" ? (item.asalSurat||"-") : (item.tujuanSurat||"-")}</td>
                            <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                              <div className="flex flex-col text-[11px]">
                                <span className="text-slate-500">B: <strong className="text-slate-700">{formatDisplayDate(item.tglBuat)}</strong></span>
                                <span className={activeSuratTab === "masuk" ? "text-emerald-600" : "text-blue-600"}>
                                  <strong>{activeSuratTab === "masuk" ? "D: " : "K: "}</strong> {formatDisplayDate(activeSuratTab === "masuk" ? item.tglDatang : item.tglKirim)}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 truncate max-w-[150px]">{item.hal || item.perihalSurat || "-"}</td>
                            <td className="py-2.5 px-4 text-slate-500 truncate max-w-[150px]">{item.ket || item.deskripsiSurat || "-"}</td>
                          </>
                        )}

                        {activeTab === "proker" && (
                          <>
                            <td className="py-2.5 px-4 font-semibold text-slate-800 truncate max-w-[200px]">
                              {item.namaProker || "-"} <br/><span className="text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold">{item.pelaksanaProker}</span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 truncate max-w-[200px]">
                              <p className="font-medium text-slate-700 truncate">{item.sasaran || "Umum"}</p>
                              <p className="text-[11px] truncate text-slate-400">{item.tujuan || "-"}</p>
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">{formatDisplayDate(item.waktuPelaksanaan)}</td>
                            <td className="py-2.5 px-4 text-slate-600 truncate max-w-[120px]">{item.penanggungJawab || "-"}</td>
                            <td className="py-2.5 px-4 font-mono text-emerald-600 font-semibold text-[12px]">{item.estimasiDana || "-"}</td>
                          </>
                        )}

                        {(activeTab === "produkhukum" || activeTab === "laporan") && (
                          <>
                            <td className="py-2.5 px-4">
                              <p className="font-semibold text-slate-800 truncate max-w-[250px]">{activeTab === "produkhukum" ? item.nomorSK : item.namaLaporan}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[250px]">{activeTab === "produkhukum" ? item.tentangHukum : item.periode}</p>
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 truncate max-w-[350px]">{item.deskripsiHukum || item.deskripsiLaporan || "-"}</td>
                          </>
                        )}

                        {activeTab === "presentasi" && (
                          <>
                            <td className="py-2.5 px-4 font-semibold text-slate-800 truncate max-w-[250px]">{item.judul || "-"}</td>
                            <td className="py-2.5 px-4 text-center"><span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{item.tipeDokumen || "File"}</span></td>
                            <td className="py-2.5 px-4 text-slate-500 truncate max-w-[250px]">{item.deskripsi || "-"}</td>
                          </>
                        )}

                        {activeTab === "inventaris" && (
                          <>
                            <td className="py-2.5 px-4 font-semibold text-slate-800 truncate max-w-[200px]">{item.namaBarang || "-"}</td>
                            <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-700 bg-slate-50/50">{item.jumlah || "0"}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${item.kondisi === 'Baik' ? 'text-emerald-600' : item.kondisi === 'Rusak Ringan' ? 'text-amber-600' : 'text-red-600'}`}>
                                {item.kondisi || "Baik"}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-500 max-w-[300px]">
                              <div className="truncate font-medium">{item.deskripsi || "-"}</div>
                            </td>
                          </>
                        )}

                        {activeTab === "peminjaman" && (
                          <>
                            <td className="py-2.5 px-4 truncate max-w-[200px]">
                               <p className="font-bold text-slate-800 text-[12px]">{item.namaOrganisasi}</p>
                               <p className="text-[11px] text-slate-500">{item.peminjam} • {item.kegiatan}</p>
                            </td>
                            <td className="py-2.5 px-4">
                               <p className="font-semibold text-slate-900 line-clamp-1">{item.namaBarang}</p>
                               <span className="text-[10px] font-bold text-slate-500">{item.jumlahPinjam} Unit</span>
                            </td>
                            <td className="py-2.5 px-4 text-[11px] font-mono text-slate-600">
                               {formatDisplayDate(item.waktuPinjam)} <br/><span className="text-slate-400 text-[10px]">sampai</span><br/> {formatDisplayDate(item.waktuSelesai)}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {item.suratUrl ? (
                                <a href={item.suratUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-[11px] font-semibold">Lihat</a>
                              ) : <span className="text-slate-400 text-[11px]">-</span>}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {item.status === "Disetujui" ? (
                                <span className="text-emerald-600 text-[11px] font-bold uppercase flex items-center justify-center gap-1"><CheckCircle size={12}/> ACC</span>
                              ) : item.status === "Ditolak" ? (
                                <span className="text-red-600 text-[11px] font-bold uppercase flex items-center justify-center gap-1"><XCircle size={12}/> Tolak</span>
                              ) : (
                                <span className="text-amber-600 text-[11px] font-bold uppercase flex items-center justify-center gap-1"><Loader2 size={12} className="animate-spin"/> Proses</span>
                              )}
                            </td>
                          </>
                        )}

                        {/* TOMBOL BERKAS / GAMBAR */}
                        <td className="py-2.5 px-4 text-center">
                          {activeTab === "presentasi" ? (
                             <div className="flex gap-1 items-center justify-center">
                               {item.embedUrl && <a href={item.embedUrl} target="_blank" className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition" title="Lihat Embed"><MonitorPlay size={14}/></a>}
                               {item.downloadUrl && <a href={item.downloadUrl} target="_blank" className="p-1.5 text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100 transition" title="Unduh"><Download size={14}/></a>}
                             </div>
                          ) : activeTab === "inventaris" ? (
                             <div className="flex justify-center">
                               {item.fotoGroup?.length > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-slate-600 text-[11px] font-medium bg-slate-100 px-2 py-0.5 rounded"><Camera size={12}/> {item.fotoGroup.length} Foto</span>
                               ) : <span className="text-slate-400 text-[11px]">-</span>}
                             </div>
                          ) : activeTab === "peminjaman" ? (
                             <div className="flex items-center justify-center gap-1">
                               {item.status === "Diproses" && (
                                  <>
                                    <button onClick={() => handleUpdateStatusPeminjaman(item.id, "Disetujui")} className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded transition" title="Setujui"><CheckCircle size={14}/></button>
                                    <button onClick={() => handleUpdateStatusPeminjaman(item.id, "Ditolak")} className="text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded transition" title="Tolak"><XCircle size={14}/></button>
                                  </>
                               )}
                             </div>
                          ) : (
                              item.linkFile ? (
                                 <a href={item.linkFile} target="_blank" className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 px-2 py-1 rounded transition"><Download size={12}/> File</a>
                              ) : <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>

                        {/* TOMBOL AKSI */}
                        {activeTab !== "peminjaman" && (
                          <td className="py-2.5 px-4 text-center">
                            <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleOpenModal(item)} className="text-slate-400 hover:text-blue-600 p-1.5 hover:bg-slate-100 rounded transition"><Edit size={14}/></button>
                              <button onClick={() => handleDeleteData(item.id)} className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-slate-100 rounded transition"><Trash2 size={14}/></button>
                            </div>
                          </td>
                        )}

                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL MANAJEMEN KATEGORI LSO */}
      {isLsoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-md shadow-xl overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
               <h2 className="font-bold text-slate-800 text-[14px] flex items-center gap-2"><Tag size={16} className="text-blue-600"/> Kelola Kategori LSO</h2>
               <button onClick={() => setIsLsoModalOpen(false)} className="text-slate-400 hover:text-slate-800 transition"><X size={16}/></button>
            </div>
            <div className="p-5">
               <form onSubmit={handleAddLSO} className="flex gap-2 mb-4">
                 <input type="text" value={newLsoName} onChange={e=>setNewLsoName(e.target.value)} className={inputStandardClass} placeholder="Nama LSO Baru..." required />
                 <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-md text-[13px] font-bold hover:bg-slate-900 shrink-0">Tambah</button>
               </form>
               <div className="border border-slate-200 rounded-md max-h-64 overflow-y-auto">
                 {listLSO.length === 0 ? <p className="text-[12px] text-slate-500 text-center py-4">Belum ada Kategori LSO Kustom.</p> : (
                   <ul className="divide-y divide-slate-100">
                     {listLSO.map(lso => (
                       <li key={lso} className="flex justify-between items-center px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
                         {lso}
                         <button onClick={() => handleDeleteLSO(lso)} className="text-slate-400 hover:text-red-500 p-1 transition"><Trash2 size={14}/></button>
                       </li>
                     ))}
                   </ul>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM TAMBAH/EDIT DATA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center shrink-0">
               <h2 className="font-bold text-slate-800 text-[14px] flex items-center gap-2">
                  {editDataId ? <Edit size={16} className="text-amber-500"/> : <Plus size={16} className="text-blue-600"/>}
                  {editDataId ? "Edit Data Arsip" : "Tambah Data Baru"}
               </h2>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800 transition"><X size={16}/></button>
            </div>

            <div className="p-6 overflow-y-auto bg-white flex-1">
               <form id="arsipForm" onSubmit={handleSaveData} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {activeTab === "persuratan" && (
                    <>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Nomor Surat</label>
                        <input type="text" required value={formData.nomorSurat || ''} onChange={e => setFormData({...formData, nomorSurat: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>{activeSuratTab === "masuk" ? "Asal Surat" : "Tujuan Surat"}</label>
                        <input type="text" required value={activeSuratTab === "masuk" ? formData.asalSurat || '' : formData.tujuanSurat || ''} onChange={e => setFormData({...formData, [activeSuratTab === "masuk" ? "asalSurat" : "tujuanSurat"]: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div>
                        <label className={labelStandardClass}>Tanggal Pembuatan</label>
                        <input type="date" value={formData.tglBuat || ''} onChange={e => setFormData({...formData, tglBuat: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div>
                        <label className={labelStandardClass}>{activeSuratTab === "masuk" ? "Tanggal Diterima" : "Tanggal Dikirim"}</label>
                        <input type="date" value={activeSuratTab === "masuk" ? formData.tglDatang || '' : formData.tglKirim || ''} onChange={e => setFormData({...formData, [activeSuratTab === "masuk" ? "tglDatang" : "tglKirim"]: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Perihal / Hal</label>
                        <input type="text" value={formData.hal || ''} onChange={e => setFormData({...formData, hal: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Keterangan (Opsional)</label>
                        <input type="text" value={formData.ket || ''} onChange={e => setFormData({...formData, ket: e.target.value})} className={inputStandardClass} placeholder="Contoh: Sangat Penting, Segera..." />
                      </div>
                    </>
                  )}

                  {activeTab === "proker" && (
                    <>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Nama Program Kerja</label>
                        <input type="text" required value={formData.namaProker || ''} onChange={e => setFormData({...formData, namaProker: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div>
                        <label className={labelStandardClass}>Biro / Pelaksana</label>
                        <input type="text" required value={formData.pelaksanaProker || ''} onChange={e => setFormData({...formData, pelaksanaProker: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div>
                        <label className={labelStandardClass}>Waktu Pelaksanaan</label>
                        <input type="date" value={formData.waktuPelaksanaan || ''} onChange={e => setFormData({...formData, waktuPelaksanaan: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Tujuan Kegiatan</label>
                        <textarea rows="2" value={formData.tujuan || ''} onChange={e => setFormData({...formData, tujuan: e.target.value})} className={`${inputStandardClass} resize-none`} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Indikator Keberhasilan</label>
                        <textarea rows="2" value={formData.indikator || ''} onChange={e => setFormData({...formData, indikator: e.target.value})} className={`${inputStandardClass} resize-none`} />
                      </div>
                      <div>
                        <label className={labelStandardClass}>Sasaran</label>
                        <input type="text" value={formData.sasaran || ''} onChange={e => setFormData({...formData, sasaran: e.target.value})} className={inputStandardClass} placeholder="Misal: Kader Baru" />
                      </div>
                      <div>
                        <label className={labelStandardClass}>Penanggung Jawab</label>
                        <input type="text" value={formData.penanggungJawab || ''} onChange={e => setFormData({...formData, penanggungJawab: e.target.value})} className={inputStandardClass} placeholder="Nama Koordinator" />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Estimasi Dana</label>
                        <input type="text" value={formData.estimasiDana || ''} onChange={e => setFormData({...formData, estimasiDana: e.target.value})} className={inputStandardClass} placeholder="Misal: Rp 1.500.000" />
                      </div>
                    </>
                  )}

                  {activeTab === "produkhukum" && (
                    <>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Nomor SK / Ketetapan</label>
                        <input type="text" required value={formData.nomorSK || ''} onChange={e => setFormData({...formData, nomorSK: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Tentang</label>
                        <textarea rows="2" required value={formData.tentangHukum || ''} onChange={e => setFormData({...formData, tentangHukum: e.target.value})} className={`${inputStandardClass} resize-none`} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Deskripsi Singkat Hukum</label>
                        <textarea rows="2" value={formData.deskripsiHukum || ''} onChange={e => setFormData({...formData, deskripsiHukum: e.target.value})} className={`${inputStandardClass} resize-none`} />
                      </div>
                    </>
                  )}

                  {activeTab === "laporan" && (
                    <>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Nama / Judul Laporan</label>
                        <input type="text" required value={formData.namaLaporan || ''} onChange={e => setFormData({...formData, namaLaporan: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Periode Laporan</label>
                        <input type="text" value={formData.periode || ''} onChange={e => setFormData({...formData, periode: e.target.value})} className={inputStandardClass} placeholder="Misal: Tahun 2024" />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Deskripsi Singkat Laporan</label>
                        <textarea rows="2" value={formData.deskripsiLaporan || ''} onChange={e => setFormData({...formData, deskripsiLaporan: e.target.value})} className={`${inputStandardClass} resize-none`} />
                      </div>
                    </>
                  )}

                  {activeTab === "presentasi" && (
                    <>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Judul Presentasi / Dokumen</label>
                        <input type="text" required value={formData.judul || ''} onChange={e => setFormData({...formData, judul: e.target.value})} className={inputStandardClass} placeholder="Contoh: Materi Kaderisasi" />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Tipe Dokumen</label>
                        <select value={formData.tipeDokumen || 'Canva'} onChange={e => setFormData({...formData, tipeDokumen: e.target.value})} className={inputStandardClass}>
                          <option value="Canva">Presentasi Canva</option>
                          <option value="Google Docs">Google Docs (Word)</option>
                          <option value="Google Sheets">Google Sheets (Excel)</option>
                          <option value="Google Slides">Google Slides (PPT)</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Deskripsi Singkat</label>
                        <textarea rows="2" value={formData.deskripsi || ''} onChange={e => setFormData({...formData, deskripsi: e.target.value})} className={`${inputStandardClass} resize-none`} />
                      </div>
                      <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                        <label className={labelStandardClass}>Link Sematkan (Embed URL)</label>
                        <input type="url" value={formData.embedUrl || ''} onChange={e => setFormData({...formData, embedUrl: e.target.value})} className={`${inputStandardClass} font-mono text-xs`} placeholder="Masukkan link dari menu Bagikan > Sematkan..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Link File Unduhan (Opsional)</label>
                        <input type="url" value={formData.downloadUrl || ''} onChange={e => setFormData({...formData, downloadUrl: e.target.value})} className={`${inputStandardClass} font-mono text-xs`} placeholder="Link Google Drive, dll..." />
                      </div>
                    </>
                  )}

                  {activeTab === "inventaris" && (
                    <>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Nama Barang</label>
                        <input type="text" required value={formData.namaBarang || ''} onChange={e => setFormData({...formData, namaBarang: e.target.value})} className={inputStandardClass} placeholder="Contoh: Proyektor Epson..." />
                      </div>
                      <div>
                        <label className={labelStandardClass}>Jumlah Stok</label>
                        <input type="number" required min="1" value={formData.jumlah || ''} onChange={e => setFormData({...formData, jumlah: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div>
                        <label className={labelStandardClass}>Kondisi Barang</label>
                        <select value={formData.kondisi || 'Baik'} onChange={e => setFormData({...formData, kondisi: e.target.value})} className={inputStandardClass}>
                          <option value="Baik">Baik</option>
                          <option value="Rusak Ringan">Rusak Ringan</option>
                          <option value="Rusak Berat">Rusak Berat</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Deskripsi Detail</label>
                        <textarea rows="2" value={formData.deskripsi || ''} onChange={e => setFormData({...formData, deskripsi: e.target.value})} className={`${inputStandardClass} resize-none`} />
                      </div>

                      <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                        <label className={labelStandardClass}>Upload Foto Barang (Cloudinary)</label>
                        <input type="file" multiple accept="image/*" onChange={(e) => uploadToCloudinary(e.target.files)} className="text-[12px]" disabled={isUploadingFoto} />
                        {isUploadingFoto && <p className="text-[11px] text-blue-600 mt-2 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Mengunggah...</p>}
                        {fotoUrls.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 bg-slate-50 p-2 rounded border border-slate-200">
                            {fotoUrls.map((url, idx) => (
                              <div key={idx} className="relative w-16 h-16 rounded overflow-hidden border border-slate-300 group">
                                <img src={url} alt="preview" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeFoto(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded shadow-sm opacity-0 group-hover:opacity-100"><X size={12} /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {activeTab !== "presentasi" && activeTab !== "inventaris" && (
                    <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                      <label className={labelStandardClass}>Link File Arsip Lengkap</label>
                      <input type="url" value={formData.linkFile || ''} onChange={e => setFormData({...formData, linkFile: e.target.value})} className={`${inputStandardClass} font-mono text-xs`} placeholder="https://drive.google.com/..." />
                    </div>
                  )}
               </form>
            </div>
            
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-end gap-3 shrink-0">
               <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-200 rounded-md transition">Batal</button>
               <button type="submit" form="arsipForm" disabled={isUploadingFoto} className={`text-[13px] font-medium px-6 py-2 rounded-md shadow-sm transition flex items-center gap-2 ${isUploadingFoto ? 'bg-slate-400 text-slate-200 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                  <Save size={14}/> Simpan Data
               </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}