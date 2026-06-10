// app/administrasi/inventaris/[id]/page.js
"use client";
import React, { useState, useEffect, use } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, ArrowLeft, Camera, CalendarDays, Package, CheckCircle2, AlertTriangle, AlertOctagon, Info, FileText, Send, Clock, XCircle, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function DetailInventarisPage({ params }) {
  const unwrappedParams = use(params);
  const itemId = unwrappedParams.id;
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "foto");
  const [globalCalendarUrl, setGlobalCalendarUrl] = useState("");

  // 🔥 STATE BARU UNTUK SISTEM PEMINJAMAN
  const [peminjamanList, setPeminjamanList] = useState([]);
  const [currentAvailableStock, setCurrentAvailableStock] = useState(0);
  
  // State Form Peminjaman
  const [formData, setFormData] = useState({
    namaOrganisasi: "",
    kegiatan: "",
    peminjam: "",
    jumlahPinjam: 1,
    waktuPinjam: "",
    waktuSelesai: ""
  });
  const [suratFile, setSuratFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Ambil Data Barang
        const docRef = doc(db, "website_config", "database_administrasi");
        const docSnap = await getDoc(docRef);
        
        let foundItem = null;
        if (docSnap.exists()) {
          const data = docSnap.data();
          const listInventaris = data.listInventaris || [];
          foundItem = listInventaris.find(i => i.id === itemId);
          setItem(foundItem);
          setGlobalCalendarUrl(data.globalCalendarUrl || ""); 
        }

        // 2. Ambil Riwayat Peminjaman Barang Ini
        if (foundItem) {
          const q = query(collection(db, "peminjaman_inventaris"), where("itemId", "==", itemId));
          const querySnapshot = await getDocs(q);
          const riwayat = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Urutkan berdasarkan waktu pinjam terbaru
          riwayat.sort((a, b) => new Date(b.waktuPinjam) - new Date(a.waktuPinjam));
          setPeminjamanList(riwayat);

          // 3. Kalkulasi Stok Real-time (Hari Ini)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          let usedStockToday = 0;
          riwayat.forEach(p => {
            if (p.status === "Disetujui") {
              const start = new Date(p.waktuPinjam);
              const end = new Date(p.waktuSelesai);
              start.setHours(0, 0, 0, 0);
              end.setHours(23, 59, 59, 999);
              
              // Jika hari ini berada di antara tanggal pinjam & selesai
              if (today >= start && today <= end) {
                usedStockToday += Number(p.jumlahPinjam || 1);
              }
            }
          });

          const baseStock = Number(foundItem.jumlah || 0);
          setCurrentAvailableStock(Math.max(0, baseStock - usedStockToday));
        }

      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (itemId) fetchData();
  }, [itemId]);

  // Fungsi Validasi Ketersediaan Jadwal
  const checkAvailability = (startStr, endStr, reqJumlah) => {
    const startReq = new Date(startStr);
    const endReq = new Date(endStr);
    const baseStock = Number(item.jumlah || 0);

    // Cek setiap hari dalam rentang yang diminta
    for (let d = new Date(startReq); d <= endReq; d.setDate(d.getDate() + 1)) {
      let dailyUsed = 0;
      peminjamanList.forEach(p => {
        if (p.status === "Disetujui") {
          const pStart = new Date(p.waktuPinjam);
          const pEnd = new Date(p.waktuSelesai);
          if (d >= pStart && d <= pEnd) {
            dailyUsed += Number(p.jumlahPinjam || 1);
          }
        }
      });

      // Jika pada hari tersebut (Sisa Stok < Jumlah yang mau dipinjam) -> DITOLAK
      if (baseStock - dailyUsed < reqJumlah) {
        return false; 
      }
    }
    return true;
  };

  // Fungsi Upload Surat ke Cloudinary
  const uploadSuratToCloudinary = async (file) => {
    if (!file) return null;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME; 
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET; 
    
    if (!cloudName || !uploadPreset) {
      alert("Error: Konfigurasi Cloudinary di .env belum lengkap!");
      return null;
    }

    const formDataObj = new FormData();
    formDataObj.append("file", file);
    formDataObj.append("upload_preset", uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: "POST",
        body: formDataObj,
      });
      const data = await res.json();
      return data.secure_url; // Mengembalikan URL file
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // Handle Submit Form Pengajuan
  const handleAjukanPeminjaman = async (e) => {
    e.preventDefault();
    if (Number(formData.jumlahPinjam) < 1) return alert("Jumlah pinjam minimal 1.");
    if (new Date(formData.waktuSelesai) < new Date(formData.waktuPinjam)) return alert("Tanggal Selesai tidak boleh mendahului Tanggal Mulai.");

    // Cek Bentrok Jadwal
    const isAvailable = checkAvailability(formData.waktuPinjam, formData.waktuSelesai, Number(formData.jumlahPinjam));
    if (!isAvailable) {
      alert(`⚠️ PENGATURAN JADWAL DITOLAK!\n\nPada rentang tanggal tersebut, stok barang tidak mencukupi (sudah dibooking/dipinjam orang lain). Silakan pilih tanggal lain atau kurangi jumlah pinjaman.`);
      return;
    }

    if (!suratFile) return alert("Harap unggah Surat Permohonan!");

    setIsSubmitting(true);
    try {
      // 1. Upload Surat ke Cloudinary
      const suratUrl = await uploadSuratToCloudinary(suratFile);
      if (!suratUrl) throw new Error("Gagal mengunggah surat permohonan.");

      // 2. Simpan ke Firebase Collection 'peminjaman_inventaris'
      const payload = {
        itemId: item.id,
        namaBarang: item.namaBarang,
        namaOrganisasi: formData.namaOrganisasi,
        kegiatan: formData.kegiatan,
        peminjam: formData.peminjam,
        jumlahPinjam: Number(formData.jumlahPinjam),
        waktuPinjam: formData.waktuPinjam,
        waktuSelesai: formData.waktuSelesai,
        suratUrl: suratUrl,
        status: "Diproses", // Default Status
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "peminjaman_inventaris"), payload);
      
      // Update UI langsung
      setPeminjamanList([{ id: docRef.id, ...payload, createdAt: new Date() }, ...peminjamanList]);
      
      alert("Pengajuan Peminjaman Berhasil Dikirim! Silakan tunggu konfirmasi Admin.");
      setFormData({ namaOrganisasi: "", kegiatan: "", peminjam: "", jumlahPinjam: 1, waktuPinjam: "", waktuSelesai: "" });
      setSuratFile(null);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔥 PERBAIKAN LOGIKA STATUS KONDISI (LEBIH KEBAL ERROR & SPASI)
  const getKondisiBadge = (kondisi) => {
    // Normalisasi string: hilangkan spasi depan/belakang dan jadikan huruf kecil
    const statusVal = (kondisi || "Baik").trim().toLowerCase();
    
    if (statusVal === "rusak ringan") {
      return <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider"><AlertTriangle size={14}/> Rusak Ringan</span>;
    }
    
    if (statusVal === "rusak berat") {
      return <span className="flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider"><AlertOctagon size={14}/> Rusak Berat</span>;
    }
    
    // Default jika statusVal adalah "baik", undefined, atau typo apa saja
    return <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider"><CheckCircle2 size={14}/> Baik</span>;
  };

  if (loading) return <div className="min-h-screen bg-[#f8fafc] flex justify-center items-center"><Loader2 size={40} className="text-blue-600 animate-spin" /></div>;

  if (!item) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center text-center">
      <Package size={60} className="text-slate-300 mb-4" />
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Barang Tidak Ditemukan</h1>
      <Link href="/administrasi" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold mt-4">Kembali</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-28 md:pt-36 pb-16 px-4 md:px-8 max-w-5xl mx-auto w-full">
        
        <Link href="/administrasi" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition mb-6">
          <ArrowLeft size={16} /> Kembali ke Inventaris
        </Link>

        {/* HEADER BARANG */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                 <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-widest">
                   <Package size={14}/> Inventaris PMII
                 </span>
                 {/* Panggil fungsi kondisi yang sudah kebal error */}
                 {getKondisiBadge(item.kondisi)}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 leading-snug">
                {item.namaBarang}
              </h1>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-4">
                {item.deskripsi || "Tidak ada deskripsi detail mengenai barang ini."}
              </p>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-center shrink-0 min-w-[160px] flex flex-col items-center justify-center">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Stok Real-time</p>
               <div className="flex items-baseline gap-2">
                 <span className={`text-5xl font-black ${currentAvailableStock === 0 ? 'text-red-500' : 'text-blue-600'}`}>
                   {currentAvailableStock}
                 </span>
                 <span className="text-xl font-bold text-slate-400">/ {item.jumlah}</span>
               </div>
               <p className="text-xs font-semibold text-slate-500 mt-2 bg-white px-3 py-1 rounded-full border border-slate-200">
                 {currentAvailableStock === 0 ? "Habis Dipinjam" : "Tersedia Saat Ini"}
               </p>
            </div>
          </div>
        </div>

        {/* TABS MULTIFUNGSI */}
        <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-px scrollbar-none mb-6">
          <button onClick={() => setActiveTab("foto")} className={`px-5 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "foto" ? "border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-sm" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
            <Camera size={16} /> Galeri Foto
          </button>
          <button onClick={() => setActiveTab("kalender")} className={`px-5 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "kalender" ? "border-purple-600 text-purple-600 bg-white rounded-t-lg shadow-sm" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
            <CalendarDays size={16} /> Jadwal Global
          </button>
          <button onClick={() => setActiveTab("pengajuan")} className={`px-5 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "pengajuan" ? "border-emerald-600 text-emerald-600 bg-white rounded-t-lg shadow-sm" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
            <FileText size={16} /> Pengajuan Peminjaman
          </button>
        </div>

        {/* ================= TAB 1: FOTO ================= */}
        {activeTab === "foto" && (
          <div className="animate-in fade-in duration-300">
            {(!item.fotoGroup || item.fotoGroup.length === 0) ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
                <Camera size={48} className="text-slate-300 mx-auto mb-4" />
                <h3 className="font-bold text-slate-700 text-lg">Foto Belum Tersedia</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {item.fotoGroup.map((fotoUrl, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative w-full pt-[75%] bg-slate-100 rounded-lg overflow-hidden border border-slate-100">
                       <img src={fotoUrl} alt={`Foto ${item.namaBarang} ${idx + 1}`} className="absolute top-0 left-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: KALENDER GLOBAL ================= */}
        {activeTab === "kalender" && (
          <div className="animate-in fade-in duration-300">
             <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 flex items-start gap-3">
               <Info className="text-purple-600 shrink-0 mt-0.5" size={18} />
               <div>
                 <h4 className="text-sm font-bold text-purple-900 mb-1">Informasi Jadwal</h4>
                 <p className="text-xs text-purple-700 leading-relaxed">
                   Blok warna pada kalender di bawah ini menandakan jadwal kegiatan yang sudah dibooking. Cek ketersediaan tanggal sebelum mengajukan peminjaman.
                 </p>
               </div>
             </div>

             {globalCalendarUrl ? (
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full relative h-[600px] md:h-[700px]">
                 <iframe src={globalCalendarUrl} style={{ border: 0, width: "100%", height: "100%" }} frameBorder="0" scrolling="no"></iframe>
               </div>
             ) : (
               <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
                 <CalendarDays size={48} className="text-slate-300 mx-auto mb-4" />
                 <h3 className="font-bold text-slate-700 text-lg">Kalender Belum Diatur Admin</h3>
               </div>
             )}
          </div>
        )}

        {/* ================= TAB 3: PENGAJUAN PEMINJAMAN ================= */}
        {activeTab === "pengajuan" && (
          <div className="animate-in fade-in duration-300 grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* FORM KIRI */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
                  <FileText className="text-emerald-600"/> Formulir Pengajuan
                </h3>
                
                <form onSubmit={handleAjukanPeminjaman} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Nama Organisasi / Lembaga <span className="text-red-500">*</span></label>
                      <input type="text" required value={formData.namaOrganisasi} onChange={e => setFormData({...formData, namaOrganisasi: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Contoh: KOPRI PMII Sunan Ampel" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Kegiatan yang Dilaksanakan <span className="text-red-500">*</span></label>
                      <input type="text" required value={formData.kegiatan} onChange={e => setFormData({...formData, kegiatan: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Contoh: Pelatihan Kader Dasar (PKD)" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Penanggung Jawab (PJ) <span className="text-red-500">*</span></label>
                      <input type="text" required value={formData.peminjam} onChange={e => setFormData({...formData, peminjam: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Nama Lengkap PJ" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Jumlah Pinjam <span className="text-red-500">*</span></label>
                      <input type="number" required min="1" max={item.jumlah} value={formData.jumlahPinjam} onChange={e => setFormData({...formData, jumlahPinjam: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Tanggal Mulai Pakai <span className="text-red-500">*</span></label>
                      <input type="date" required value={formData.waktuPinjam} onChange={e => setFormData({...formData, waktuPinjam: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Tanggal Selesai <span className="text-red-500">*</span></label>
                      <input type="date" required value={formData.waktuSelesai} onChange={e => setFormData({...formData, waktuSelesai: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-4 mt-2">
                      <label className="text-xs font-bold text-slate-700 mb-2 block flex items-center gap-1.5"><UploadCloud size={14}/> Upload Surat Permohonan (Foto / PDF) <span className="text-red-500">*</span></label>
                      <input type="file" required accept="image/*, application/pdf" onChange={e => setSuratFile(e.target.files[0])} className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 cursor-pointer" />
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting} className={`w-full py-3.5 rounded-lg font-bold text-sm text-white flex items-center justify-center gap-2 transition-all mt-4 ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-md'}`}>
                    {isSubmitting ? <><Loader2 size={18} className="animate-spin"/> Memproses Pengajuan...</> : <><Send size={18}/> Ajukan Peminjaman</>}
                  </button>
                </form>
              </div>
            </div>

            {/* STATUS KANAN (RIWAYAT) */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Clock className="text-blue-500"/> Status Antrean & Riwayat
                </h3>
                
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                  {peminjamanList.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">Belum ada riwayat peminjaman untuk barang ini.</div>
                  ) : (
                    peminjamanList.map((p, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-slate-800">{p.namaOrganisasi}</span>
                          {p.status === "Disetujui" ? (
                            <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={10}/> Disetujui</span>
                          ) : p.status === "Ditolak" ? (
                            <span className="bg-red-100 text-red-700 text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1"><XCircle size={10}/> Ditolak</span>
                          ) : (
                            <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1"><Clock size={10}/> Diproses</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mb-2 leading-relaxed line-clamp-2">{p.kegiatan} - PJ: {p.peminjam}</p>
                        <div className="flex justify-between items-center text-[10px] font-bold border-t border-slate-200 pt-2 mt-2">
                           <span className="text-slate-500">{p.waktuPinjam} s/d {p.waktuSelesai}</span>
                           <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{p.jumlahPinjam} Unit</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}