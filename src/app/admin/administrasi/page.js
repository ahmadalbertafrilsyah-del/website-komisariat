// app/admin/administrasi/page.js
"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc, query } from "firebase/firestore";
import * as XLSX from "xlsx";
import {
  FolderArchive, Mail, Briefcase, Scale, FileCheck, Inbox, Send, Search,
  Download, Plus, Trash2, Edit, Save, FileSpreadsheet, Building2,
  Loader2, Sparkles, X, ExternalLink, UploadCloud, MonitorPlay, Package,
  Camera, ClipboardList, CheckCircle, XCircle, CalendarDays, FolderTree
} from "lucide-react";

const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

export default function AdminAdministrasi() {
  const [loading, setLoading] = useState(true);
  const [activeLembaga, setActiveLembaga] = useState("Komisariat");
  const [listLSO, setListLSO] = useState([]);
  const [isLSOModalOpen, setIsLSOModalOpen] = useState(false);
  const [newLSOName, setNewLSOName] = useState("");

  // State Data Master
  const [masterPersuratan, setMasterPersuratan] = useState([]);
  const [masterProker, setMasterProker] = useState([]);
  const [masterProdukHukum, setMasterProdukHukum] = useState([]);
  const [masterLpj, setMasterLpj] = useState([]);
  const [masterPresentasi, setMasterPresentasi] = useState([]);
  const [masterInventaris, setMasterInventaris] = useState([]);
  const [masterPeminjaman, setMasterPeminjaman] = useState([]);

  // State Filter & Navigasi
  const [activeTab, setActiveTab] = useState("persuratan");
  const [activeSuratTab, setActiveSuratTab] = useState("masuk");
  const [activePeriode, setActivePeriode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // State Modal Surat/Data Umum
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDataId, setEditDataId] = useState(null);
  const [formData, setFormData] = useState({});
  const [expandedRowId, setExpandedRowId] = useState(null);

  // State Modal Pengaturan Periode (Khusus Persuratan)
  const [isPeriodeModalOpen, setIsPeriodeModalOpen] = useState(false);
  const [periodeFormData, setPeriodeFormData] = useState({});

  const [fotoUrls, setFotoUrls] = useState([]);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const excelInputRef = useRef(null);

  const inputStandardClass = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm bg-slate-50/70 focus:bg-white text-slate-900";
  const labelStandardClass = "text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider";

  useEffect(() => {
    async function fetchAdministrasiData() {
      try {
        const docRef = doc(db, "website_config", "database_administrasi");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();

          // Auto-migrasi data surat lama ke sistem periode baru
          let initPersuratan = data.masterPersuratan || [];
          if (initPersuratan.length === 0 && (data.listSuratMasuk?.length > 0 || data.listSuratKeluar?.length > 0)) {
            initPersuratan = [{
              id: "legacy-period-1",
              lembaga: "Komisariat",
              periode: "Periode Sebelumnya (Legacy)",
              linkMasuk: "",
              linkKeluar: "",
              suratMasuk: data.listSuratMasuk || [],
              suratKeluar: data.listSuratKeluar || data.listDokumen || []
            }];
          }

          setMasterPersuratan(initPersuratan);
          setMasterProker(data.listProker || []);
          setMasterProdukHukum(data.listProdukHukum || []);
          setMasterLpj(data.listLpj || []);
          setMasterPresentasi(data.listPresentasi || []);
          setMasterInventaris(data.listInventaris || []);
          setListLSO(data.listLSO || []);
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

    fetchAdministrasiData();
    fetchPeminjamanData();
  }, []);

  // ================= LEMBAGA & LSO (CUSTOM) =================
  const isLembagaTab = activeTab === "persuratan" || activeTab === "proker";
  const archivedLembaga = Array.from(new Set([
    ...masterPersuratan.map(p => p.lembaga || "Komisariat"),
    ...masterProker.map(p => p.lembaga || "Komisariat"),
  ])).filter(l => l !== "Komisariat" && l !== "KOPRI" && !listLSO.includes(l));

  const persistListLSO = async (newList) => {
    setListLSO(newList);
    await setDoc(doc(db, "website_config", "database_administrasi"), { listLSO: newList }, { merge: true });
  };

  const handleAddLSO = async (e) => {
    e.preventDefault();
    const name = newLSOName.trim();
    if (!name) return;
    if (["komisariat", "kopri"].includes(name.toLowerCase()) || listLSO.some(l => l.toLowerCase() === name.toLowerCase())) {
      return alert("Nama LSO sudah ada!");
    }
    await persistListLSO([...listLSO, name]);
    setNewLSOName("");
  };

  const handleRenameLSO = async (oldName) => {
    const newName = (prompt(`Ubah nama LSO "${oldName}" menjadi:`, oldName) || "").trim();
    if (!newName || newName === oldName) return;
    if (listLSO.some(l => l.toLowerCase() === newName.toLowerCase())) return alert("Nama LSO sudah ada!");
    const renameIn = (arr) => arr.map(i => (i.lembaga === oldName ? { ...i, lembaga: newName } : i));
    const newPersuratan = renameIn(masterPersuratan);
    const newProker = renameIn(masterProker);
    const newList = listLSO.map(l => (l === oldName ? newName : l));
    setMasterPersuratan(newPersuratan);
    setMasterProker(newProker);
    setListLSO(newList);
    if (activeLembaga === oldName) setActiveLembaga(newName);
    await setDoc(doc(db, "website_config", "database_administrasi"), {
      listLSO: newList, masterPersuratan: newPersuratan, listProker: newProker
    }, { merge: true });
  };

  const handleRemoveLSO = async (name) => {
    if (!confirm(`Hapus "${name}" dari daftar LSO aktif?\n\nArsip surat & proker milik LSO ini TIDAK dihapus dan tetap bisa dibuka lewat pilihan "Arsip LSO Lama".`)) return;
    await persistListLSO(listLSO.filter(l => l !== name));
  };

  const handleMoveLSO = async (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= listLSO.length) return;
    const newList = [...listLSO];
    [newList[idx], newList[target]] = [newList[target], newList[idx]];
    await persistListLSO(newList);
  };

  const availablePeriods = masterPersuratan.filter(p => (p.lembaga || "Komisariat") === activeLembaga);
  const resolvedPeriode = availablePeriods.some(p => p.id === activePeriode)
    ? activePeriode
    : (availablePeriods[0]?.id || "");

  // ================= PERIODE MANAGEMENT FUNCTIONS =================
  const handleOpenPeriodeModal = () => {
    if (resolvedPeriode) {
      const periodData = masterPersuratan.find(p => p.id === resolvedPeriode);
      setPeriodeFormData(periodData || { lembaga: activeLembaga, periode: "", linkMasuk: "", linkKeluar: "" });
    } else {
      setPeriodeFormData({ lembaga: activeLembaga, periode: "", linkMasuk: "", linkKeluar: "" });
    }
    setIsPeriodeModalOpen(true);
  };

  const handleSavePeriode = async (e) => {
    e.preventDefault();
    const payload = {
      ...periodeFormData,
      id: periodeFormData.id || generateUniqueId(),
      lembaga: activeLembaga,
      suratMasuk: periodeFormData.suratMasuk || [],
      suratKeluar: periodeFormData.suratKeluar || []
    };

    let newMaster;
    if (periodeFormData.id) {
      newMaster = masterPersuratan.map(p => p.id === payload.id ? payload : p);
    } else {
      newMaster = [payload, ...masterPersuratan];
      setActivePeriode(payload.id);
    }

    setMasterPersuratan(newMaster);
    await setDoc(doc(db, "website_config", "database_administrasi"), { masterPersuratan: newMaster }, { merge: true });
    setIsPeriodeModalOpen(false);
    alert("Pengaturan Periode berhasil disimpan!");
  };

  const handleDeletePeriode = async () => {
    if (!periodeFormData.id) return;
    if (!confirm("YAKIN HAPUS PERIODE INI? Seluruh data surat masuk dan keluar di dalam periode ini akan ikut terhapus permanen!")) return;

    const newMaster = masterPersuratan.filter(p => p.id !== periodeFormData.id);
    setMasterPersuratan(newMaster);
    await setDoc(doc(db, "website_config", "database_administrasi"), { masterPersuratan: newMaster }, { merge: true });
    setIsPeriodeModalOpen(false);
    setActivePeriode(newMaster.filter(p => p.lembaga === activeLembaga).length > 0 ? newMaster.filter(p => p.lembaga === activeLembaga)[0].id : "");
  };

  // ================= PEMINJAMAN ACTIONS =================
  const handleUpdateStatusPeminjaman = async (pengajuan, newStatus) => {
    if (!confirm(`Yakin ingin mengubah status pengajuan ini menjadi ${newStatus}? Notifikasi email otomatis akan dikirim ke penyewa.`)) return;

    setIsSendingEmail(true);
    try {
      await updateDoc(doc(db, "peminjaman_inventaris", pengajuan.id), { status: newStatus });
      setMasterPeminjaman(prev => prev.map(p => p.id === pengajuan.id ? { ...p, status: newStatus } : p));

      if (pengajuan.emailPenyewa) {
        try {
          await fetch("/api/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: pengajuan.emailPenyewa,
              namaBarang: pengajuan.namaBarang,
              namaOrganisasi: pengajuan.namaOrganisasi,
              kegiatan: pengajuan.kegiatan,
              waktuPinjam: formatDisplayDate(pengajuan.waktuPinjam) + ` (Jam: ${pengajuan.jamPinjam || "-"})`,
              waktuSelesai: formatDisplayDate(pengajuan.waktuSelesai) + ` (Jam: ${pengajuan.jamSelesai || "-"})`,
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
    } catch (error) {
      alert("Gagal menghapus riwayat: " + error.message);
    }
  };

  const uploadToCloudinary = async (files) => {
    if (!files || files.length === 0) return;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      alert("Error: Konfigurasi Cloudinary di file .env belum lengkap!");
      return;
    }

    setIsUploadingFoto(true);
    const uploadedUrls = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formDataObj = new FormData();
      formDataObj.append("file", file);
      formDataObj.append("upload_preset", uploadPreset);
      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formDataObj
        });
        const data = await res.json();
        if (data.secure_url) uploadedUrls.push(data.secure_url.replace("/upload/", "/upload/q_auto,f_auto/"));
      } catch (err) {
        alert(`Gagal mengunggah ${file.name}.`);
      }
    }
    setFotoUrls((prev) => [...prev, ...uploadedUrls]);
    setIsUploadingFoto(false);
  };

  const removeFoto = (indexToRemove) => {
    setFotoUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

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
      const date = new Date(Math.round((Number(dateVal) - 25569) * 86400 * 1000));
      return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
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
        if (parts[0].length === 4) return new Date(`${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].substring(0, 2)}T00:00:00`).getTime();
        else if (parts[2].length >= 4) return new Date(`${parts[2].substring(0, 4)}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}T00:00:00`).getTime();
      }
    }
    if (!isNaN(dateVal) && Number(dateVal) > 20000) return new Date(Math.round((Number(dateVal) - 25569) * 86400 * 1000)).getTime();
    const d = new Date(dateVal);
    return isNaN(d) ? 0 : d.getTime();
  };

  const createSlug = (text) => {
    if (!text) return "";
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  };

  const selectedPeriodData = masterPersuratan.find(p => p.id === resolvedPeriode) || { suratMasuk: [], suratKeluar: [] };
  const currentSuratMasuk = [...(selectedPeriodData.suratMasuk || [])].sort((a, b) => getSortableDate(a.tglDatang) - getSortableDate(b.tglDatang));
  const currentSuratKeluar = [...(selectedPeriodData.suratKeluar || [])].sort((a, b) => {
    const getNum = (str) => {
      const match = (str || "").match(/\d+/);
      return match ? parseInt(match[0], 10) : 999999;
    };
    const numA = getNum(a.nomorSurat);
    const numB = getNum(b.nomorSurat);
    if (numA !== numB) return numA - numB;
    return (a.nomorSurat || "").localeCompare(b.nomorSurat || "");
  });

  const filterByLembaga = (dataArray) => {
    return dataArray.filter(item => (item.lembaga || "Komisariat") === activeLembaga);
  };
  // Filter lembaga hanya berlaku untuk Arsip Persuratan & Program Kerja.
  // Produk Hukum, LPJ, Presentasi, dan Inventaris dijadikan satu (tanpa filter lembaga).
  const currentProker = filterByLembaga(masterProker);
  const currentProdukHukum = masterProdukHukum;
  const currentLpj = masterLpj;
  const currentPresentasi = masterPresentasi;
  const currentInventaris = masterInventaris;

  const getFilteredData = () => {
    const q = searchQuery.toLowerCase();
    if (activeTab === "persuratan") {
      const targetData = activeSuratTab === "masuk" ? currentSuratMasuk : currentSuratKeluar;
      return targetData.filter(i => (i.nomorSurat || "").toLowerCase().includes(q) || (i.hal || i.perihalSurat || "").toLowerCase().includes(q) || (i.asalSurat || i.tujuanSurat || "").toLowerCase().includes(q));
    } else if (activeTab === "proker") {
      return currentProker.filter(i => (i.namaProker || "").toLowerCase().includes(q) || (i.pelaksanaProker || "").toLowerCase().includes(q) || (i.penanggungJawab || "").toLowerCase().includes(q));
    } else if (activeTab === "produkhukum") {
      return currentProdukHukum.filter(i => (i.nomorSK || "").toLowerCase().includes(q) || (i.tentangHukum || "").toLowerCase().includes(q));
    } else if (activeTab === "laporan") {
      return currentLpj.filter(i => (i.namaLaporan || "").toLowerCase().includes(q) || (i.periode || "").toLowerCase().includes(q));
    } else if (activeTab === "presentasi") {
      return currentPresentasi.filter(i => (i.judul || "").toLowerCase().includes(q) || (i.tipeDokumen || "").toLowerCase().includes(q) || (i.deskripsi || "").toLowerCase().includes(q));
    } else if (activeTab === "inventaris") {
      return currentInventaris.filter(i => (i.namaBarang || "").toLowerCase().includes(q) || (i.kondisi || "").toLowerCase().includes(q) || (i.deskripsi || "").toLowerCase().includes(q));
    } else if (activeTab === "peminjaman") {
      return masterPeminjaman.filter(i => (i.namaBarang || "").toLowerCase().includes(q) || (i.namaOrganisasi || "").toLowerCase().includes(q) || (i.peminjam || "").toLowerCase().includes(q) || (i.emailPenyewa || "").toLowerCase().includes(q));
    }
    return [];
  };
  const currentListData = getFilteredData();

  const handleOpenModal = (data = null) => {
    if (activeTab === "persuratan" && !resolvedPeriode) return alert("Pilih atau buat Periode terlebih dahulu!");

    if (data) {
      setEditDataId(data.id || generateUniqueId());
      setFormData(data);
      if (activeTab === "inventaris" && data.fotoGroup) setFotoUrls(data.fotoGroup);
      else if (activeTab === "produkhukum" && data.thumbnail) setFotoUrls([data.thumbnail]);
      else setFotoUrls([]);
    } else {
      setEditDataId(null);
      setFormData({ lembaga: activeLembaga });
      setFotoUrls([]);
    }
    setIsModalOpen(true);
  };

  const handleSaveData = async (e) => {
    e.preventDefault();
    if (isUploadingFoto) {
      alert("Harap tunggu, foto sedang diunggah...");
      return;
    }

    try {
      let finalPayload = {
        ...formData,
        id: editDataId || generateUniqueId(),
        lembaga: isLembagaTab ? activeLembaga : (formData.lembaga || "Komisariat")
      };
      let newMaster;

      if (activeTab === "inventaris") {
        finalPayload = { ...finalPayload, fotoGroup: fotoUrls, slug: createSlug(formData.namaBarang) };
      } else if (activeTab === "produkhukum") {
        finalPayload = { ...finalPayload, thumbnail: fotoUrls.length > 0 ? fotoUrls[0] : (formData.thumbnail || "") };
      }

      if (activeTab === "persuratan") {
        const periodIndex = masterPersuratan.findIndex(p => p.id === resolvedPeriode);
        const updatedPeriod = { ...masterPersuratan[periodIndex] };

        if (activeSuratTab === "masuk") {
          updatedPeriod.suratMasuk = editDataId
            ? updatedPeriod.suratMasuk.map(i => i.id === editDataId ? finalPayload : i)
            : [finalPayload, ...(updatedPeriod.suratMasuk || [])];
        } else {
          updatedPeriod.suratKeluar = editDataId
            ? updatedPeriod.suratKeluar.map(i => i.id === editDataId ? finalPayload : i)
            : [finalPayload, ...(updatedPeriod.suratKeluar || [])];
        }

        newMaster = [...masterPersuratan];
        newMaster[periodIndex] = updatedPeriod;
        setMasterPersuratan(newMaster);
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
        if (!finalPayload.createdAt) finalPayload.createdAt = new Date().toISOString();
        newMaster = editDataId ? masterPresentasi.map(i => i.id === editDataId ? finalPayload : i) : [finalPayload, ...masterPresentasi];
        setMasterPresentasi(newMaster);
      } else if (activeTab === "inventaris") {
        if (!finalPayload.createdAt) finalPayload.createdAt = new Date().toISOString();
        newMaster = editDataId ? masterInventaris.map(i => i.id === editDataId ? finalPayload : i) : [finalPayload, ...masterInventaris];
        setMasterInventaris(newMaster);
      }

      await saveDataToFirebase(activeTab, null, newMaster);
      alert("Data berhasil disimpan!");
      setIsModalOpen(false);
    } catch (error) {
      alert("Gagal menyimpan data: " + error.message);
    }
  };

  const handleDeleteData = async (idToDelete) => {
    if (!confirm("Hapus data ini secara permanen?")) return;
    try {
      let newMaster;
      if (activeTab === "persuratan") {
        const periodIndex = masterPersuratan.findIndex(p => p.id === resolvedPeriode);
        const updatedPeriod = { ...masterPersuratan[periodIndex] };
        if (activeSuratTab === "masuk") {
          updatedPeriod.suratMasuk = updatedPeriod.suratMasuk.filter(i => i.id !== idToDelete);
        } else {
          updatedPeriod.suratKeluar = updatedPeriod.suratKeluar.filter(i => i.id !== idToDelete);
        }
        newMaster = [...masterPersuratan];
        newMaster[periodIndex] = updatedPeriod;
        setMasterPersuratan(newMaster);
      } else if (activeTab === "proker") {
        newMaster = masterProker.filter(i => i.id !== idToDelete);
        setMasterProker(newMaster);
      } else if (activeTab === "produkhukum") {
        newMaster = masterProdukHukum.filter(i => i.id !== idToDelete);
        setMasterProdukHukum(newMaster);
      } else if (activeTab === "laporan") {
        newMaster = masterLpj.filter(i => i.id !== idToDelete);
        setMasterLpj(newMaster);
      } else if (activeTab === "presentasi") {
        newMaster = masterPresentasi.filter(i => i.id !== idToDelete);
        setMasterPresentasi(newMaster);
      } else if (activeTab === "inventaris") {
        newMaster = masterInventaris.filter(i => i.id !== idToDelete);
        setMasterInventaris(newMaster);
      }

      await saveDataToFirebase(activeTab, null, newMaster);
    } catch (error) {
      alert("Gagal menghapus: " + error.message);
    }
  };

  const saveDataToFirebase = async (tab, _, newMasterData) => {
    const docRef = doc(db, "website_config", "database_administrasi");
    let updateField = {};
    if (tab === "persuratan") updateField = { masterPersuratan: newMasterData };
    else if (tab === "proker") updateField = { listProker: newMasterData };
    else if (tab === "produkhukum") updateField = { listProdukHukum: newMasterData };
    else if (tab === "laporan") updateField = { listLpj: newMasterData };
    else if (tab === "presentasi") updateField = { listPresentasi: newMasterData };
    else if (tab === "inventaris") updateField = { listInventaris: newMasterData };
    await setDoc(docRef, updateField, { merge: true });
  };

  const handleDownloadTemplate = () => {
    let templateData = [];
    if (activeTab === "persuratan") {
      templateData = [{
        "Nomor Surat": "001/PMII/2026",
        "Asal/Tujuan Surat": "PC PMII Kota Malang",
        "Tanggal Buat (YYYY-MM-DD)": "2026-06-01",
        "Tanggal Terima/Kirim (YYYY-MM-DD)": "2026-06-02",
        "Perihal": "Undangan Kegiatan",
        "Keterangan": "Surat Penting"
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
        "Link Thumbnail": "https://res.cloudinary.com/...",
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

    if (activeTab === "persuratan" && !resolvedPeriode) {
      alert("Pilih atau buat Periode Kepengurusan terlebih dahulu sebelum mengimpor file persuratan!");
      e.target.value = null;
      return;
    }

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
            id: generateUniqueId(),
            nomorSurat: row["Nomor Surat"] || "",
            hal: row["Perihal"] || "",
            ket: row["Keterangan"] || "",
            tglBuat: row["Tanggal Buat (YYYY-MM-DD)"] || "",
            ...(isMasuk
              ? { asalSurat: row["Asal/Tujuan Surat"] || "", tglDatang: row["Tanggal Terima/Kirim (YYYY-MM-DD)"] || "" }
              : { tujuanSurat: row["Asal/Tujuan Surat"] || "", tglKirim: row["Tanggal Terima/Kirim (YYYY-MM-DD)"] || "" })
          }));

          const periodIndex = masterPersuratan.findIndex(p => p.id === resolvedPeriode);
          const updatedPeriod = { ...masterPersuratan[periodIndex] };

          if (isMasuk) updatedPeriod.suratMasuk = [...updatedData, ...(updatedPeriod.suratMasuk || [])];
          else updatedPeriod.suratKeluar = [...updatedData, ...(updatedPeriod.suratKeluar || [])];

          const newMaster = [...masterPersuratan];
          newMaster[periodIndex] = updatedPeriod;
          setMasterPersuratan(newMaster);
          await saveDataToFirebase(activeTab, null, newMaster);
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
            thumbnail: row["Link Thumbnail"] || "",
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
            const fotoGroup = fotosText ? fotosText.split(",").map(u => u.trim()) : [];
            const namaBrg = row["Nama Barang"] || "";

            return {
              id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
              lembaga: activeLembaga,
              namaBarang: namaBrg,
              slug: createSlug(namaBrg),
              jumlah: row["Jumlah"] || "1",
              kondisi: row["Kondisi (Baik/Rusak Ringan/Rusak Berat)"] || "Baik",
              deskripsi: row["Deskripsi"] || "",
              fotoGroup: fotoGroup,
              createdAt: new Date().toISOString()
            };
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
        "No": idx + 1,
        "Nomor Surat": i.nomorSurat,
        [activeSuratTab === "masuk" ? "Asal Surat" : "Tujuan Surat"]: activeSuratTab === "masuk" ? i.asalSurat : i.tujuanSurat,
        "Tanggal Buat": i.tglBuat,
        [activeSuratTab === "masuk" ? "Tanggal Datang" : "Tanggal Kirim"]: activeSuratTab === "masuk" ? i.tglDatang : i.tglKirim,
        "Perihal": i.hal || i.perihalSurat,
        "Keterangan": i.ket || i.deskripsiSurat
      }));
    } else if (activeTab === "proker") {
      formattedData = currentListData.map((i, idx) => ({
        "No": idx + 1,
        "Biro/Pelaksana": i.pelaksanaProker,
        "Nama Kegiatan": i.namaProker,
        "Tujuan": i.tujuan,
        "Indikator": i.indikator,
        "Sasaran": i.sasaran,
        "Waktu Pelaksanaan": i.waktuPelaksanaan,
        "Penanggung Jawab": i.penanggungJawab,
        "Estimasi Dana": i.estimasiDana,
        "Link Berkas": i.linkFile
      }));
    } else if (activeTab === "produkhukum") {
      formattedData = currentListData.map((i, idx) => ({
        "No": idx + 1,
        "Nomor SK": i.nomorSK,
        "Tentang Hukum": i.tentangHukum,
        "Deskripsi": i.deskripsiHukum,
        "Link Thumbnail": i.thumbnail || "",
        "Link Berkas": i.linkFile
      }));
    } else if (activeTab === "laporan") {
      formattedData = currentListData.map((i, idx) => ({
        "No": idx + 1,
        "Nama Laporan": i.namaLaporan,
        "Periode": i.periode,
        "Deskripsi Laporan": i.deskripsiLaporan,
        "Link Berkas": i.linkFile
      }));
    } else if (activeTab === "presentasi") {
      formattedData = currentListData.map((i, idx) => ({
        "No": idx + 1,
        "Judul Dokumen": i.judul,
        "Tipe Dokumen": i.tipeDokumen,
        "Deskripsi": i.deskripsi,
        "Link Sematkan (Embed)": i.embedUrl,
        "Link Unduh": i.downloadUrl
      }));
    } else if (activeTab === "inventaris") {
      formattedData = currentListData.map((i, idx) => ({
        "No": idx + 1,
        "Nama Barang": i.namaBarang,
        "Jumlah": i.jumlah,
        "Kondisi": i.kondisi,
        "Deskripsi": i.deskripsi
      }));
    } else if (activeTab === "peminjaman") {
      formattedData = currentListData.map((i, idx) => ({
        "No": idx + 1,
        "Nama Barang": i.namaBarang,
        "Organisasi": i.namaOrganisasi,
        "Peminjam / PJ": i.peminjam,
        "Kegiatan": i.kegiatan,
        "Jumlah Pinjam": i.jumlahPinjam,
        "Tanggal Mulai": i.waktuPinjam,
        "Tanggal Selesai": i.waktuSelesai,
        "Status": i.status
      }));
    }

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Arsip");
    XLSX.writeFile(wb, `Rekap_${activeTab}_${Date.now()}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={32} className="text-blue-600 animate-spin" />
      </div>
    );
  }

  const adminTabs = [
    { id: "persuratan", label: "Arsip Persuratan", icon: Mail },
    { id: "proker", label: "Program Kerja", icon: Briefcase },
    { id: "produkhukum", label: "Produk Hukum", icon: Scale },
    { id: "laporan", label: "Laporan (LPJ)", icon: FileCheck },
    { id: "presentasi", label: "Presentasi & Dok", icon: MonitorPlay },
    { id: "inventaris", label: "Inventaris Barang", icon: Package },
    { id: "peminjaman", label: "Pengajuan Pinjaman", icon: ClipboardList, isEmerald: true }
  ];

  return (
    <div className="space-y-5 pb-12 w-full text-sm">
      {/* ================= MODAL KELOLA LSO ================= */}
      {isLSOModalOpen && (
        <div className="fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setIsLSOModalOpen(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600 block">Lembaga Semi Otonom</span>
                <h3 className="text-base font-black text-slate-900">Kelola Daftar LSO</h3>
              </div>
              <button type="button" onClick={() => setIsLSOModalOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <p className="text-xs text-slate-500 leading-relaxed">
                LSO bisa berbeda tiap periode. Tambah, ubah nama, atau nonaktifkan LSO di sini. Menghapus LSO dari daftar
                <b> tidak menghapus arsipnya</b> — arsip lama tetap bisa dibuka lewat grup <i>Arsip LSO Lama</i>.
              </p>

              <form onSubmit={handleAddLSO} className="flex gap-2">
                <input
                  type="text"
                  value={newLSOName}
                  onChange={e => setNewLSOName(e.target.value)}
                  placeholder="Nama LSO baru, misal: LSO Jurnalistik"
                  className={inputStandardClass}
                />
                <button type="submit" className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 rounded-xl text-xs flex items-center gap-1.5">
                  <Plus size={14} /> Tambah
                </button>
              </form>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-500">
                  <span>Komisariat &amp; KOPRI</span>
                  <span className="text-[10px] font-mono uppercase">Tetap</span>
                </div>
                {listLSO.length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-4">Belum ada LSO. Tambahkan di atas.</p>
                )}
                {listLSO.map((lso, idx) => (
                  <div key={lso} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white">
                    <span className="text-[10px] font-mono text-slate-400 w-5">{String(idx + 1).padStart(2, "0")}</span>
                    <span className="flex-1 min-w-0 truncate text-xs sm:text-sm font-bold text-slate-800">{lso}</span>
                    <button type="button" onClick={() => handleMoveLSO(idx, -1)} disabled={idx === 0} className="px-1.5 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded disabled:opacity-30">↑</button>
                    <button type="button" onClick={() => handleMoveLSO(idx, 1)} disabled={idx === listLSO.length - 1} className="px-1.5 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded disabled:opacity-30">↓</button>
                    <button type="button" onClick={() => handleRenameLSO(lso)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Ubah nama"><Edit size={13} /></button>
                    <button type="button" onClick={() => handleRemoveLSO(lso)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Hapus dari daftar"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>

              {archivedLembaga.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 mb-2">Arsip LSO Lama (tidak aktif)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {archivedLembaga.map(l => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => persistListLSO([...listLSO, l])}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200"
                        title="Aktifkan kembali"
                      >
                        + {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ================= STICKY TOP ACTION HEADER ================= */}
      <div className="sticky top-0 z-30 -mx-3.5 sm:-mx-6 px-3.5 sm:px-6 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600">
              BIROKRASI & ARSIP DIGITAL
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Manajemen Sistem Administrasi
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isLembagaTab && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Building2 size={15} className="text-blue-600 shrink-0" />
              <select
                value={activeLembaga}
                onChange={e => { setActiveLembaga(e.target.value); setSearchQuery(""); }}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer max-w-[160px] truncate"
              >
                <option value="Komisariat">Komisariat</option>
                <option value="KOPRI">KOPRI</option>
                {listLSO.length > 0 && (
                  <optgroup label="LSO Aktif">
                    {listLSO.map(lso => (
                      <option key={lso} value={lso}>{lso}</option>
                    ))}
                  </optgroup>
                )}
                {archivedLembaga.length > 0 && (
                  <optgroup label="Arsip LSO Lama">
                    {archivedLembaga.map(lso => (
                      <option key={lso} value={lso}>{lso} (arsip)</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <button
                type="button"
                onClick={() => setIsLSOModalOpen(true)}
                className="p-1 bg-white hover:bg-blue-50 text-blue-700 rounded-lg border border-slate-200 transition"
                title="Kelola Daftar LSO"
              >
                <Edit size={13} />
              </button>
            </div>
          )}

          {activeTab === "persuratan" && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <CalendarDays size={15} className="text-amber-600 shrink-0" />
              <select
                value={resolvedPeriode}
                onChange={e => { setActivePeriode(e.target.value); setSearchQuery(""); }}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer max-w-[150px] truncate"
              >
                {availablePeriods.length > 0 ? (
                  availablePeriods.map(p => <option key={p.id} value={p.id}>{p.periode}</option>)
                ) : (
                  <option value="">Belum Ada Periode</option>
                )}
              </select>
              <button
                onClick={handleOpenPeriodeModal}
                className="p-1 bg-white hover:bg-amber-50 text-amber-700 rounded-lg border border-slate-200 transition"
                title="Kelola Periode & Link Drive"
              >
                <FolderTree size={13} />
              </button>
            </div>
          )}

          {activeTab !== "peminjaman" && (
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm whitespace-nowrap ml-auto lg:ml-0"
            >
              <Plus size={15} /> Tambah Data
            </button>
          )}
        </div>
      </div>

      {/* ================= TAB NAVIGATION ================= */}
      <div className="bg-white border border-slate-200 p-1.5 rounded-2xl flex overflow-x-auto gap-1 scrollbar-none shadow-sm">
        {adminTabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setSearchQuery(""); }}
              className={`px-3.5 py-2.5 font-bold text-xs rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                isActive
                  ? t.isEmerald
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-[#020617] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon size={15} className={isActive && !t.isEmerald ? "text-[#facc15]" : ""} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= FILTER & EXCEL TOOLBAR ================= */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between gap-3 items-stretch lg:items-center">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center flex-1">
          {activeTab === "persuratan" && (
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                onClick={() => setActiveSuratTab("masuk")}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeSuratTab === "masuk" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Inbox size={14} /> S. Masuk ({currentSuratMasuk.length})
              </button>
              <button
                onClick={() => setActiveSuratTab("keluar")}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeSuratTab === "keluar" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Send size={14} /> S. Keluar ({currentSuratKeluar.length})
              </button>
            </div>
          )}

          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === "inventaris"
                  ? "Cari nama barang..."
                  : activeTab === "peminjaman"
                  ? "Cari organisasi, peminjam, atau email..."
                  : "Cari nomor surat, perihal, kegiatan, atau judul..."
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 pl-9 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none text-xs sm:text-sm bg-slate-50/70 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          {activeTab !== "peminjaman" && (
            <>
              <button
                onClick={handleDownloadTemplate}
                className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Download size={14} /> Template
              </button>
              <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={excelInputRef} onChange={handleImportExcel} />
              <button
                onClick={() => excelInputRef.current.click()}
                className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <UploadCloud size={14} /> Impor
              </button>
            </>
          )}

          {activeTab === "persuratan" && resolvedPeriode && (
            <a
              href={selectedPeriodData[activeSuratTab === "masuk" ? "linkMasuk" : "linkKeluar"] || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
            >
              <FolderArchive size={14} /> Folder Drive
            </a>
          )}

          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-none bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
          >
            <FileSpreadsheet size={14} /> Ekspor Excel
          </button>
        </div>
      </div>

      {/* ================= MOBILE CARDS (< md) ================= */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {currentListData.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-xs font-medium">
            Belum ada data pada kategori ini.
          </div>
        ) : (
          currentListData.map((item, index) => (
            <div key={item.id || index} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              {activeTab === "persuratan" && (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60 break-all">
                      #{index + 1} • {item.nomorSurat || "-"}
                    </span>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleOpenModal(item)} className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200"><Edit size={14} /></button>
                      <button onClick={() => handleDeleteData(item.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{item.hal || item.perihalSurat || "-"}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeSuratTab === "masuk" ? `Dari: ${item.asalSurat || "-"}` : `Tujuan: ${item.tujuanSurat || "-"}`}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] font-mono text-slate-500">
                    <span>Buat: {formatDisplayDate(item.tglBuat)}</span>
                    <span className="text-emerald-700 font-bold">
                      {activeSuratTab === "masuk" ? `Terima: ${formatDisplayDate(item.tglDatang)}` : `Kirim: ${formatDisplayDate(item.tglKirim)}`}
                    </span>
                  </div>
                </>
              )}

              {activeTab === "proker" && (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {item.pelaksanaProker || "Biro Umum"}
                    </span>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleOpenModal(item)} className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200"><Edit size={14} /></button>
                      <button onClick={() => handleDeleteData(item.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.namaProker || "-"}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{item.tujuan || "-"}</p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">PJ: <strong>{item.penanggungJawab || "-"}</strong></span>
                    <span className="font-mono font-bold text-emerald-700">{item.estimasiDana || "-"}</span>
                  </div>
                </>
              )}

              {(activeTab === "produkhukum" || activeTab === "laporan") && (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 block">
                        {activeTab === "produkhukum" ? item.nomorSK : item.periode}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                        {activeTab === "produkhukum" ? item.tentangHukum : item.namaLaporan}
                      </h4>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleOpenModal(item)} className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200"><Edit size={14} /></button>
                      <button onClick={() => handleDeleteData(item.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{item.deskripsiHukum || item.deskripsiLaporan || "-"}</p>
                </>
              )}

              {activeTab === "presentasi" && (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {item.tipeDokumen || "Presentasi"}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{item.judul || "-"}</h4>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleOpenModal(item)} className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200"><Edit size={14} /></button>
                      <button onClick={() => handleDeleteData(item.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{item.deskripsi || "-"}</p>
                </>
              )}

              {activeTab === "inventaris" && (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.namaBarang || "-"}</h4>
                      <span className="text-xs font-mono text-slate-500">Stok: <strong>{item.jumlah || 0} Unit</strong> • {item.kondisi || "Baik"}</span>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleOpenModal(item)} className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200"><Edit size={14} /></button>
                      <button onClick={() => handleDeleteData(item.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{item.deskripsi || "-"}</p>
                </>
              )}

              {activeTab === "peminjaman" && (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {item.namaBarang} ({item.jumlahPinjam} Unit)
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{item.namaOrganisasi}</h4>
                      <p className="text-xs text-slate-500">PJ: {item.peminjam} • {item.kegiatan}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${item.status === "Disetujui" ? "bg-emerald-100 text-emerald-700" : item.status === "Ditolak" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {item.status || "Diproses"}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Jadwal: {formatDisplayDate(item.waktuPinjam)} s/d {formatDisplayDate(item.waktuSelesai)}
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {item.suratUrl ? (
                      <a href={item.suratUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 underline">
                        Lihat Surat
                      </a>
                    ) : <span className="text-xs text-slate-400">Tanpa Surat</span>}
                    <div className="flex items-center gap-1.5">
                      {item.status === "Diproses" && (
                        <>
                          <button disabled={isSendingEmail} onClick={() => handleUpdateStatusPeminjaman(item, "Disetujui")} className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold">ACC</button>
                          <button disabled={isSendingEmail} onClick={() => handleUpdateStatusPeminjaman(item, "Ditolak")} className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-bold">Tolak</button>
                        </>
                      )}
                      <button onClick={() => handleDeleteRiwayatPeminjaman(item.id)} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* ================= DESKTOP TABLE (md+) ================= */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[380px]">
          <table className="w-full text-left whitespace-nowrap min-w-max">
            <thead className="bg-slate-50 text-slate-500 text-[11px] font-mono uppercase font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>

                {activeTab === "persuratan" && (
                  <>
                    <th className="py-3.5 px-4 min-w-[280px]">Nomor Surat</th>
                    <th className="py-3.5 px-4">{activeSuratTab === "masuk" ? "Asal Surat" : "Tujuan Surat"}</th>
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4 w-32 text-center">Perihal</th>
                    <th className="py-3.5 px-4 max-w-[200px]">Keterangan</th>
                  </>
                )}

                {activeTab === "proker" && (
                  <>
                    <th className="py-3.5 px-4">Nama Kegiatan</th>
                    <th className="py-3.5 px-4">Biro / Pelaksana</th>
                    <th className="py-3.5 px-4">Tujuan</th>
                    <th className="py-3.5 px-4">Pelaksanaan</th>
                    <th className="py-3.5 px-4">PJ</th>
                    <th className="py-3.5 px-4">Dana</th>
                  </>
                )}

                {(activeTab === "produkhukum" || activeTab === "laporan") && (
                  <>
                    <th className="py-3.5 px-4">{activeTab === "produkhukum" ? "Nomor SK / Judul" : "Judul Laporan"}</th>
                    <th className="py-3.5 px-4 max-w-[300px]">Deskripsi Singkat</th>
                  </>
                )}

                {activeTab === "presentasi" && (
                  <>
                    <th className="py-3.5 px-4">Judul Dokumen</th>
                    <th className="py-3.5 px-4">Tipe</th>
                    <th className="py-3.5 px-4 max-w-[300px]">Deskripsi Singkat</th>
                  </>
                )}

                {activeTab === "inventaris" && (
                  <>
                    <th className="py-3.5 px-4">Nama Barang</th>
                    <th className="py-3.5 px-4 w-24 text-center">Jumlah</th>
                    <th className="py-3.5 px-4 w-32 text-center">Kondisi</th>
                    <th className="py-3.5 px-4 max-w-[300px]">Deskripsi</th>
                  </>
                )}

                {activeTab === "peminjaman" && (
                  <>
                    <th className="py-3.5 px-4">Barang & Jumlah</th>
                    <th className="py-3.5 px-4">Organisasi / Peminjam</th>
                    <th className="py-3.5 px-4">Kegiatan</th>
                    <th className="py-3.5 px-4">Jadwal Pinjam</th>
                    <th className="py-3.5 px-4 text-center">Surat</th>
                    <th className="py-3.5 px-4 text-center">Status ACC</th>
                  </>
                )}

                {activeTab !== "persuratan" && (
                  <th className="py-3.5 px-4 text-center">
                    {activeTab === "inventaris" ? "Media" : activeTab === "peminjaman" ? "Tindakan" : "Berkas"}
                  </th>
                )}

                {activeTab !== "peminjaman" && <th className="py-3.5 px-4 w-24 text-center">Aksi</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
              {currentListData.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-16 text-center text-slate-400 font-medium">
                    Belum ada data pada kategori ini.
                  </td>
                </tr>
              ) : (
                currentListData.map((item, index) => {
                  const isExpanded = expandedRowId === index;
                  return (
                    <tr
                      key={item.id || index}
                      className={`transition-colors hover:bg-slate-50/80 ${isExpanded ? "bg-slate-50" : ""}`}
                      onClick={() => setExpandedRowId(isExpanded ? null : index)}
                    >
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">{index + 1}</td>

                      {activeTab === "persuratan" && (
                        <>
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {item.nomorSurat || "-"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">
                            {activeSuratTab === "masuk" ? (item.asalSurat || "-") : (item.tujuanSurat || "-")}
                          </td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5 text-[11px] font-mono">
                              <span className="text-slate-500">Buat: <strong className="text-slate-700">{formatDisplayDate(item.tglBuat)}</strong></span>
                              <span className={activeSuratTab === "masuk" ? "text-emerald-600" : "text-blue-600"}>
                                <strong>{activeSuratTab === "masuk" ? "Terima: " : "Kirim: "}</strong>
                                {formatDisplayDate(activeSuratTab === "masuk" ? item.tglDatang : item.tglKirim)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase text-slate-800 bg-slate-100 border border-slate-200">
                              {item.hal || item.perihalSurat || "-"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 truncate max-w-[180px]">{item.ket || item.deskripsiSurat || "-"}</td>
                        </>
                      )}

                      {activeTab === "proker" && (
                        <>
                          <td className="py-3 px-4 font-bold text-slate-900">{item.namaProker || "-"}</td>
                          <td className="py-3 px-4 text-slate-600">{item.pelaksanaProker || "-"}</td>
                          <td className="py-3 px-4 text-slate-600 truncate max-w-[180px]">{item.tujuan || "-"}</td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-600">{formatDisplayDate(item.waktuPelaksanaan)}</td>
                          <td className="py-3 px-4 text-slate-700 font-medium">{item.penanggungJawab || "-"}</td>
                          <td className="py-3 px-4 font-mono text-emerald-700 font-bold">{item.estimasiDana || "-"}</td>
                        </>
                      )}

                      {(activeTab === "produkhukum" || activeTab === "laporan") && (
                        <>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{activeTab === "produkhukum" ? item.nomorSK : item.namaLaporan}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{activeTab === "produkhukum" ? item.tentangHukum : item.periode}</p>
                          </td>
                          <td className="py-3 px-4 text-slate-600 truncate max-w-[300px]">{item.deskripsiHukum || item.deskripsiLaporan || "-"}</td>
                        </>
                      )}

                      {activeTab === "presentasi" && (
                        <>
                          <td className="py-3 px-4 font-bold text-slate-900 truncate max-w-[220px]">{item.judul || "-"}</td>
                          <td className="py-3 px-4">
                            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase">
                              {item.tipeDokumen || "Presentasi"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 truncate max-w-[250px]">{item.deskripsi || "-"}</td>
                        </>
                      )}

                      {activeTab === "inventaris" && (
                        <>
                          <td className="py-3 px-4 font-bold text-slate-900 truncate max-w-[200px]">{item.namaBarang || "-"}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 bg-slate-50/60">{item.jumlah || "0"}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-md ${item.kondisi === "Baik" ? "bg-emerald-100 text-emerald-700" : item.kondisi === "Rusak Ringan" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                              {item.kondisi || "Baik"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 max-w-[300px] truncate">{item.deskripsi || "-"}</td>
                        </>
                      )}

                      {activeTab === "peminjaman" && (
                        <>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{item.namaBarang}</p>
                            <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">
                              {item.jumlahPinjam} Unit
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-800">{item.namaOrganisasi}</p>
                            <p className="text-xs text-slate-500">PJ: {item.peminjam}</p>
                            {item.emailPenyewa && <p className="text-[10px] text-blue-600 truncate mt-0.5">{item.emailPenyewa}</p>}
                          </td>
                          <td className="py-3 px-4 text-slate-600 truncate max-w-[160px]">{item.kegiatan}</td>
                          <td className="py-3 px-4 text-xs font-mono text-slate-600">
                            {formatDisplayDate(item.waktuPinjam)} {item.jamPinjam ? `(${item.jamPinjam})` : ""}
                            <br />
                            <span className="text-slate-400">s/d</span> {formatDisplayDate(item.waktuSelesai)} {item.jamSelesai ? `(${item.jamSelesai})` : ""}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.suratUrl ? (
                              <a
                                href={item.suratUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-bold bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 transition"
                              >
                                <FileCheck size={13} /> Surat
                              </a>
                            ) : (
                              <span className="text-slate-400 text-xs bg-slate-100 px-2 py-1 rounded">Kosong</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.status === "Disetujui" ? (
                              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase inline-flex items-center gap-1">
                                <CheckCircle size={12} /> Disetujui
                              </span>
                            ) : item.status === "Ditolak" ? (
                              <span className="bg-red-100 text-red-700 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase inline-flex items-center gap-1">
                                <XCircle size={12} /> Ditolak
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-700 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase inline-flex items-center gap-1">
                                <Loader2 size={12} className="animate-spin" /> Diproses
                              </span>
                            )}
                          </td>
                        </>
                      )}

                      {activeTab !== "persuratan" && (
                        <td className="py-3 px-4 text-center">
                          {activeTab === "presentasi" ? (
                            <div className="flex flex-col gap-1 items-center justify-center">
                              {item.embedUrl && (
                                <a href={item.embedUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-600 text-[10px] font-bold bg-blue-50 px-2 py-1 rounded border border-blue-200">
                                  Embed
                                </a>
                              )}
                              {item.downloadUrl && (
                                <a href={item.downloadUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                                  Unduh
                                </a>
                              )}
                              {!item.embedUrl && !item.downloadUrl && <span className="text-slate-400 text-[10px]">Kosong</span>}
                            </div>
                          ) : activeTab === "inventaris" ? (
                            item.fotoGroup && item.fotoGroup.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-blue-600 text-xs font-bold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                                <Camera size={12} /> {item.fotoGroup.length} Foto
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs bg-slate-100 px-2 py-1 rounded">Tanpa Foto</span>
                            )
                          ) : activeTab === "peminjaman" ? (
                            <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {item.status === "Diproses" && (
                                <>
                                  <button disabled={isSendingEmail} onClick={() => handleUpdateStatusPeminjaman(item, "Disetujui")} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-1.5 rounded-lg shadow-sm" title="Setujui">
                                    <CheckCircle size={14} />
                                  </button>
                                  <button disabled={isSendingEmail} onClick={() => handleUpdateStatusPeminjaman(item, "Ditolak")} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white p-1.5 rounded-lg shadow-sm" title="Tolak">
                                    <XCircle size={14} />
                                  </button>
                                </>
                              )}
                              <button onClick={() => handleDeleteRiwayatPeminjaman(item.id)} className="bg-white border border-slate-200 text-slate-400 hover:text-red-600 p-1.5 rounded-lg" title="Hapus Riwayat">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : item.linkFile ? (
                            <a href={item.linkFile} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-blue-600 text-xs font-bold bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200">
                              <Download size={13} /> Buka
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs bg-slate-100 px-2 py-1 rounded">Kosong</span>
                          )}
                        </td>
                      )}

                      {activeTab !== "peminjaman" && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex gap-1.5 justify-center" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleOpenModal(item)} className="text-amber-600 hover:bg-amber-50 p-1.5 bg-white border border-slate-200 rounded-lg transition">
                              <Edit size={14} />
                            </button>
                            <button onClick={() => handleDeleteData(item.id)} className="text-red-600 hover:bg-red-50 p-1.5 bg-white border border-slate-200 rounded-lg transition">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL PENGATURAN PERIODE (TOMBOL SIMPAN STICKY DI ATAS) ================= */}
      {isPeriodeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
            {/* Sticky Top Bar inside Modal */}
            <div className="sticky top-0 z-20 bg-white px-5 py-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2 shrink-0">
              <h2 className="font-black text-slate-900 text-base flex items-center gap-2">
                <FolderTree size={18} className="text-amber-600" />
                {periodeFormData.id ? "Edit Periode Surat" : "Buat Periode Baru"}
              </h2>
              <div className="flex items-center gap-2">
                {periodeFormData.id && (
                  <button
                    type="button"
                    onClick={() => setPeriodeFormData({ lembaga: activeLembaga, periode: "", linkMasuk: "", linkKeluar: "" })}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold transition"
                  >
                    + Baru
                  </button>
                )}
                <button
                  type="submit"
                  form="periodeForm"
                  className="text-xs font-bold px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition"
                >
                  <Save size={14} /> Simpan
                </button>
                <button onClick={() => setIsPeriodeModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto bg-white flex-1 space-y-4">
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
                Buat nama Periode Kepengurusan (Misal: <strong>2026 - 2027</strong>) dan cantumkan tautan folder Google Drive tempat berkas PDF/Scan arsip disimpan.
              </div>

              <form id="periodeForm" onSubmit={handleSavePeriode} className="space-y-4">
                <div>
                  <label className={labelStandardClass}>Nama Periode Kepengurusan</label>
                  <input
                    type="text"
                    required
                    value={periodeFormData.periode || ""}
                    onChange={e => setPeriodeFormData({ ...periodeFormData, periode: e.target.value })}
                    className={inputStandardClass}
                    placeholder="Contoh: Tahun 2026-2027"
                  />
                </div>
                <div>
                  <label className={labelStandardClass}>Link Folder G-Drive (Surat Masuk)</label>
                  <input
                    type="url"
                    required
                    value={periodeFormData.linkMasuk || ""}
                    onChange={e => setPeriodeFormData({ ...periodeFormData, linkMasuk: e.target.value })}
                    className={inputStandardClass}
                    placeholder="https://drive.google.com/drive/folders/..."
                  />
                </div>
                <div>
                  <label className={labelStandardClass}>Link Folder G-Drive (Surat Keluar)</label>
                  <input
                    type="url"
                    required
                    value={periodeFormData.linkKeluar || ""}
                    onChange={e => setPeriodeFormData({ ...periodeFormData, linkKeluar: e.target.value })}
                    className={inputStandardClass}
                    placeholder="https://drive.google.com/drive/folders/..."
                  />
                </div>
              </form>

              {periodeFormData.id && (
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-400">Ingin menghapus periode ini beserta isinya?</span>
                  <button
                    type="button"
                    onClick={handleDeletePeriode}
                    className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                  >
                    Hapus Periode
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL FORM TAMBAH/EDIT DATA UMUM (TOMBOL SIMPAN STICKY DI ATAS) ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
            {/* Sticky Top Header inside Modal with Save Button */}
            <div className="sticky top-0 z-20 bg-white px-5 sm:px-6 py-4 border-b border-slate-200 flex justify-between items-center gap-3 shrink-0">
              <h2 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                {editDataId ? <Edit size={18} className="text-amber-500" /> : <Plus size={18} className="text-blue-600" />}
                <span>{editDataId ? "Edit Data Arsip" : "Tambah Data Baru"}</span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  form="arsipForm"
                  disabled={isUploadingFoto}
                  className={`text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5 ${
                    isUploadingFoto ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  <Save size={15} /> Simpan Data
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto bg-white flex-1">
              {activeTab === "persuratan" && !editDataId && (
                <div className="mb-6 bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-0.5">
                      <Sparkles size={15} className="text-blue-600" /> Ekstrak Teks Surat Otomatis
                    </h4>
                    <p className="text-xs text-slate-600">
                      Gunakan asisten ekstraksi untuk menyalin nomor dan perihal dari foto/scan surat.
                    </p>
                  </div>
                  <a
                    href="https://gemini.google.com/share/37c53e940950"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0"
                  >
                    <ExternalLink size={13} /> Buka Ekstraktor
                  </a>
                </div>
              )}

              <form id="arsipForm" onSubmit={handleSaveData} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {activeTab === "persuratan" && (
                  <>
                    <div className="md:col-span-2">
                      <label className={labelStandardClass}>Nomor Surat</label>
                      <input type="text" required value={formData.nomorSurat || ""} onChange={e => setFormData({ ...formData, nomorSurat: e.target.value })} className={inputStandardClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelStandardClass}>{activeSuratTab === "masuk" ? "Asal Surat" : "Tujuan Surat"}</label>
                      <input type="text" required value={activeSuratTab === "masuk" ? formData.asalSurat || "" : formData.tujuanSurat || ""} onChange={e => setFormData({ ...formData, [activeSuratTab === "masuk" ? "asalSurat" : "tujuanSurat"]: e.target.value })} className={inputStandardClass} />
                    </div>
                    <div>
                      <label className={labelStandardClass}>Tanggal Pembuatan</label>
                      <input type="date" value={formData.tglBuat || ""} onChange={e => setFormData({ ...formData, tglBuat: e.target.value })} className={inputStandardClass} />
                    </div>
                    <div>
                      <label className={labelStandardClass}>{activeSuratTab === "masuk" ? "Tanggal Diterima" : "Tanggal Dikirim"}</label>
                      <input type="date" value={activeSuratTab === "masuk" ? formData.tglDatang || "" : formData.tglKirim || ""} onChange={e => setFormData({ ...formData, [activeSuratTab === "masuk" ? "tglDatang" : "tglKirim"]: e.target.value })} className={inputStandardClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelStandardClass}>Perihal / Hal</label>
                      <input type="text" value={formData.hal || ""} onChange={e => setFormData({ ...formData, hal: e.target.value })} className={inputStandardClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelStandardClass}>Keterangan (Opsional)</label>
                      <input type="text" value={formData.ket || ""} onChange={e => setFormData({ ...formData, ket: e.target.value })} className={inputStandardClass} placeholder="Contoh: Sangat Penting, Segera..." />
                    </div>
                  </>
                )}

                {activeTab === "proker" && (
                  <>
                    <div className="md:col-span-2">
                      <label className={labelStandardClass}>Nama Program Kerja</label>
                      <input type="text" required value={formData.namaProker || ""} onChange={e => setFormData({ ...formData, namaProker: e.target.value })} className={inputStandardClass} />
                    </div>
                    <div>
                      <label className={labelStandardClass}>Biro / Pelaksana</label>
                      <input type="text" required value={formData.pelaksanaProker || ""} onChange={e => setFormData({ ...formData, pelaksanaProker: e.target.value })} className={inputStandardClass} />
                    </div>
                    <div>
                      <label className={labelStandardClass}>Waktu Pelaksanaan</label>
                      <input type="date" value={formData.waktuPelaksanaan || ""} onChange={e => setFormData({ ...formData, waktuPelaksanaan: e.target.value })} className={inputStandardClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelStandardClass}>Tujuan Kegiatan</label>
                      <textarea rows="2" value={formData.tujuan || ""} onChange={e => setFormData({ ...formData, tujuan: e.target.value })} className={inputStandardClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelStandardClass}>Indikator Keberhasilan</label>
                      <textarea rows="2" value={formData.indikator || ""} onChange={e => setFormData({ ...formData, indikator: e.target.value })} className={inputStandardClass} />
                    </div>
                    <div>
                      <label className={labelStandardClass}>Sasaran</label>
                      <input type="text" value={formData.sasaran || ""} onChange={e => setFormData({ ...formData, sasaran: e.target.value })} className={inputStandardClass} placeholder="Misal: Kader Baru" />
                    </div>
                    <div>
                      <label className={labelStandardClass}>Penanggung Jawab</label>
                      <input type="text" value={formData.penanggungJawab || ""} onChange={e => setFormData({ ...formData, penanggungJawab: e.target.value })} className={inputStandardClass} placeholder="Nama Koordinator" />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelStandardClass}>Estimasi Dana</label>
                      <input type="text" value={formData.estimasiDana || ""} onChange={e => setFormData({ ...formData, estimasiDana: e.target.value })} className={inputStandardClass} placeholder="Misal: Rp 1.500.000" />
                    </div>
                  </>
                )}

                {activeTab === "produkhukum" && (
                  <>
                    <div className="md:col-span-2">
                      <label className={labelStandardClass}>Nomor SK / Ketetapan</label>
                      <input type="text" required value={formData.nomorSK || ""} onChange={e => setFormData({ ...formData, nomorSK: e.target.value })} className={inputStandardClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelStandardClass}>Tentang</label>
                      <textarea rows="2" required value={formData.tentangHukum || ""} onChange={e => setFormData({ ...formData, tentangHukum: e.target.value })} className={inputStandardClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelStandardClass}>Deskripsi Singkat Hukum</label>
                      <textarea rows="2" value={formData.deskripsiHukum || ""} onChange={e => setFormData({ ...formData, deskripsiHukum: e.target.value })} className={inputStandardClass} />
                    </div>

                    <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-1">
                      <label className={labelStandardClass}>Upload Thumbnail / Sampul (Opsional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          setFotoUrls([]);
                          uploadToCloudinary(e.target.files);
                        }}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        disabled={isUploadingFoto}
                      />

                      {isUploadingFoto && (
                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                          <Loader2 size={12} className="animate-spin" /> Mengunggah gambar sampul...
                        </p>
                      )}

                      {fotoUrls.length > 0 && (
                        <div className="flex gap-3 mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {fotoUrls.slice(0, 1).map((url, idx) => (
                            <div key={idx} className="relative w-24 h-32 rounded-lg overflow-hidden border border-slate-200 group shadow-sm">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt="thumbnail" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setFotoUrls([])}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
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

                {activeTab === "laporan" && (
                  <>
                    <div className="md:col-span-2">
                      <label className={labelStandardClass}>Nama / Judul Laporan</label>
                      <input type="text" required value={formData.namaLaporan || ""} onChange={e => setFormData({ ...formData, namaLaporan: e.target.value })} className={inputStandardClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelStandardClass}>Periode Laporan</label>
                      <input type="text" value={formData.periode || ""} onChange={e => setFormData({ ...formData, periode: e.target.value })} className={inputStandardClass} placeholder="Misal: Tahun 2026" />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelStandardClass}>Deskripsi Singkat Laporan</label>
                      <textarea rows="2" value={formData.deskripsiLaporan || ""} onChange={e => setFormData({ ...formData, deskripsiLaporan: e.target.value })} className={inputStandardClass} />
                    </div>
                  </>
                )}

                {activeTab === "presentasi" && (
                  <>
                    <div className="md:col-span-2">
                      <label className={labelStandardClass}>Judul Presentasi / Dokumen</label>
                      <input type="text" required value={formData.judul || ""} onChange={e => setFormData({ ...formData, judul: e.target.value })} className={inputStandardClass} placeholder="Contoh: Materi Kaderisasi Dasar" />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelStandardClass}>Tipe Dokumen</label>
                      <select value={formData.tipeDokumen || "Canva"} onChange={e => setFormData({ ...formData, tipeDokumen: e.target.value })} className={inputStandardClass}>
                        <option value="Canva">Presentasi Canva</option>
                        <option value="Google Docs">Google Docs (Word)</option>
                        <option value="Google Sheets">Google Sheets (Excel)</option>
                        <option value="Google Slides">Google Slides (PPT)</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelStandardClass}>Deskripsi Singkat</label>
                      <textarea rows="2" value={formData.deskripsi || ""} onChange={e => setFormData({ ...formData, deskripsi: e.target.value })} className={inputStandardClass} placeholder="Bahas tentang materi apa dokumen ini..." />
                    </div>
                    <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-1">
                      <label className={labelStandardClass}>Link Sematkan (Embed URL) - Wajib Untuk View Interaktif</label>
                      <input type="url" value={formData.embedUrl || ""} onChange={e => setFormData({ ...formData, embedUrl: e.target.value })} className={`${inputStandardClass} font-mono text-xs`} placeholder="Masukkan link dari Bagikan > Sematkan (Embed)..." />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelStandardClass}>Link File Unduhan (Opsional)</label>
                      <input type="url" value={formData.downloadUrl || ""} onChange={e => setFormData({ ...formData, downloadUrl: e.target.value })} className={`${inputStandardClass} font-mono text-xs`} placeholder="Link Google Drive, Firebase Storage, dsb..." />
                    </div>
                  </>
                )}

                {activeTab === "inventaris" && (
                  <>
                    <div className="md:col-span-2">
                      <label className={labelStandardClass}>Nama Barang</label>
                      <input type="text" required value={formData.namaBarang || ""} onChange={e => setFormData({ ...formData, namaBarang: e.target.value })} className={inputStandardClass} placeholder="Contoh: Proyektor Epson, Sound System, dll" />
                    </div>
                    <div>
                      <label className={labelStandardClass}>Jumlah Stok Total</label>
                      <input type="number" required min="1" value={formData.jumlah || ""} onChange={e => setFormData({ ...formData, jumlah: e.target.value })} className={inputStandardClass} placeholder="Misal: 5" />
                    </div>
                    <div>
                      <label className={labelStandardClass}>Kondisi Barang</label>
                      <select value={formData.kondisi || "Baik"} onChange={e => setFormData({ ...formData, kondisi: e.target.value })} className={inputStandardClass}>
                        <option value="Baik">Baik</option>
                        <option value="Rusak Ringan">Rusak Ringan</option>
                        <option value="Rusak Berat">Rusak Berat</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelStandardClass}>Deskripsi Detail</label>
                      <textarea rows="2" value={formData.deskripsi || ""} onChange={e => setFormData({ ...formData, deskripsi: e.target.value })} className={inputStandardClass} placeholder="Kelengkapan barang (kabel, tas), merk, ciri khusus..." />
                    </div>

                    <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-1">
                      <label className={labelStandardClass}>Upload Foto Barang (Bisa Pilih Banyak)</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => uploadToCloudinary(e.target.files)}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        disabled={isUploadingFoto}
                      />

                      {isUploadingFoto && (
                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                          <Loader2 size={12} className="animate-spin" /> Mengunggah & mengompresi gambar...
                        </p>
                      )}

                      {fotoUrls.length > 0 && (
                        <div className="flex flex-wrap gap-3 mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {fotoUrls.map((url, idx) => (
                            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt="preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeFoto(idx)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
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

                {activeTab !== "presentasi" && activeTab !== "inventaris" && activeTab !== "persuratan" && (
                  <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-1">
                    <label className={labelStandardClass}>Link File Arsip (G-Drive / PDF)</label>
                    <input type="url" value={formData.linkFile || ""} onChange={e => setFormData({ ...formData, linkFile: e.target.value })} className={`${inputStandardClass} font-mono text-xs`} placeholder="https://drive.google.com/..." />
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
