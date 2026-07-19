// app/admin/administrasi/page.js
"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc, query } from "firebase/firestore";
import * as XLSX from "xlsx";
import { 
  FolderArchive, Mail, Briefcase, Scale, FileCheck, Inbox, Send, Search, 
  Download, Plus, Trash2, Edit, Save, FileSpreadsheet, Building2, 
  Loader2, Sparkles, X, ExternalLink, UploadCloud, MonitorPlay, Package, Camera, ClipboardList, CheckCircle, XCircle
} from "lucide-react";

export default function AdminAdministrasi() {
  const [loading, setLoading] = useState(true);
  const [activeLembaga, setActiveLembaga] = useState("Komisariat"); 
  const [listLSO, setListLSO] = useState([]); 
  
  const [masterSuratMasuk, setMasterSuratMasuk] = useState([]); 
  const [masterSuratKeluar, setMasterSuratKeluar] = useState([]); 
  const [masterProker, setMasterProker] = useState([]);
  const [masterProdukHukum, setMasterProdukHukum] = useState([]);
  const [masterLpj, setMasterLpj] = useState([]); 
  const [masterPresentasi, setMasterPresentasi] = useState([]); 
  const [masterInventaris, setMasterInventaris] = useState([]); 
  const [masterPeminjaman, setMasterPeminjaman] = useState([]);
  
  const [activeTab, setActiveTab] = useState("persuratan"); 
  const [activeSuratTab, setActiveSuratTab] = useState("masuk"); 
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDataId, setEditDataId] = useState(null);
  const [formData, setFormData] = useState({});
  const [expandedRowId, setExpandedRowId] = useState(null);
  
  const [fotoUrls, setFotoUrls] = useState([]); 
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false); 
  
  const excelInputRef = useRef(null);

  const inputStandardClass = "w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm bg-white";
  const labelStandardClass = "text-xs font-semibold text-slate-700 block mb-1.5";

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
      }
    } catch (error) { console.error("Gagal menarik database:", error); } 
    finally { setLoading(false); }
  }

  async function fetchPeminjamanData() {
    try {
      const q = query(collection(db, "peminjaman_inventaris"));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(b.waktuPinjam) - new Date(a.waktuPinjam));
      setMasterPeminjaman(data);
    } catch (error) { console.error("Gagal mengambil data peminjaman:", error); }
  }

  const handleUpdateStatusPeminjaman = async (pengajuan, newStatus) => {
    if (!confirm(`Yakin ingin mengubah status pengajuan ini menjadi ${newStatus}? Notifikasi email otomatis akan dikirim ke penyewa.`)) return;
    
    setIsSendingEmail(true); 
    try {
      await updateDoc(doc(db, "peminjaman_inventaris", pengajuan.id), { status: newStatus });
      setMasterPeminjaman(prev => prev.map(p => p.id === pengajuan.id ? { ...p, status: newStatus } : p));
      
      if (pengajuan.emailPenyewa) {
         try {
           await fetch('/api/email', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               email: pengajuan.emailPenyewa,
               namaBarang: pengajuan.namaBarang,
               namaOrganisasi: pengajuan.namaOrganisasi,
               kegiatan: pengajuan.kegiatan,
               waktuPinjam: formatDisplayDate(pengajuan.waktuPinjam) + ` (Jam: ${pengajuan.jamPinjam || '-'})`,
               waktuSelesai: formatDisplayDate(pengajuan.waktuSelesai) + ` (Jam: ${pengajuan.jamSelesai || '-'})`,
               status: newStatus
             })
           });
         } catch (emailErr) {
           console.error("Gagal kirim email otomatis:", emailErr);
           alert("Data berhasil di ACC di sistem, namun gagal mengirim notifikasi email (cek log).");
         }
      }

      alert(`Berhasil! Pengajuan peminjaman telah ${newStatus}.`);
    } catch (error) {
      alert("Gagal mengubah status: " + error.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDeleteRiwayatPeminjaman = async (id) => {
    if (!confirm("Hapus log/riwayat peminjaman ini secara permanen dari server?")) return;
    try {
      await deleteDoc(doc(db, "peminjaman_inventaris", id));
      setMasterPeminjaman(prev => prev.filter(p => p.id !== id));
      alert("Riwayat berhasil dihapus.");
    } catch (error) {
      alert("Gagal menghapus riwayat: " + error.message);
    }
  };

  const uploadToCloudinary = async (files) => {
    if (!files || files.length === 0) return;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME; 
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET; 
    if (!cloudName || !uploadPreset) { alert("Error: Konfigurasi Cloudinary di file .env belum lengkap!"); return; }

    setIsUploadingFoto(true);
    const uploadedUrls = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i]; const formDataObj = new FormData();
      formDataObj.append("file", file); formDataObj.append("upload_preset", uploadPreset);
      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formDataObj });
        const data = await res.json();
        if (data.secure_url) uploadedUrls.push(data.secure_url.replace("/upload/", "/upload/q_auto,f_auto/"));
      } catch (err) { alert(`Gagal mengunggah ${file.name}.`); }
    }
    setFotoUrls((prev) => [...prev, ...uploadedUrls]);
    setIsUploadingFoto(false);
  };
  const removeFoto = (indexToRemove) => { setFotoUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove)); };

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
        if (parts[0].length === 4) return new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].substring(0, 2)}T00:00:00`).getTime();
        else if (parts[2].length >= 4) return new Date(`${parts[2].substring(0, 4)}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T00:00:00`).getTime();
      }
    }
    if (!isNaN(dateVal) && Number(dateVal) > 20000) return new Date(Math.round((Number(dateVal) - 25569) * 86400 * 1000)).getTime();
    const d = new Date(dateVal);
    return isNaN(d) ? 0 : d.getTime();
  };

  // Fungsi helper membuat slug (Untuk URL yang lebih cantik)
  const createSlug = (text) => {
    if (!text) return "";
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const filterByLembaga = (dataArray) => { return dataArray.filter(item => (item.lembaga || "Komisariat") === activeLembaga); };

  // 🔥 URUTAN SURAT MASUK DIPERBAIKI: ASCENDING (Tanggal Awal/Lama di Atas) 🔥
  const currentSuratMasuk = filterByLembaga(masterSuratMasuk).sort((a, b) => getSortableDate(a.tglDatang) - getSortableDate(b.tglDatang));
  
  const currentSuratKeluar = filterByLembaga(masterSuratKeluar).sort((a, b) => {
    const getNum = (str) => { const match = (str || "").match(/\d+/); return match ? parseInt(match[0], 10) : 999999; };
    const numA = getNum(a.nomorSurat); const numB = getNum(b.nomorSurat);
    if (numA !== numB) return numA - numB; return (a.nomorSurat || "").localeCompare(b.nomorSurat || "");
  });

  const currentProker = filterByLembaga(masterProker);
  const currentProdukHukum = filterByLembaga(masterProdukHukum);
  const currentLpj = filterByLembaga(masterLpj);
  const currentPresentasi = filterByLembaga(masterPresentasi);
  const currentInventaris = filterByLembaga(masterInventaris);

  const getFilteredData = () => {
    const q = searchQuery.toLowerCase();
    if (activeTab === "persuratan") {
      const targetData = activeSuratTab === "masuk" ? currentSuratMasuk : currentSuratKeluar;
      return targetData.filter(i => (i.nomorSurat||"").toLowerCase().includes(q) || (i.hal||i.perihalSurat||"").toLowerCase().includes(q) || (i.asalSurat||i.tujuanSurat||"").toLowerCase().includes(q));
    } else if (activeTab === "proker") {
      return currentProker.filter(i => (i.namaProker||"").toLowerCase().includes(q) || (i.pelaksanaProker||"").toLowerCase().includes(q) || (i.penanggungJawab||"").toLowerCase().includes(q));
    } else if (activeTab === "produkhukum") {
      return currentProdukHukum.filter(i => (i.nomorSK||"").toLowerCase().includes(q) || (i.tentangHukum||"").toLowerCase().includes(q));
    } else if (activeTab === "laporan") {
      return currentLpj.filter(i => (i.namaLaporan||"").toLowerCase().includes(q) || (i.periode||"").toLowerCase().includes(q));
    } else if (activeTab === "presentasi") {
      return currentPresentasi.filter(i => (i.judul||"").toLowerCase().includes(q) || (i.tipeDokumen||"").toLowerCase().includes(q) || (i.deskripsi||"").toLowerCase().includes(q));
    } else if (activeTab === "inventaris") {
      return currentInventaris.filter(i => (i.namaBarang||"").toLowerCase().includes(q) || (i.kondisi||"").toLowerCase().includes(q) || (i.deskripsi||"").toLowerCase().includes(q));
    } else if (activeTab === "peminjaman") {
      return masterPeminjaman.filter(i => (i.namaBarang||"").toLowerCase().includes(q) || (i.namaOrganisasi||"").toLowerCase().includes(q) || (i.peminjam||"").toLowerCase().includes(q) || (i.emailPenyewa||"").toLowerCase().includes(q));
    }
    return [];
  };
  const currentListData = getFilteredData();

  const handleOpenModal = (data = null) => {
    if (data) {
      setEditDataId(data.id || Math.random());
      setFormData(data);
      if (activeTab === "inventaris" && data.fotoGroup) setFotoUrls(data.fotoGroup); else setFotoUrls([]);
    } else {
      setEditDataId(null); setFormData({ lembaga: activeLembaga }); setFotoUrls([]);
    }
    setIsModalOpen(true);
  };

  const handleSaveData = async (e) => {
    e.preventDefault();
    if (isUploadingFoto) { alert("Harap tunggu, foto sedang diunggah..."); return; }

    try {
      let finalPayload = { ...formData, id: editDataId || Date.now().toString(), lembaga: activeLembaga };
      let newMaster;

      if (activeTab === "inventaris") {
        finalPayload = { ...finalPayload, fotoGroup: fotoUrls, slug: createSlug(formData.namaBarang) }; // 🔥 Menyisipkan SLUG
      }

      if (activeTab === "persuratan") {
        if (activeSuratTab === "masuk") { newMaster = editDataId ? masterSuratMasuk.map(i => i.id === editDataId ? finalPayload : i) : [finalPayload, ...masterSuratMasuk]; setMasterSuratMasuk(newMaster); } 
        else { newMaster = editDataId ? masterSuratKeluar.map(i => i.id === editDataId ? finalPayload : i) : [finalPayload, ...masterSuratKeluar]; setMasterSuratKeluar(newMaster); }
      } else if (activeTab === "proker") { newMaster = editDataId ? masterProker.map(i => i.id === editDataId ? finalPayload : i) : [finalPayload, ...masterProker]; setMasterProker(newMaster);
      } else if (activeTab === "produkhukum") { newMaster = editDataId ? masterProdukHukum.map(i => i.id === editDataId ? finalPayload : i) : [finalPayload, ...masterProdukHukum]; setMasterProdukHukum(newMaster);
      } else if (activeTab === "laporan") { newMaster = editDataId ? masterLpj.map(i => i.id === editDataId ? finalPayload : i) : [finalPayload, ...masterLpj]; setMasterLpj(newMaster);
      } else if (activeTab === "presentasi") { newMaster = editDataId ? masterPresentasi.map(i => i.id === editDataId ? finalPayload : i) : [finalPayload, ...masterPresentasi]; setMasterPresentasi(newMaster); if (!finalPayload.createdAt) finalPayload.createdAt = new Date().toISOString();
      } else if (activeTab === "inventaris") { newMaster = editDataId ? masterInventaris.map(i => i.id === editDataId ? finalPayload : i) : [finalPayload, ...masterInventaris]; setMasterInventaris(newMaster); if (!finalPayload.createdAt) finalPayload.createdAt = new Date().toISOString(); }

      await saveDataToFirebase(activeTab, activeSuratTab, newMaster);
      alert("Data berhasil disimpan!"); setIsModalOpen(false);
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
    } catch (error) { alert("Gagal menghapus: " + error.message); }
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

  // 🔥 1. TOMBOL EXCEL DIPERBAIKI AGAR MUNCUL KEMBALI 🔥
  const handleDownloadTemplate = () => {
    let templateData = [];
    if (activeTab === "persuratan") {
      templateData = [{
        "Nomor Surat": "001/PMII/2026",
        "Asal/Tujuan Surat": "PC PMII Kota Malang",
        "Tanggal Buat (YYYY-MM-DD)": "2026-06-01",
        "Tanggal Terima/Kirim (YYYY-MM-DD)": "2026-06-02",
        "Perihal": "Undangan Kegiatan",
        "Keterangan": "Surat Penting",
        "Link Berkas": "https://drive.google.com/..."
      }];
    } else if (activeTab === "proker") {
      templateData = [{
        "Nama Program Kerja": "Pelatihan Jurnalistik",
        "Biro / Pelaksana": "Biro Media",
        "Waktu Pelaksanaan (YYYY-MM-DD)": "2026-07-15",
        "Tujuan Kegiatan": "Meningkatkan kemampuan menulis kader",
        "Indikator": "50 Peserta mampu menulis opini",
        "Sasaran": "Anggota Baru",
        "Penanggung Jawab": "Ahmad Albert",
        "Estimasi Dana": "Rp 500.000",
        "Link Berkas": ""
      }];
    } else if (activeTab === "produkhukum") {
      templateData = [{
        "Nomor SK / Ketetapan": "01/SK/PMII/2026",
        "Tentang": "Pengesahan Pengurus Rayon",
        "Deskripsi Singkat": "Mengesahkan kepengurusan Rayon untuk masa khidmat 2026-2027",
        "Link Berkas": ""
      }];
    } else if (activeTab === "laporan") {
      templateData = [{
        "Nama Laporan": "LPJ Panitia RTK",
        "Periode": "Tahun 2026",
        "Deskripsi Singkat": "Laporan akhir panitia Rapat Tahunan",
        "Link Berkas": ""
      }];
    } else if (activeTab === "presentasi") {
      templateData = [{
        "Judul Dokumen": "Materi Kaderisasi PMII",
        "Tipe Dokumen (Canva/Google Docs/Google Sheets/Google Slides)": "Canva",
        "Deskripsi Singkat": "Materi wajib anggota baru",
        "Link Sematkan (Embed)": "https://www.canva.com/design/.../view?embed",
        "Link Unduh (PDF/PPTX)": "https://firebasestorage.googleapis.com/..."
      }];
    } else if (activeTab === "inventaris") {
      templateData = [{
        "Nama Barang": "Proyektor Epson XY-100",
        "Jumlah": "2",
        "Kondisi (Baik/Rusak Ringan/Rusak Berat)": "Baik",
        "Deskripsi": "Lengkap dengan tas dan kabel HDMI",
        "Link Foto 1 (Pisahkan dgn koma jika banyak)": "https://res.cloudinary.com/..."
      }];
    }

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Template_${activeTab}`);
    XLSX.writeFile(wb, `Template_Impor_${activeTab.toUpperCase()}.xlsx`);
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        let updatedData = [];
        if (activeTab === "persuratan") {
          const isMasuk = activeSuratTab === "masuk";
          updatedData = data.map(row => ({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
            lembaga: activeLembaga,
            nomorSurat: row["Nomor Surat"] || "",
            hal: row["Perihal"] || "",
            ket: row["Keterangan"] || "",
            tglBuat: row["Tanggal Buat (YYYY-MM-DD)"] || "",
            linkFile: row["Link Berkas"] || "",
            ...(isMasuk 
              ? { asalSurat: row["Asal/Tujuan Surat"] || "", tglDatang: row["Tanggal Terima/Kirim (YYYY-MM-DD)"] || "" } 
              : { tujuanSurat: row["Asal/Tujuan Surat"] || "", tglKirim: row["Tanggal Terima/Kirim (YYYY-MM-DD)"] || "" })
          }));
          const newMaster = [...updatedData, ...(isMasuk ? masterSuratMasuk : masterSuratKeluar)];
          if (isMasuk) setMasterSuratMasuk(newMaster); else setMasterSuratKeluar(newMaster);
          await saveDataToFirebase(activeTab, activeSuratTab, newMaster);
        } else if (activeTab === "proker") {
          updatedData = data.map(row => ({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
            lembaga: activeLembaga,
            namaProker: row["Nama Program Kerja"] || "",
            pelaksanaProker: row["Biro / Pelaksana"] || "",
            waktuPelaksanaan: row["Waktu Pelaksanaan (YYYY-MM-DD)"] || "",
            tujuan: row["Tujuan Kegiatan"] || "",
            indikator: row["Indikator"] || "",
            sasaran: row["Sasaran"] || "",
            penanggungJawab: row["Penanggung Jawab"] || "",
            estimasiDana: row["Estimasi Dana"] || "",
            linkFile: row["Link Berkas"] || ""
          }));
          const newMaster = [...updatedData, ...masterProker];
          setMasterProker(newMaster);
          await saveDataToFirebase(activeTab, null, newMaster);
        } else if (activeTab === "produkhukum") {
          updatedData = data.map(row => ({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
            lembaga: activeLembaga,
            nomorSK: row["Nomor SK / Ketetapan"] || "",
            tentangHukum: row["Tentang"] || "",
            deskripsiHukum: row["Deskripsi Singkat"] || "",
            linkFile: row["Link Berkas"] || ""
          }));
          const newMaster = [...updatedData, ...masterProdukHukum];
          setMasterProdukHukum(newMaster);
          await saveDataToFirebase(activeTab, null, newMaster);
        } else if (activeTab === "laporan") {
          updatedData = data.map(row => ({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
            lembaga: activeLembaga,
            namaLaporan: row["Nama Laporan"] || "",
            periode: row["Periode"] || "",
            deskripsiLaporan: row["Deskripsi Singkat"] || "",
            linkFile: row["Link Berkas"] || ""
          }));
          const newMaster = [...updatedData, ...masterLpj];
          setMasterLpj(newMaster);
          await saveDataToFirebase(activeTab, null, newMaster);
        } else if (activeTab === "presentasi") {
          updatedData = data.map(row => ({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
            lembaga: activeLembaga,
            judul: row["Judul Dokumen"] || "",
            tipeDokumen: row["Tipe Dokumen (Canva/Google Docs/Google Sheets/Google Slides)"] || "Canva",
            deskripsi: row["Deskripsi Singkat"] || "",
            embedUrl: row["Link Sematkan (Embed)"] || "",
            downloadUrl: row["Link Unduh (PDF/PPTX)"] || "",
            createdAt: new Date().toISOString()
          }));
          const newMaster = [...updatedData, ...masterPresentasi];
          setMasterPresentasi(newMaster);
          await saveDataToFirebase(activeTab, null, newMaster);
        } else if (activeTab === "inventaris") {
          updatedData = data.map(row => {
            const fotosText = row["Link Foto 1 (Pisahkan dgn koma jika banyak)"] || "";
            const fotoGroup = fotosText ? fotosText.split(',').map(u => u.trim()) : [];
            const namaBrg = row["Nama Barang"] || ""; 
            
            return {
              id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
              lembaga: activeLembaga,
              namaBarang: namaBrg,
              slug: createSlug(namaBrg), // 🔥 Memasukkan SLUG saat Import Excel
              jumlah: row["Jumlah"] || "1",
              kondisi: row["Kondisi (Baik/Rusak Ringan/Rusak Berat)"] || "Baik",
              deskripsi: row["Deskripsi"] || "",
              fotoGroup: fotoGroup,
              createdAt: new Date().toISOString()
            }
          });
          const newMaster = [...updatedData, ...masterInventaris];
          setMasterInventaris(newMaster);
          await saveDataToFirebase(activeTab, null, newMaster);
        }

        alert(`Berhasil mengimpor ${updatedData.length} data ke arsip ${activeTab.toUpperCase()} (${activeLembaga})!`);
      } catch (error) {
        alert("Gagal membaca file Excel. Pastikan format tabel sesuai dengan Template Unduhan.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  const handleExportExcel = () => {
    if (currentListData.length === 0) return alert("Tidak ada data untuk diekspor!");
    let formattedData = [];
    if (activeTab === "persuratan") {
      formattedData = currentListData.map((i, idx) => ({
        "No": idx + 1, "Nomor Surat": i.nomorSurat, [activeSuratTab === "masuk" ? "Asal Surat" : "Tujuan Surat"]: activeSuratTab === "masuk" ? i.asalSurat : i.tujuanSurat, "Tanggal Buat": i.tglBuat, [activeSuratTab === "masuk" ? "Tanggal Datang" : "Tanggal Kirim"]: activeSuratTab === "masuk" ? i.tglDatang : i.tglKirim, "Perihal": i.hal || i.perihalSurat, "Keterangan": i.ket || i.deskripsiSurat, "Link Berkas": i.linkFile
      }));
    } else if (activeTab === "proker") {
      formattedData = currentListData.map((i, idx) => ({
        "No": idx + 1, "Biro/Pelaksana": i.pelaksanaProker, "Nama Kegiatan": i.namaProker, "Tujuan": i.tujuan, "Indikator": i.indikator, "Sasaran": i.sasaran, "Waktu Pelaksanaan": i.waktuPelaksanaan, "Penanggung Jawab": i.penanggungJawab, "Estimasi Dana": i.estimasiDana, "Link Berkas": i.linkFile
      }));
    } else if (activeTab === "produkhukum") {
      formattedData = currentListData.map((i, idx) => ({
        "No": idx + 1, "Nomor SK": i.nomorSK, "Tentang Hukum": i.tentangHukum, "Deskripsi": i.deskripsiHukum, "Link Berkas": i.linkFile
      }));
    } else if (activeTab === "laporan") {
      formattedData = currentListData.map((i, idx) => ({
        "No": idx + 1, "Nama Laporan": i.namaLaporan, "Periode": i.periode, "Deskripsi Laporan": i.deskripsiLaporan, "Link Berkas": i.linkFile
      }));
    } else if (activeTab === "presentasi") {
      formattedData = currentListData.map((i, idx) => ({
        "No": idx + 1, "Judul Dokumen": i.judul, "Tipe Dokumen": i.tipeDokumen, "Deskripsi": i.deskripsi, "Link Sematkan (Embed)": i.embedUrl, "Link Unduh": i.downloadUrl
      }));
    } else if (activeTab === "inventaris") {
      formattedData = currentListData.map((i, idx) => ({
        "No": idx + 1, "Nama Barang": i.namaBarang, "Jumlah": i.jumlah, "Kondisi": i.kondisi, "Deskripsi": i.deskripsi
      }));
    } else if (activeTab === "peminjaman") {
      formattedData = currentListData.map((i, idx) => ({
        "No": idx + 1, "Nama Barang": i.namaBarang, "Organisasi": i.namaOrganisasi, "Peminjam / PJ": i.peminjam, "Kegiatan": i.kegiatan, "Jumlah Pinjam": i.jumlahPinjam, "Tanggal Mulai": i.waktuPinjam, "Tanggal Selesai": i.waktuSelesai, "Status": i.status
      }));
    }

    const ws = XLSX.utils.json_to_sheet(formattedData); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Arsip"); XLSX.writeFile(wb, `Rekap_${activeTab}_${Date.now()}.xlsx`);
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="text-blue-600 animate-spin"/></div>;

  return (
    <div className="space-y-6 pb-12 w-full text-sm">
      {/* HEADER PANEL & TABS */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">Sistem Administrasi</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola arsip surat, program kerja, produk hukum, laporan, dan inventaris barang.</p>
        </div>
        {(activeTab === "persuratan" || activeTab === "proker") && (
          <div className="bg-white p-2 rounded-md border border-slate-300 flex items-center gap-2 shadow-sm min-w-[250px]">
             <Building2 size={18} className="text-blue-600 ml-2" />
             <select value={activeLembaga} onChange={e => {setActiveLembaga(e.target.value); setSearchQuery("");}} className="w-full text-sm font-bold text-slate-800 bg-transparent border-none focus:ring-0 outline-none cursor-pointer">
                <option value="Komisariat">Administrasi Komisariat</option><option value="KOPRI">Administrasi KOPRI</option>
                {listLSO.map(lso => <option key={lso} value={lso}>Administrasi {lso}</option>)}
             </select>
          </div>
        )}
      </div>

      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-px scrollbar-none mb-4">
        <button onClick={() => {setActiveTab("persuratan"); setSearchQuery("");}} className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "persuratan" ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}><Mail size={16} /> Arsip Persuratan</button>
        <button onClick={() => {setActiveTab("proker"); setSearchQuery("");}} className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "proker" ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}><Briefcase size={16} /> Program Kerja</button>
        <button onClick={() => {setActiveTab("produkhukum"); setSearchQuery("");}} className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "produkhukum" ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}><Scale size={16} /> Produk Hukum</button>
        <button onClick={() => {setActiveTab("laporan"); setSearchQuery("");}} className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "laporan" ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}><FileCheck size={16} /> Laporan (LPJ)</button>
        <button onClick={() => {setActiveTab("presentasi"); setSearchQuery("");}} className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "presentasi" ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}><MonitorPlay size={16} /> Presentasi & Dok</button>
        <button onClick={() => {setActiveTab("inventaris"); setSearchQuery("");}} className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "inventaris" ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}><Package size={16} /> Inventaris Barang</button>
        <button onClick={() => {setActiveTab("peminjaman"); setSearchQuery("");}} className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "peminjaman" ? "border-emerald-600 text-emerald-600 bg-emerald-50/50 rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}><ClipboardList size={16} /> Pengajuan Pinjaman</button>
      </div>

      {/* FILTER & AKSI */}
      <div className="bg-white p-4 md:p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col xl:flex-row justify-between gap-4 items-center mb-6">
         <div className="flex w-full xl:w-auto gap-3 items-center">
           {activeTab === "persuratan" && (
             <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200 items-center shrink-0">
               <button onClick={() => setActiveSuratTab("masuk")} className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${activeSuratTab === "masuk" ? "bg-white text-blue-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}><Inbox size={14}/> S. Masuk</button>
               <button onClick={() => setActiveSuratTab("keluar")} className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${activeSuratTab === "keluar" ? "bg-white text-blue-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}><Send size={14}/> S. Keluar</button>
             </div>
           )}
           <div className="relative flex-1 xl:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
              <input type="text" placeholder={activeTab === "inventaris" ? "Cari barang..." : activeTab === "peminjaman" ? "Cari peminjam/email..." : "Cari arsip..."} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full px-3 py-2 pl-9 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm bg-white" />
           </div>
         </div>
         
         {/* KEMBALIKAN TOMBOL UPLOAD/DOWNLOAD EXCEL */}
         <div className="flex w-full xl:w-auto flex-wrap gap-2 justify-end">
           {activeTab !== "peminjaman" && (
             <>
               <button onClick={handleDownloadTemplate} className="flex-1 md:flex-none bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-md text-sm flex items-center justify-center gap-2 transition shadow-sm">
                  <Download size={16} /> <span className="hidden sm:inline">Template</span>
               </button>
               <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={excelInputRef} onChange={handleImportExcel} />
               <button onClick={() => excelInputRef.current.click()} className="flex-1 md:flex-none bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-md text-sm flex items-center justify-center gap-2 transition shadow-sm">
                  <UploadCloud size={16} /> <span className="hidden sm:inline">Impor</span>
               </button>
             </>
           )}
           <button onClick={handleExportExcel} className="flex-1 md:flex-none bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-md text-sm flex items-center justify-center gap-2 transition shadow-sm">
              <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Ekspor</span>
           </button>
           {activeTab !== "peminjaman" && (
             <button onClick={() => handleOpenModal()} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
                <Plus size={16} /> Tambah Data
             </button>
           )}
         </div>
      </div>

      {/* TABEL DATA RESPONSIF UNTUK HP */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left whitespace-nowrap min-w-max">
            <thead className="bg-slate-50 text-slate-600 text-[10px] md:text-xs uppercase font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 md:py-4 md:px-4 w-8 md:w-12 text-center">No</th>
                
                {activeTab === "persuratan" && (
                  <>
                    <th className="py-3 px-3 md:py-4 md:px-4">Nomor Surat</th>
                    <th className="py-3 px-3 md:py-4 md:px-4">{activeSuratTab === "masuk" ? "Asal Surat" : "Tujuan Surat"}</th>
                    <th className="py-3 px-3 md:py-4 md:px-4">Tanggal</th>
                    <th className="py-3 px-3 md:py-4 md:px-4">Perihal</th>
                    <th className="py-3 px-3 md:py-4 md:px-4 max-w-[200px]">Keterangan</th>
                  </>
                )}

                {activeTab === "proker" && (
                  <>
                    <th className="py-3 px-3 md:py-4 md:px-4">Nama Kegiatan</th>
                    <th className="py-3 px-3 md:py-4 md:px-4">Tujuan</th>
                    <th className="py-3 px-3 md:py-4 md:px-4">Indikator</th>
                    <th className="py-3 px-3 md:py-4 md:px-4">Sasaran</th>
                    <th className="py-3 px-3 md:py-4 md:px-4">Pelaksanaan</th>
                    <th className="py-3 px-3 md:py-4 md:px-4">PJ</th>
                    <th className="py-3 px-3 md:py-4 md:px-4">Dana</th>
                  </>
                )}

                {(activeTab === "produkhukum" || activeTab === "laporan") && (
                  <>
                    <th className="py-3 px-3 md:py-4 md:px-4">{activeTab === "produkhukum" ? "Nomor SK / Judul" : "Judul Laporan"}</th>
                    <th className="py-3 px-3 md:py-4 md:px-4 max-w-[300px]">Deskripsi Singkat</th>
                  </>
                )}

                {activeTab === "presentasi" && (
                  <>
                    <th className="py-3 px-3 md:py-4 md:px-4">Judul Dokumen</th>
                    <th className="py-3 px-3 md:py-4 md:px-4">Tipe</th>
                    <th className="py-3 px-3 md:py-4 md:px-4 max-w-[300px]">Deskripsi Singkat</th>
                  </>
                )}

                {activeTab === "inventaris" && (
                  <>
                    <th className="py-3 px-3 md:py-4 md:px-4">Nama Barang</th>
                    <th className="py-3 px-3 md:py-4 md:px-4 w-20 md:w-24 text-center">Jumlah</th>
                    <th className="py-3 px-3 md:py-4 md:px-4 w-28 md:w-32 text-center">Kondisi</th>
                    <th className="py-3 px-3 md:py-4 md:px-4 max-w-[300px]">Deskripsi</th>
                  </>
                )}

                {activeTab === "peminjaman" && (
                  <>
                    <th className="py-3 px-3 md:py-4 md:px-4">Barang & Jumlah</th>
                    <th className="py-3 px-3 md:py-4 md:px-4">Organisasi / Peminjam</th>
                    <th className="py-3 px-3 md:py-4 md:px-4">Kegiatan</th>
                    <th className="py-3 px-3 md:py-4 md:px-4">Jadwal Pinjam</th>
                    <th className="py-3 px-3 md:py-4 md:px-4 text-center">Surat</th>
                    <th className="py-3 px-3 md:py-4 md:px-4 text-center">Status ACC</th>
                  </>
                )}

                <th className="py-3 px-3 md:py-4 md:px-4 text-center">{activeTab === "inventaris" ? "Media" : activeTab === "peminjaman" ? "Tindakan" : "Berkas"}</th>
                {activeTab !== "peminjaman" && <th className="py-3 px-3 md:py-4 md:px-4 w-20 md:w-24 text-center">Aksi</th>}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 text-[11px] md:text-sm text-slate-700">
              {currentListData.length === 0 ? (
                <tr><td colSpan="10" className="py-16 text-center text-slate-500 font-medium">Belum ada data pada kategori ini.</td></tr>
              ) : (
                currentListData.map((item, index) => {
                  const isExpanded = expandedRowId === index;

                  return (
                    <React.Fragment key={index}>
                      <tr className={`transition-colors hover:bg-slate-50 cursor-pointer ${isExpanded ? 'bg-slate-50' : ''}`} onClick={() => setExpandedRowId(isExpanded ? null : index)}>
                        <td className="py-2 px-2 md:py-3 md:px-4 text-center font-medium text-slate-400">{index + 1}</td>
                        
                        {/* 🔥 TAMPILAN TANGGAL DIPERBAIKI 🔥 */}
                        {activeTab === "persuratan" && (
                          <>
                            <td className="py-2 px-2 md:py-3 md:px-4 font-semibold text-slate-900">{item.nomorSurat || "-"}</td>
                            <td className="py-2 px-2 md:py-3 md:px-4 text-slate-600">{activeSuratTab === "masuk" ? (item.asalSurat||"-") : (item.tujuanSurat||"-")}</td>
                            
                            <td className="py-2 px-2 md:py-3 md:px-4 text-slate-600 whitespace-nowrap">
                              <div className="flex flex-col gap-1 text-[10px] md:text-[11px]">
                                <span className="text-slate-500">Buat: <strong className="text-slate-700">{formatDisplayDate(item.tglBuat)}</strong></span>
                                <span className={activeSuratTab === "masuk" ? "text-emerald-600" : "text-blue-600"}>
                                  <strong>{activeSuratTab === "masuk" ? "+ Datang: " : "+ Kirim: "}</strong> {formatDisplayDate(activeSuratTab === "masuk" ? item.tglDatang : item.tglKirim)}
                                </span>
                              </div>
                            </td>

                            <td className="py-2 px-2 md:py-3 md:px-4 font-medium">{item.hal || item.perihalSurat || "-"}</td>
                            <td className="py-2 px-2 md:py-3 md:px-4 text-slate-500 truncate max-w-[150px]">{item.ket || item.deskripsiSurat || "-"}</td>
                          </>
                        )}

                        {activeTab === "proker" && (
                          <>
                            <td className="py-2 px-2 md:py-3 md:px-4 font-semibold text-slate-900">{item.namaProker || "-"}</td>
                            <td className="py-2 px-2 md:py-3 md:px-4 text-slate-600 truncate max-w-[150px]">{item.tujuan || "-"}</td>
                            <td className="py-2 px-2 md:py-3 md:px-4 text-slate-600 truncate max-w-[150px]">{item.indikator || "-"}</td>
                            <td className="py-2 px-2 md:py-3 md:px-4 text-slate-600">{item.sasaran || "-"}</td>
                            <td className="py-2 px-2 md:py-3 md:px-4 text-slate-600">{formatDisplayDate(item.waktuPelaksanaan)}</td>
                            <td className="py-2 px-2 md:py-3 md:px-4 text-slate-600">{item.penanggungJawab || "-"}</td>
                            <td className="py-2 px-2 md:py-3 md:px-4 font-mono text-emerald-600 font-semibold">{item.estimasiDana || "-"}</td>
                          </>
                        )}

                        {(activeTab === "produkhukum" || activeTab === "laporan") && (
                          <>
                            <td className="py-2 px-2 md:py-3 md:px-4">
                              <p className="font-semibold text-slate-900">{activeTab === "produkhukum" ? item.nomorSK : item.namaLaporan}</p>
                              <p className="text-[10px] md:text-[11px] text-slate-500 mt-0.5">{activeTab === "produkhukum" ? item.tentangHukum : item.periode}</p>
                            </td>
                            <td className="py-2 px-2 md:py-3 md:px-4 text-slate-600 truncate max-w-[300px]">{item.deskripsiHukum || item.deskripsiLaporan || "-"}</td>
                          </>
                        )}

                        {activeTab === "presentasi" && (
                          <>
                            <td className="py-2 px-2 md:py-3 md:px-4 font-semibold text-slate-900 truncate max-w-[200px]">{item.judul || "-"}</td>
                            <td className="py-2 px-2 md:py-3 md:px-4 text-slate-600"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wider">{item.tipeDokumen || "Presentasi"}</span></td>
                            <td className="py-2 px-2 md:py-3 md:px-4 text-slate-500 truncate max-w-[250px]">{item.deskripsi || "-"}</td>
                          </>
                        )}

                        {activeTab === "inventaris" && (
                          <>
                            <td className="py-2 px-2 md:py-3 md:px-4 font-semibold text-slate-900 truncate max-w-[200px]">{item.namaBarang || "-"}</td>
                            <td className="py-2 px-2 md:py-3 md:px-4 text-center font-mono font-bold text-slate-700 bg-slate-50/50">{item.jumlah || "0"}</td>
                            <td className="py-2 px-2 md:py-3 md:px-4 text-center">
                              <span className={`text-[9px] md:text-[10px] font-bold uppercase px-2 py-1 rounded-md ${item.kondisi === 'Baik' ? 'bg-emerald-100 text-emerald-700' : item.kondisi === 'Rusak Ringan' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                {item.kondisi || "Baik"}
                              </span>
                            </td>
                            <td className="py-2 px-2 md:py-3 md:px-4 text-slate-500 max-w-[300px]">
                              {/* Tambahkan whitespace-pre-wrap agar enter terbaca di tabel Admin */}
                              <div className="truncate font-medium text-slate-700 whitespace-pre-wrap">{item.deskripsi || "-"}</div>
                            </td>
                          </>
                        )}

                        {activeTab === "peminjaman" && (
                          <>
                            <td className="py-2 px-2 md:py-3 md:px-4">
                               <p className="font-semibold text-slate-900 line-clamp-1">{item.namaBarang}</p>
                               <span className="text-[9px] md:text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">{item.jumlahPinjam} Unit</span>
                            </td>
                            <td className="py-2 px-2 md:py-3 md:px-4">
                               <p className="font-bold text-slate-800 line-clamp-1">{item.namaOrganisasi}</p>
                               <p className="text-[10px] md:text-[11px] text-slate-500">PJ: {item.peminjam}</p>
                               {item.emailPenyewa && <p className="text-[9px] text-blue-500 truncate mt-0.5">{item.emailPenyewa}</p>}
                            </td>
                            <td className="py-2 px-2 md:py-3 md:px-4 text-slate-600 truncate max-w-[150px]">{item.kegiatan}</td>
                            <td className="py-2 px-2 md:py-3 md:px-4 text-[10px] md:text-[11px] font-mono text-slate-600">
                               {formatDisplayDate(item.waktuPinjam)} {item.jamPinjam ? `(${item.jamPinjam})` : ''} <br/><span className="text-slate-400">s/d</span> {formatDisplayDate(item.waktuSelesai)} {item.jamSelesai ? `(${item.jamSelesai})` : ''}
                            </td>
                            <td className="py-2 px-2 md:py-3 md:px-4 text-center">
                              {item.suratUrl ? (
                                <a href={item.suratUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-[9px] md:text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 px-2 py-1.5 rounded-md border border-blue-200 transition"><FileCheck size={12}/> Surat</a>
                              ) : <span className="text-slate-400 text-[9px] md:text-[10px] bg-slate-100 px-2 py-1 rounded">Tidak ada</span>}
                            </td>
                            <td className="py-2 px-2 md:py-3 md:px-4 text-center">
                              {item.status === "Disetujui" ? (
                                <span className="bg-emerald-100 text-emerald-700 text-[9px] md:text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider flex items-center justify-center gap-1"><CheckCircle size={12}/> Disetujui</span>
                              ) : item.status === "Ditolak" ? (
                                <span className="bg-red-100 text-red-700 text-[9px] md:text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider flex items-center justify-center gap-1"><XCircle size={12}/> Ditolak</span>
                              ) : (
                                <span className="bg-amber-100 text-amber-700 text-[9px] md:text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider flex items-center justify-center gap-1"><Loader2 size={12} className="animate-spin"/> Diproses</span>
                              )}
                            </td>
                          </>
                        )}

                        <td className="py-2 px-2 md:py-3 md:px-4 text-center">
                          {activeTab === "presentasi" ? (
                             <div className="flex flex-col gap-1.5 items-center justify-center">
                               {item.embedUrl && <a href={item.embedUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-[9px] md:text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 transition">Lihat Embed</a>}
                               {item.downloadUrl && <a href={item.downloadUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 text-[9px] md:text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded border border-emerald-200 transition"><Download size={12}/> Unduh</a>}
                               {!item.embedUrl && !item.downloadUrl && <span className="text-slate-400 text-[9px] md:text-[10px] bg-slate-100 px-2 py-1 rounded">Kosong</span>}
                             </div>
                          ) : activeTab === "inventaris" ? (
                             <div className="flex flex-col gap-1.5 items-center justify-center">
                               {item.fotoGroup && item.fotoGroup.length > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-blue-600 text-[9px] md:text-[10px] font-semibold bg-blue-50 px-2 py-1 rounded border border-blue-200"><Camera size={12}/> {item.fotoGroup.length} Foto</span>
                               ) : (
                                  <span className="text-slate-400 text-[9px] md:text-[10px] bg-slate-100 px-2 py-1 rounded">No Foto</span>
                               )}
                             </div>
                          ) : activeTab === "peminjaman" ? (
                             <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                               {item.status === "Diproses" && (
                                  <>
                                    <button disabled={isSendingEmail} onClick={() => handleUpdateStatusPeminjaman(item, "Disetujui")} className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white p-1 md:p-1.5 rounded shadow-sm transition tooltip" title="Setujui"><CheckCircle size={14}/></button>
                                    <button disabled={isSendingEmail} onClick={() => handleUpdateStatusPeminjaman(item, "Ditolak")} className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white p-1 md:p-1.5 rounded shadow-sm transition tooltip" title="Tolak"><XCircle size={14}/></button>
                                  </>
                               )}
                               <button onClick={() => handleDeleteRiwayatPeminjaman(item.id)} className="bg-white border border-slate-300 text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 md:p-1.5 rounded shadow-sm transition tooltip" title="Hapus Riwayat">
                                 <Trash2 size={14}/>
                               </button>
                             </div>
                          ) : (
                              item.linkFile ? (
                                 <a href={item.linkFile} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-[10px] md:text-xs font-semibold bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md border border-blue-200 transition"><Download size={14}/> Buka</a>
                              ) : <span className="text-slate-400 text-[10px] md:text-xs bg-slate-100 px-2 py-1.5 rounded-md">Kosong</span>
                          )}
                        </td>

                        {activeTab !== "peminjaman" && (
                          <td className="py-2 px-2 md:py-3 md:px-4 text-center">
                            <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => handleOpenModal(item)} className="text-amber-500 hover:text-amber-700 p-1 md:p-1.5 bg-white border border-slate-200 hover:border-amber-200 rounded-md shadow-sm transition"><Edit size={14}/></button>
                              <button onClick={() => handleDeleteData(item.id)} className="text-red-500 hover:text-red-700 p-1 md:p-1.5 bg-white border border-slate-200 hover:border-red-200 rounded-md shadow-sm transition"><Trash2 size={14}/></button>
                            </div>
                          </td>
                        )}

                      </tr>
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM TAMBAH/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
               <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  {editDataId ? <Edit size={18} className="text-amber-500"/> : <Plus size={18} className="text-blue-600"/>}
                  {editDataId ? "Edit Data" : "Tambah Data Baru"}
               </h2>
               <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-md transition"><X size={18}/></button>
            </div>

            <div className="p-6 overflow-y-auto bg-white flex-1">
               
               {activeTab === "persuratan" && !editDataId && (
                  <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1">
                       <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-1.5 mb-1"><Sparkles size={16} className="text-indigo-600"/> Ekstrak Teks Surat via AI</h4>
                       <p className="text-xs text-indigo-700">Gunakan asisten AI eksternal untuk mengekstrak teks dari foto/scan surat Anda, lalu salin hasilnya ke form ini.</p>
                    </div>
                    <a href="https://gemini.google.com/share/37c53e940950" target="_blank" rel="noopener noreferrer" className="bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-300 text-xs font-semibold px-4 py-2 rounded-md shadow-sm transition flex items-center gap-2 shrink-0">
                       <ExternalLink size={14}/> Buka Asisten AI
                    </a>
                  </div>
               )}

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
                        <textarea rows="2" value={formData.tujuan || ''} onChange={e => setFormData({...formData, tujuan: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Indikator Keberhasilan</label>
                        <textarea rows="2" value={formData.indikator || ''} onChange={e => setFormData({...formData, indikator: e.target.value})} className={inputStandardClass} />
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
                        <textarea rows="2" required value={formData.tentangHukum || ''} onChange={e => setFormData({...formData, tentangHukum: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Deskripsi Singkat Hukum</label>
                        <textarea rows="2" value={formData.deskripsiHukum || ''} onChange={e => setFormData({...formData, deskripsiHukum: e.target.value})} className={inputStandardClass} />
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
                        <textarea rows="2" value={formData.deskripsiLaporan || ''} onChange={e => setFormData({...formData, deskripsiLaporan: e.target.value})} className={inputStandardClass} />
                      </div>
                    </>
                  )}

                  {activeTab === "presentasi" && (
                    <>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Judul Presentasi / Dokumen</label>
                        <input type="text" required value={formData.judul || ''} onChange={e => setFormData({...formData, judul: e.target.value})} className={inputStandardClass} placeholder="Contoh: Materi Kaderisasi Dasar" />
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
                        <textarea rows="2" value={formData.deskripsi || ''} onChange={e => setFormData({...formData, deskripsi: e.target.value})} className={inputStandardClass} placeholder="Bahas tentang materi apa dokumen ini..." />
                      </div>
                      <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                        <label className={labelStandardClass}>Link Sematkan (Embed URL) - Wajib Untuk View Interaktif</label>
                        <input type="url" value={formData.embedUrl || ''} onChange={e => setFormData({...formData, embedUrl: e.target.value})} className={`${inputStandardClass} font-mono text-xs`} placeholder="Masukkan link dari Bagikan > Sematkan (Embed)..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Link File Unduhan (Opsional)</label>
                        <input type="url" value={formData.downloadUrl || ''} onChange={e => setFormData({...formData, downloadUrl: e.target.value})} className={`${inputStandardClass} font-mono text-xs`} placeholder="Link Google Drive, Firebase Storage, dsb..." />
                      </div>
                    </>
                  )}

                  {activeTab === "inventaris" && (
                    <>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Nama Barang</label>
                        <input type="text" required value={formData.namaBarang || ''} onChange={e => setFormData({...formData, namaBarang: e.target.value})} className={inputStandardClass} placeholder="Contoh: Proyektor Epson, Sound System, dll" />
                      </div>
                      <div>
                        <label className={labelStandardClass}>Jumlah Stok Total</label>
                        <input type="number" required min="1" value={formData.jumlah || ''} onChange={e => setFormData({...formData, jumlah: e.target.value})} className={inputStandardClass} placeholder="Misal: 5" />
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
                        <textarea rows="2" value={formData.deskripsi || ''} onChange={e => setFormData({...formData, deskripsi: e.target.value})} className={inputStandardClass} placeholder="Kelengkapan barang (kabel, tas), merk, ciri khusus..." />
                      </div>

                      <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                        <label className={labelStandardClass}>Upload Foto Barang (Otomatis Kompres & Bisa Pilih Banyak)</label>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          onChange={(e) => uploadToCloudinary(e.target.files)} 
                          className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" 
                          disabled={isUploadingFoto}
                        />
                        
                        {isUploadingFoto && (
                          <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" /> Mengunggah & mengompresi gambar (Cloudinary)...
                          </p>
                        )}

                        {fotoUrls.length > 0 && (
                          <div className="flex flex-wrap gap-3 mt-4 bg-slate-50 p-3 rounded-md border border-slate-100">
                            {fotoUrls.map((url, idx) => (
                              <div key={idx} className="relative w-20 h-20 rounded-md overflow-hidden border border-slate-200 group">
                                <img src={url} alt="preview" className="w-full h-full object-cover" />
                                <button 
                                  type="button" 
                                  onClick={() => removeFoto(idx)} 
                                  className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {activeTab !== "presentasi" && activeTab !== "inventaris" && (
                    <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                      <label className={labelStandardClass}>Link File Arsip (G-Drive / PDF)</label>
                      <input type="url" value={formData.linkFile || ''} onChange={e => setFormData({...formData, linkFile: e.target.value})} className={`${inputStandardClass} font-mono text-xs`} placeholder="https://drive.google.com/..." />
                    </div>
                  )}
               </form>
            </div>
            
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3 shrink-0">
               <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md transition">Batal</button>
               <button 
                  type="submit" 
                  form="arsipForm" 
                  disabled={isUploadingFoto}
                  className={`text-sm font-medium px-6 py-2 rounded-md shadow-sm transition flex items-center gap-2 ${isUploadingFoto ? 'bg-slate-400 text-slate-200 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
               >
                  <Save size={16}/> Simpan Data
               </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}