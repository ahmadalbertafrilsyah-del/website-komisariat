"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, FileText, BarChart3, History, MessageSquare, Image as ImageIcon, Target, AlertCircle } from "lucide-react";

export default function AdminBerandaEditor() {
  const [loading, setLoading] = useState(true);
  
  const [berandaConfig, setBerandaConfig] = useState({
    heroTitle: "Kaderisasi \nTanpa Batas.",
    heroSubtitle: "Wadah pergerakan mahasiswa Islam di UIN Maulana Malik Ibrahim Malang. Mari bersama mencetak agen perubahan yang religius, intelektual, dan profesional.",
    heroImage: "", 
    
    statKader: "200",
    statRayon: "3",
    statKegiatan: "50",
    statAlumni: "1000",
    
    sejarahTitle: "Menyatukan Keislaman, Keilmuan & Kebangsaan",
    sejarahDesc: "Pergerakan Mahasiswa Islam Indonesia (PMII) lahir sebagai wadah perjuangan mahasiswa berlandaskan Islam Ahlussunnah Wal Jama'ah. Kami menempatkan integrasi keilmuan dan keagamaan dalam satu tarikan napas.",
    sejarahQuote: "Menjadikan Dzikir, Fikir, dan Amal Sholeh sebagai Tri Motto untuk meneguhkan dimensi spiritual, mengasah daya kritis, dan mewujudkan keberpihakan sosial.",
    sejarahTahun: "1960",
    sejarahImage: "", 
    
    nilaiTitle: "Nilai Dasar",
    nilaiHighlight: "Pergerakan",
    nilaiSubtitle: "Arah pembentukan kader dan orientasi perjuangan organisasi.",
    nilai1Title: "Intelektualitas & Kritis",
    nilai1Desc: "Fokus pada kajian ilmiah, peningkatan literasi, dan penguasaan ilmu pengetahuan.",
    nilai2Title: "Ketakwaan",
    nilai2Desc: "Berlandaskan iman dan kedekatan kepada Allah SWT.",
    nilai3Title: "Pengabdian",
    nilai3Desc: "Turun langsung melakukan advokasi isu-isu kemasyarakatan.",
    nilai4Title: "Komitmen Kebangsaan",
    nilai4Desc: "Berjuang menjaga cita-cita kemerdekaan Indonesia dan merawat kebhinekaan.",
    
    ctaTitle: "Mari Melangkah Bersama PMII.",
    ctaSubtitle: "Sistem pendataan terintegrasi telah dibuka. Daftarkan diri Anda dan jadilah bagian dari agen perubahan yang progresif."
  });

  useEffect(() => {
    async function loadBerandaSettings() {
      try {
        const docRef = doc(db, "website_config", "settings");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBerandaConfig({ ...berandaConfig, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Gagal mengambil data beranda:", error);
      } finally {
        setLoading(false);
      }
    }
    loadBerandaSettings();
  }, []);

  const handleSaveBeranda = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, "website_config", "settings");
      await setDoc(docRef, berandaConfig);
      alert("Seluruh Konten Halaman Beranda Berhasil Diperbarui!");
    } catch (error) {
      alert("Gagal menyimpan perubahan: " + error.message);
    }
  };

  if (loading) return <p className="text-slate-500 animate-pulse font-medium">Memuat formulir beranda...</p>;

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText size={24} className="text-blue-600" /> Kustomisasi Halaman Beranda
        </h1>
        <p className="text-sm text-slate-500 mt-1">Gunakan formulir di bawah ini untuk mengubah isi konten beranda dari atas sampai bawah.</p>
      </div>

      <form onSubmit={handleSaveBeranda} className="space-y-6 max-w-4xl">
        
        {/* ================= SEKSI 1: BANNER HERO UTAMA (DIPERBARUI) ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2 font-bold text-slate-800">
             <FileText size={18} className="text-blue-600" /> 1. Area Banner Utama (Top Hero)
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Judul Utama Banner Hero</label>
              <input type="text" required value={berandaConfig.heroTitle} onChange={(e) => setBerandaConfig({...berandaConfig, heroTitle: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Sub-Judul Narasi Keterangan</label>
              <textarea required rows="3" value={berandaConfig.heroSubtitle} onChange={(e) => setBerandaConfig({...berandaConfig, heroSubtitle: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm leading-relaxed" />
            </div>
            
            {/* PERUBAHAN: Modifikasi Area Input Gambar PNG Transparan */}
            <div className="pt-4 border-t border-slate-100 mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                 <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                   <ImageIcon size={14} className="text-blue-500"/> URL Foto Banner (Sebelah Kanan)
                 </label>
                 <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-bold border border-emerald-100 uppercase tracking-wider w-max">
                   PNG Transparan (Wajib)
                 </span>
              </div>
              <input 
                type="text" 
                value={berandaConfig.heroImage || ""} 
                onChange={(e) => setBerandaConfig({...berandaConfig, heroImage: e.target.value})} 
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono" 
                placeholder="Tempel link gambar ImgBB (Pastikan berakhiran .png)..." 
              />
              <div className="mt-2.5 flex items-start gap-1.5 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <AlertCircle size={14} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-[10px] md:text-xs text-blue-700 leading-relaxed font-medium">
                  <strong>Tips Desain Maksimal:</strong> Agar tampilan web terlihat mahal dan menyatu dengan *background* (tidak kaku membentuk kotak), pastikan Anda mengunggah foto kader/tokoh yang <strong>latar belakangnya sudah dihapus</strong> (Transparan / format PNG). Kosongkan kolom ini jika ingin menyembunyikan gambar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= SEKSI 2: COUNTER DATA STATISTIK ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2 font-bold text-slate-800">
             <BarChart3 size={18} className="text-blue-600" /> 2. Angka Data Statistik
          </div>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div><label className="text-xs font-bold text-slate-700 block mb-1">Kader Aktif</label><input type="number" required value={berandaConfig.statKader} onChange={(e) => setBerandaConfig({...berandaConfig, statKader: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold font-mono" /></div>
            <div><label className="text-xs font-bold text-slate-700 block mb-1">Jumlah Rayon</label><input type="number" required value={berandaConfig.statRayon} onChange={(e) => setBerandaConfig({...berandaConfig, statRayon: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold font-mono" /></div>
            <div><label className="text-xs font-bold text-slate-700 block mb-1">Kegiatan / Tahun</label><input type="number" required value={berandaConfig.statKegiatan} onChange={(e) => setBerandaConfig({...berandaConfig, statKegiatan: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold font-mono" /></div>
            <div><label className="text-xs font-bold text-slate-700 block mb-1">Jejaring Alumni</label><input type="number" required value={berandaConfig.statAlumni} onChange={(e) => setBerandaConfig({...berandaConfig, statAlumni: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold font-mono" /></div>
          </div>
        </div>

        {/* ================= SEKSI 3: SEJARAH ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2 font-bold text-slate-800">
             <History size={18} className="text-blue-600" /> 3. Profil Narasi Sejarah
          </div>
          <div className="p-6 space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2"><label className="text-xs font-bold text-slate-700 block mb-1">Judul Slogan Sejarah</label><input type="text" required value={berandaConfig.sejarahTitle} onChange={(e) => setBerandaConfig({...berandaConfig, sejarahTitle: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm" /></div>
              <div><label className="text-xs font-bold text-slate-700 block mb-1">Tahun Berdiri</label><input type="text" required value={berandaConfig.sejarahTahun} onChange={(e) => setBerandaConfig({...berandaConfig, sejarahTahun: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold" /></div>
            </div>
            <div><label className="text-xs font-bold text-slate-700 block mb-1">Isi Paragraf Penjelasan</label><textarea required rows="3" value={berandaConfig.sejarahDesc} onChange={(e) => setBerandaConfig({...berandaConfig, sejarahDesc: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm text-slate-600" /></div>
            <div><label className="text-xs font-bold text-slate-700 block mb-1">Kutipan / Quote Tri Motto</label><textarea required rows="2" value={berandaConfig.sejarahQuote} onChange={(e) => setBerandaConfig({...berandaConfig, sejarahQuote: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm italic" /></div>
            <div className="pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1"><ImageIcon size={14} className="text-blue-500"/> URL Foto Dokumentasi Sejarah</label>
              <input type="text" value={berandaConfig.sejarahImage || ""} onChange={(e) => setBerandaConfig({...berandaConfig, sejarahImage: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Tempel link gambar. Kosongkan untuk pakai abu-abu bawaan." />
            </div>
          </div>
        </div>

        {/* ================= SEKSI 4: NILAI DASAR ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2 font-bold text-slate-800">
             <Target size={18} className="text-blue-600" /> 4. Nilai Dasar Pergerakan
          </div>
          <div className="p-6 space-y-6">
            
            <div className="grid sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div><label className="text-[11px] font-bold text-slate-500 block mb-1">Teks Putih (Kiri)</label><input type="text" required value={berandaConfig.nilaiTitle} onChange={(e) => setBerandaConfig({...berandaConfig, nilaiTitle: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" placeholder="Nilai Dasar" /></div>
              <div><label className="text-[11px] font-bold text-yellow-600 block mb-1">Teks Kuning (Kanan)</label><input type="text" required value={berandaConfig.nilaiHighlight} onChange={(e) => setBerandaConfig({...berandaConfig, nilaiHighlight: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" placeholder="Pergerakan" /></div>
              <div className="sm:col-span-2"><label className="text-[11px] font-bold text-slate-500 block mb-1">Sub-Judul Keterangan</label><input type="text" required value={berandaConfig.nilaiSubtitle} onChange={(e) => setBerandaConfig({...berandaConfig, nilaiSubtitle: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" placeholder="Arah pembentukan kader..." /></div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2 border border-slate-100 p-4 rounded-xl">
                 <div className="text-xs font-bold text-blue-600 bg-blue-50 w-max px-2 py-1 rounded">Kotak Biru</div>
                 <input type="text" required value={berandaConfig.nilai1Title} onChange={(e) => setBerandaConfig({...berandaConfig, nilai1Title: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" />
                 <textarea rows="2" required value={berandaConfig.nilai1Desc} onChange={(e) => setBerandaConfig({...berandaConfig, nilai1Desc: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-xs leading-relaxed" />
              </div>
              <div className="space-y-2 border border-slate-100 p-4 rounded-xl">
                 <div className="text-xs font-bold text-yellow-600 bg-yellow-50 w-max px-2 py-1 rounded">Kotak Kuning</div>
                 <input type="text" required value={berandaConfig.nilai2Title} onChange={(e) => setBerandaConfig({...berandaConfig, nilai2Title: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" />
                 <textarea rows="2" required value={berandaConfig.nilai2Desc} onChange={(e) => setBerandaConfig({...berandaConfig, nilai2Desc: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-xs leading-relaxed" />
              </div>
              <div className="space-y-2 border border-slate-100 p-4 rounded-xl">
                 <div className="text-xs font-bold text-emerald-600 bg-emerald-50 w-max px-2 py-1 rounded">Kotak Hijau</div>
                 <input type="text" required value={berandaConfig.nilai3Title} onChange={(e) => setBerandaConfig({...berandaConfig, nilai3Title: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" />
                 <textarea rows="2" required value={berandaConfig.nilai3Desc} onChange={(e) => setBerandaConfig({...berandaConfig, nilai3Desc: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-xs leading-relaxed" />
              </div>
              <div className="space-y-2 border border-slate-100 p-4 rounded-xl">
                 <div className="text-xs font-bold text-purple-600 bg-purple-50 w-max px-2 py-1 rounded">Kotak Ungu</div>
                 <input type="text" required value={berandaConfig.nilai4Title} onChange={(e) => setBerandaConfig({...berandaConfig, nilai4Title: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" />
                 <textarea rows="2" required value={berandaConfig.nilai4Desc} onChange={(e) => setBerandaConfig({...berandaConfig, nilai4Desc: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-xs leading-relaxed" />
              </div>
            </div>

          </div>
        </div>

        {/* ================= SEKSI 5: CALL TO ACTION (CTA) ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2 font-bold text-slate-800">
             <MessageSquare size={18} className="text-blue-600" /> 5. Banner Ajakan Gabung (CTA)
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Judul Ajakan CTA</label>
              <input type="text" required value={berandaConfig.ctaTitle} onChange={(e) => setBerandaConfig({...berandaConfig, ctaTitle: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Sub-Judul Narasi Ajakan</label>
              <input type="text" required value={berandaConfig.ctaSubtitle} onChange={(e) => setBerandaConfig({...berandaConfig, ctaSubtitle: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm" />
            </div>
          </div>
        </div>

        {/* Button Save */}
        <div className="flex justify-end">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition flex items-center justify-center gap-2 shadow-md">
            Perbarui Teks & Gambar Beranda <Save size={18} />
          </button>
        </div>

      </form>
    </div>
  );
}