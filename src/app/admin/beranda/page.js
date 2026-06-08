"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, FileText, BarChart3, History, MessageSquare, Image as ImageIcon, Target, AlertCircle, UploadCloud, Loader2, Plus, Trash2, GripVertical } from "lucide-react";

export default function AdminBerandaEditor() {
  const [loading, setLoading] = useState(true);
  
  // State untuk melacak proses upload (menyimpan nama field atau indeks yang sedang diupload)
  const [uploadingField, setUploadingField] = useState(null);
  
  const [berandaConfig, setBerandaConfig] = useState({
    // ARRAY SLIDER HERO BARU
    heroSlides: [],
    
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
          const data = docSnap.data();
          
          // MENGAMANKAN DATA LAMA: Jika data heroSlides belum ada, kita buatkan 1 slide default dari data lama
          if (!data.heroSlides || data.heroSlides.length === 0) {
            data.heroSlides = [
              {
                id: Date.now().toString(),
                badge: "Tumbuh, Bergerak, Berdampak",
                title: data.heroTitle || "Kaderisasi \nTanpa Batas.",
                subtitle: data.heroSubtitle || "Wadah pergerakan mahasiswa Islam di UIN Maulana Malik Ibrahim Malang.",
                button1Text: "Gabung PMII",
                button1Link: "/pendaftaran",
                button2Text: "Kenali Pengurus",
                button2Link: "/struktur",
                image: data.heroImage || "",
                bgColor: "from-[#0f172a] to-[#1e293b]"
              }
            ];
          }
          
          setBerandaConfig({ ...berandaConfig, ...data });
        }
      } catch (error) {
        console.error("Gagal mengambil data beranda:", error);
      } finally {
        setLoading(false);
      }
    }
    loadBerandaSettings();
  }, []);

  // ================= FUNGSI MANAJEMEN SLIDER =================
  const handleAddSlide = () => {
    const newSlide = {
      id: Date.now().toString(),
      badge: "Label Baru",
      title: "Judul Slide Baru",
      subtitle: "Keterangan slide baru.",
      button1Text: "Gabung PMII",
      button1Link: "/pendaftaran",
      button2Text: "Info Lanjut",
      button2Link: "/berita",
      image: "",
      bgColor: "from-blue-900 to-indigo-900"
    };
    setBerandaConfig(prev => ({
      ...prev,
      heroSlides: [...prev.heroSlides, newSlide]
    }));
  };

  const handleRemoveSlide = (indexToRemove) => {
    if (confirm("Yakin ingin menghapus slide ini?")) {
      setBerandaConfig(prev => ({
        ...prev,
        heroSlides: prev.heroSlides.filter((_, index) => index !== indexToRemove)
      }));
    }
  };

  const handleSlideChange = (index, field, value) => {
    setBerandaConfig(prev => {
      const updatedSlides = [...prev.heroSlides];
      updatedSlides[index] = { ...updatedSlides[index], [field]: value };
      return { ...prev, heroSlides: updatedSlides };
    });
  };

  // ================= FUNGSI UPLOAD GAMBAR (KHUSUS SLIDER) =================
  const handleSlideImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Harap pilih file berupa gambar!");
      return;
    }
    if (file.type !== "image/png") {
      alert("Catatan: Sangat disarankan memakai gambar PNG Transparan agar tampilan slider maksimal dan menyatu dengan background!");
    }

    setUploadingField(`slide-${index}`);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Gagal mengunggah gambar ke server");
      
      const data = await res.json();
      handleSlideChange(index, 'image', data.url);
      alert("Gambar slide berhasil diunggah!");
    } catch (error) {
      console.error("Error Upload:", error);
      alert("Terjadi kesalahan saat mengunggah gambar.");
    } finally {
      setUploadingField(null);
      e.target.value = null; 
    }
  };

  // ================= FUNGSI UPLOAD GAMBAR (UMUM/SEJARAH) =================
  const handleImageUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Harap pilih file berupa gambar!");
      return;
    }

    setUploadingField(fieldName);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Gagal mengunggah gambar ke server");

      const data = await res.json();
      setBerandaConfig(prev => ({ ...prev, [fieldName]: data.url }));
      alert("Gambar berhasil diunggah!");
    } catch (error) {
      console.error("Error Upload:", error);
      alert("Terjadi kesalahan saat mengunggah gambar.");
    } finally {
      setUploadingField(null);
      e.target.value = null; 
    }
  };

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
        
        {/* ================= SEKSI 1: PENGATURAN SLIDER HERO ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between font-bold text-slate-800">
             <div className="flex items-center gap-2">
               <ImageIcon size={18} className="text-blue-600" /> 1. Area Slider Utama (Hero)
             </div>
             <button type="button" onClick={handleAddSlide} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
               <Plus size={14} /> Tambah Slide
             </button>
          </div>
          
          <div className="p-4 space-y-6 bg-slate-50/50">
            {berandaConfig.heroSlides.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-4">Belum ada slide. Klik "Tambah Slide" untuk memulai.</p>
            )}

            {berandaConfig.heroSlides.map((slide, index) => (
              <div key={slide.id || index} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative">
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">SLIDE {index + 1}</span>
                  <button type="button" onClick={() => handleRemoveSlide(index)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors" title="Hapus Slide">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-2">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Pilih Warna Background Slider</label>
                    <select value={slide.bgColor} onChange={(e) => handleSlideChange(index, 'bgColor', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-semibold bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="from-[#0f172a] to-[#1e293b]">Biru Gelap Default</option>
                      <option value="from-blue-900 to-indigo-900">Biru Terang Elegan</option>
                      <option value="from-slate-900 to-emerald-900">Hijau Gelap Pergerakan</option>
                      <option value="from-amber-700 to-orange-900">Jingga Hangat</option>
                      <option value="from-slate-800 to-gray-900">Hitam Minimalis</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Badge Teks Kecil (Atas)</label>
                    <input type="text" required value={slide.badge} onChange={(e) => handleSlideChange(index, 'badge', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" placeholder="Contoh: Info Terkini" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Judul Utama (Gunakan \n untuk baris baru)</label>
                    <input type="text" required value={slide.title} onChange={(e) => handleSlideChange(index, 'title', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-bold" placeholder="Judul Slide" />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Sub-Judul Deskripsi</label>
                    <textarea rows="2" required value={slide.subtitle} onChange={(e) => handleSlideChange(index, 'subtitle', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm leading-relaxed" />
                  </div>

                  {/* Pengaturan Tombol 1 */}
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                    <label className="text-[10px] font-bold text-yellow-700 block mb-2 uppercase">Tombol 1 (Kuning)</label>
                    <div className="space-y-2">
                      <input type="text" required value={slide.button1Text} onChange={(e) => handleSlideChange(index, 'button1Text', e.target.value)} className="w-full p-2 border border-yellow-200 rounded text-xs" placeholder="Teks Tombol 1" />
                      <input type="text" required value={slide.button1Link} onChange={(e) => handleSlideChange(index, 'button1Link', e.target.value)} className="w-full p-2 border border-yellow-200 rounded text-xs" placeholder="Link Tujuan (Contoh: /pendaftaran)" />
                    </div>
                  </div>

                  {/* Pengaturan Tombol 2 */}
                  <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-600 block mb-2 uppercase">Tombol 2 (Transparan)</label>
                    <div className="space-y-2">
                      <input type="text" required value={slide.button2Text} onChange={(e) => handleSlideChange(index, 'button2Text', e.target.value)} className="w-full p-2 border border-slate-300 rounded text-xs" placeholder="Teks Tombol 2" />
                      <input type="text" required value={slide.button2Link} onChange={(e) => handleSlideChange(index, 'button2Link', e.target.value)} className="w-full p-2 border border-slate-300 rounded text-xs" placeholder="Link Tujuan (Contoh: /struktur)" />
                    </div>
                  </div>

                  {/* Upload Foto Slide */}
                  <div className="sm:col-span-2 pt-3 border-t border-slate-100 mt-2">
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <label className={`w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all border shrink-0 ${uploadingField === `slide-${index}` ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 shadow-sm'}`}>
                        {uploadingField === `slide-${index}` ? <><Loader2 size={14} className="animate-spin" /> Mengunggah...</> : <><UploadCloud size={14} /> Upload Foto Slide (PNG)</>}
                        <input 
                          type="file" accept="image/png" className="hidden" 
                          onChange={(e) => handleSlideImageUpload(e, index)} 
                          disabled={uploadingField === `slide-${index}`} 
                        />
                      </label>
                      <input 
                        type="text" value={slide.image || ""} 
                        onChange={(e) => handleSlideChange(index, 'image', e.target.value)} 
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono bg-slate-50 text-slate-600" 
                        placeholder="URL foto otomatis terisi..." 
                        readOnly={uploadingField === `slide-${index}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
            
            <div className="pt-4 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2"><ImageIcon size={14} className="text-blue-500"/> Foto Dokumentasi Sejarah</label>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <label className={`w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all border shrink-0 ${uploadingField === 'sejarahImage' ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 shadow-sm'}`}>
                  {uploadingField === 'sejarahImage' ? <><Loader2 size={14} className="animate-spin" /> Mengunggah...</> : <><UploadCloud size={14} /> Pilih Foto Sejarah</>}
                  <input 
                    type="file" accept="image/*" className="hidden" 
                    onChange={(e) => handleImageUpload(e, 'sejarahImage')} 
                    disabled={uploadingField === 'sejarahImage'} 
                  />
                </label>
                <input 
                  type="text" value={berandaConfig.sejarahImage || ""} 
                  onChange={(e) => setBerandaConfig({...berandaConfig, sejarahImage: e.target.value})} 
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono bg-slate-50 text-slate-600" 
                  placeholder="URL otomatis terisi setelah upload. Kosongkan untuk pakai abu-abu bawaan." 
                  readOnly={uploadingField === 'sejarahImage'}
                />
              </div>
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
          <button disabled={uploadingField !== null} type="submit" className="bg-blue-600 disabled:bg-blue-400 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition flex items-center justify-center gap-2 shadow-md">
            Perbarui Teks & Gambar Beranda <Save size={18} />
          </button>
        </div>

      </form>
    </div>
  );
}