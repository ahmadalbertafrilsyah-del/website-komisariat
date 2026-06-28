"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, FileText, History, MessageSquare, Image as ImageIcon, Target, UploadCloud, Loader2, Plus, Trash2, Info } from "lucide-react";

export default function AdminBerandaEditor() {
  const [loading, setLoading] = useState(true);
  const [uploadingField, setUploadingField] = useState(null);
  
  const [berandaConfig, setBerandaConfig] = useState({
    heroSlides: [],
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
    setBerandaConfig(prev => ({ ...prev, heroSlides: [...prev.heroSlides, newSlide] }));
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
    } catch (error) {
      console.error("Error Upload:", error);
      alert("Terjadi kesalahan saat mengunggah gambar.");
    } finally {
      setUploadingField(null);
      e.target.value = null; 
    }
  };

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
    } catch (error) {
      console.error("Error Upload:", error);
      alert("Terjadi kesalahan saat mengunggah gambar.");
    } finally {
      setUploadingField(null);
      e.target.value = null; 
    }
  };

  const handleSaveBeranda = async (e) => {
    if(e) e.preventDefault();
    try {
      const docRef = doc(db, "website_config", "settings");
      await setDoc(docRef, berandaConfig);
      alert("Seluruh Konten Halaman Beranda Berhasil Diperbarui!");
    } catch (error) {
      alert("Gagal menyimpan perubahan: " + error.message);
    }
  };

  if (loading) return <p className="text-slate-500 text-sm font-medium">Memuat panel kontrol beranda...</p>;

  // STYLING ENTERPRISE FORMAL
  const inputStyle = "w-full px-3 py-2 border border-slate-300 rounded-md text-[13px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white";
  const labelStyle = "text-[13px] font-semibold text-slate-700 block mb-1.5";

  return (
    <div className="space-y-6 pb-12 w-full">
      
      {/* HEADER PANEL */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manajemen Beranda</h1>
          <p className="text-[13px] text-slate-500 mt-1">Kelola banner utama, sejarah, nilai dasar, dan ajakan (CTA).</p>
        </div>
        <button onClick={handleSaveBeranda} disabled={uploadingField !== null} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-md transition-colors flex items-center justify-center gap-2 text-[13px] shadow-sm shrink-0 disabled:opacity-50">
          <Save size={16} /> Simpan Pembaruan
        </button>
      </div>

      <form onSubmit={handleSaveBeranda} className="space-y-6 max-w-5xl">
        
        {/* ================= SEKSI 1: PENGATURAN SLIDER HERO ================= */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
             <div className="flex items-center gap-2">
               <ImageIcon size={16} className="text-slate-600" /> 
               <h2 className="text-sm font-bold text-slate-800">1. Area Slider Utama (Hero)</h2>
             </div>
             <button type="button" onClick={handleAddSlide} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-[12px] px-3 py-1.5 rounded flex items-center gap-1.5 font-bold transition-colors shadow-sm">
               <Plus size={14} /> Tambah Slide
             </button>
          </div>
          
          <div className="p-5 space-y-5 bg-slate-50/30">
            {berandaConfig.heroSlides.length === 0 && (
              <p className="text-center text-[13px] text-slate-400 py-4">Belum ada slide. Klik "Tambah Slide" untuk memulai.</p>
            )}

            {berandaConfig.heroSlides.map((slide, index) => (
              <div key={slide.id || index} className="bg-white border border-slate-200 rounded-md p-4 shadow-sm relative group">
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider">SLIDE {index + 1}</span>
                  <button type="button" onClick={() => handleRemoveSlide(index)} className="text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 p-1.5 rounded transition-colors border border-slate-100 hover:border-red-200" title="Hapus Slide">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-2">
                  <div className="md:col-span-2">
                    <label className={labelStyle}>Pilih Warna Background Slider</label>
                    <select value={slide.bgColor} onChange={(e) => handleSlideChange(index, 'bgColor', e.target.value)} className={inputStyle}>
                      <option value="from-[#0f172a] to-[#1e293b]">Biru Gelap Default</option>
                      <option value="from-blue-900 to-indigo-900">Biru Terang Elegan</option>
                      <option value="from-slate-900 to-emerald-900">Hijau Gelap Pergerakan</option>
                      <option value="from-amber-700 to-orange-900">Jingga Hangat</option>
                      <option value="from-slate-800 to-gray-900">Hitam Minimalis</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={labelStyle}>Badge Teks Kecil (Atas)</label>
                    <input type="text" required value={slide.badge} onChange={(e) => handleSlideChange(index, 'badge', e.target.value)} className={inputStyle} placeholder="Contoh: Info Terkini" />
                  </div>
                  <div>
                    <label className={labelStyle}>Judul Utama (Gunakan \n untuk baris baru)</label>
                    <input type="text" required value={slide.title} onChange={(e) => handleSlideChange(index, 'title', e.target.value)} className={inputStyle} placeholder="Judul Slide" />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className={labelStyle}>Sub-Judul Deskripsi</label>
                    <textarea rows="2" required value={slide.subtitle} onChange={(e) => handleSlideChange(index, 'subtitle', e.target.value)} className={`${inputStyle} resize-none`} />
                  </div>

                  {/* Pengaturan Tombol */}
                  <div className="grid md:grid-cols-2 gap-4 md:col-span-2 pt-2 border-t border-slate-100">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-2 uppercase tracking-wider">Tombol 1 (Aksi Utama)</label>
                      <div className="flex gap-2">
                         <input type="text" required value={slide.button1Text} onChange={(e) => handleSlideChange(index, 'button1Text', e.target.value)} className={`${inputStyle} w-1/3`} placeholder="Teks" />
                         <input type="text" required value={slide.button1Link} onChange={(e) => handleSlideChange(index, 'button1Link', e.target.value)} className={`${inputStyle} w-2/3 font-mono text-[12px]`} placeholder="URL (/link)" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-2 uppercase tracking-wider">Tombol 2 (Sekunder)</label>
                      <div className="flex gap-2">
                         <input type="text" required value={slide.button2Text} onChange={(e) => handleSlideChange(index, 'button2Text', e.target.value)} className={`${inputStyle} w-1/3`} placeholder="Teks" />
                         <input type="text" required value={slide.button2Link} onChange={(e) => handleSlideChange(index, 'button2Link', e.target.value)} className={`${inputStyle} w-2/3 font-mono text-[12px]`} placeholder="URL (/link)" />
                      </div>
                    </div>
                  </div>

                  {/* Upload Foto Slide */}
                  <div className="md:col-span-2 pt-4 border-t border-slate-100">
                    <label className={labelStyle}>Gambar Maskot Slide (PNG Transparan)</label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <label className={`w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-md text-[12px] font-bold transition-colors border shrink-0 ${uploadingField === `slide-${index}` ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm'}`}>
                        {uploadingField === `slide-${index}` ? <><Loader2 size={14} className="animate-spin" /> Mengunggah...</> : <><UploadCloud size={14} /> Pilih Gambar</>}
                        <input type="file" accept="image/png" className="hidden" onChange={(e) => handleSlideImageUpload(e, index)} disabled={uploadingField === `slide-${index}`} />
                      </label>
                      <input type="text" value={slide.image || ""} onChange={(e) => handleSlideChange(index, 'image', e.target.value)} className={`${inputStyle} bg-slate-50 text-slate-500 font-mono text-[11px]`} placeholder="URL gambar otomatis terisi..." readOnly={uploadingField === `slide-${index}`} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= SEKSI 2: SEJARAH ================= */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center gap-2">
             <History size={16} className="text-slate-600" />
             <h2 className="text-sm font-bold text-slate-800">2. Profil Narasi Sejarah</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2"><label className={labelStyle}>Judul Slogan Sejarah</label><input type="text" required value={berandaConfig.sejarahTitle} onChange={(e) => setBerandaConfig({...berandaConfig, sejarahTitle: e.target.value})} className={inputStyle} /></div>
              <div><label className={labelStyle}>Tahun Berdiri</label><input type="text" required value={berandaConfig.sejarahTahun} onChange={(e) => setBerandaConfig({...berandaConfig, sejarahTahun: e.target.value})} className={inputStyle} /></div>
            </div>
            <div><label className={labelStyle}>Isi Paragraf Penjelasan</label><textarea required rows="3" value={berandaConfig.sejarahDesc} onChange={(e) => setBerandaConfig({...berandaConfig, sejarahDesc: e.target.value})} className={`${inputStyle} resize-none`} /></div>
            <div><label className={labelStyle}>Kutipan / Quote Tri Motto</label><textarea required rows="2" value={berandaConfig.sejarahQuote} onChange={(e) => setBerandaConfig({...berandaConfig, sejarahQuote: e.target.value})} className={`${inputStyle} resize-none`} /></div>
            
            <div className="pt-2 border-t border-slate-100">
              <label className={labelStyle}>Foto Dokumentasi Sejarah</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className={`w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-md text-[12px] font-bold transition-colors border shrink-0 ${uploadingField === 'sejarahImage' ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm'}`}>
                  {uploadingField === 'sejarahImage' ? <><Loader2 size={14} className="animate-spin" /> Mengunggah...</> : <><UploadCloud size={14} /> Pilih Foto Baru</>}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'sejarahImage')} disabled={uploadingField === 'sejarahImage'} />
                </label>
                <input type="text" value={berandaConfig.sejarahImage || ""} onChange={(e) => setBerandaConfig({...berandaConfig, sejarahImage: e.target.value})} className={`${inputStyle} bg-slate-50 text-slate-500 font-mono text-[11px]`} placeholder="URL otomatis terisi..." readOnly={uploadingField === 'sejarahImage'} />
              </div>
            </div>
          </div>
        </div>

        {/* ================= SEKSI 3: NILAI DASAR ================= */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center gap-2">
             <Target size={16} className="text-slate-600" />
             <h2 className="text-sm font-bold text-slate-800">3. Nilai Dasar Pergerakan</h2>
          </div>
          <div className="p-5 space-y-4">
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className={labelStyle}>Teks Putih (Kiri)</label><input type="text" required value={berandaConfig.nilaiTitle} onChange={(e) => setBerandaConfig({...berandaConfig, nilaiTitle: e.target.value})} className={inputStyle} placeholder="Nilai Dasar" /></div>
              <div><label className={labelStyle}>Teks Kuning (Kanan)</label><input type="text" required value={berandaConfig.nilaiHighlight} onChange={(e) => setBerandaConfig({...berandaConfig, nilaiHighlight: e.target.value})} className={inputStyle} placeholder="Pergerakan" /></div>
              <div className="sm:col-span-2"><label className={labelStyle}>Sub-Judul Keterangan</label><input type="text" required value={berandaConfig.nilaiSubtitle} onChange={(e) => setBerandaConfig({...berandaConfig, nilaiSubtitle: e.target.value})} className={inputStyle} /></div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-md space-y-2">
                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>Kotak 1</div>
                 <input type="text" required value={berandaConfig.nilai1Title} onChange={(e) => setBerandaConfig({...berandaConfig, nilai1Title: e.target.value})} className={inputStyle} />
                 <textarea rows="2" required value={berandaConfig.nilai1Desc} onChange={(e) => setBerandaConfig({...berandaConfig, nilai1Desc: e.target.value})} className={`${inputStyle} resize-none`} />
              </div>
              <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-md space-y-2">
                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>Kotak 2</div>
                 <input type="text" required value={berandaConfig.nilai2Title} onChange={(e) => setBerandaConfig({...berandaConfig, nilai2Title: e.target.value})} className={inputStyle} />
                 <textarea rows="2" required value={berandaConfig.nilai2Desc} onChange={(e) => setBerandaConfig({...berandaConfig, nilai2Desc: e.target.value})} className={`${inputStyle} resize-none`} />
              </div>
              <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-md space-y-2">
                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>Kotak 3</div>
                 <input type="text" required value={berandaConfig.nilai3Title} onChange={(e) => setBerandaConfig({...berandaConfig, nilai3Title: e.target.value})} className={inputStyle} />
                 <textarea rows="2" required value={berandaConfig.nilai3Desc} onChange={(e) => setBerandaConfig({...berandaConfig, nilai3Desc: e.target.value})} className={`${inputStyle} resize-none`} />
              </div>
              <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-md space-y-2">
                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>Kotak 4</div>
                 <input type="text" required value={berandaConfig.nilai4Title} onChange={(e) => setBerandaConfig({...berandaConfig, nilai4Title: e.target.value})} className={inputStyle} />
                 <textarea rows="2" required value={berandaConfig.nilai4Desc} onChange={(e) => setBerandaConfig({...berandaConfig, nilai4Desc: e.target.value})} className={`${inputStyle} resize-none`} />
              </div>
            </div>

          </div>
        </div>

        {/* ================= SEKSI 4: CALL TO ACTION (CTA) ================= */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center gap-2">
             <MessageSquare size={16} className="text-slate-600" />
             <h2 className="text-sm font-bold text-slate-800">4. Banner Ajakan Gabung (CTA)</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className={labelStyle}>Judul Ajakan CTA</label>
              <input type="text" required value={berandaConfig.ctaTitle} onChange={(e) => setBerandaConfig({...berandaConfig, ctaTitle: e.target.value})} className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}>Sub-Judul Narasi Ajakan</label>
              <input type="text" required value={berandaConfig.ctaSubtitle} onChange={(e) => setBerandaConfig({...berandaConfig, ctaSubtitle: e.target.value})} className={inputStyle} />
            </div>
          </div>
        </div>

        {/* Info Tambahan */}
        <div className="flex items-center gap-2.5 text-[12px] text-slate-500 bg-slate-50 p-3 rounded-md border border-slate-200">
          <Info size={16} className="shrink-0 text-blue-500" />
          <p>Pastikan Anda telah memeriksa kembali seluruh teks dan tautan. Perubahan ini akan langsung diperbarui ke antarmuka utama.</p>
        </div>

      </form>
    </div>
  );
}