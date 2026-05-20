"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as XLSX from "xlsx"; 
import { Save, Users, Plus, Trash2, Briefcase, Image as ImageIcon, FileSpreadsheet, UploadCloud, Info, Loader2 } from "lucide-react";

export default function AdminStrukturEditor() {
  const [loading, setLoading] = useState(true);
  const [strukturData, setStrukturData] = useState([]);
  const [newKategori, setNewKategori] = useState("");
  
  // State untuk melacak ID (Index Divisi & Index Anggota) yang sedang proses upload
  const [uploadingId, setUploadingId] = useState(null); 
  
  const fileInputRef = useRef(null);

  // Load data dari Firebase
  useEffect(() => {
    async function loadStruktur() {
      try {
        const docRef = doc(db, "website_config", "struktur_organisasi");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listKategori) {
          setStrukturData(docSnap.data().listKategori);
        } else {
          setStrukturData([{ kategori: "Badan Pengurus Harian (BPH)", anggota: [] }]);
        }
      } catch (error) {
        console.error("Gagal mengambil data struktur:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStruktur();
  }, []);

  const saveAllToFirebase = async (currentData) => {
    try {
      const docRef = doc(db, "website_config", "struktur_organisasi");
      await setDoc(docRef, { listKategori: currentData });
    } catch (error) {
      alert("Gagal sinkronisasi ke server: " + error.message);
    }
  };

  const handleAddKategori = (e) => {
    e.preventDefault();
    if (!newKategori.trim()) return;
    const updated = [...strukturData, { kategori: newKategori.trim(), anggota: [] }];
    setStrukturData(updated);
    setNewKategori("");
  };

  const handleDelKategori = (indexKategori) => {
    if (!confirm("Yakin ingin menghapus seluruh biro ini beserta semua anggotanya?")) return;
    const updated = strukturData.filter((_, idx) => idx !== indexKategori);
    setStrukturData(updated);
  };

  const handleAddAnggota = (indexKategori) => {
    const updated = [...strukturData];
    updated[indexKategori].anggota.push({
      nama: "", jabatan: "", nim: "", nia: "", rayon: "", angkatan: "", whatsapp: "", foto: ""
    });
    setStrukturData(updated);
  };

  const handleDelAnggota = (indexKategori, indexAnggota) => {
    const updated = [...strukturData];
    updated[indexKategori].anggota = updated[indexKategori].anggota.filter((_, idx) => idx !== indexAnggota);
    setStrukturData(updated);
  };

  const handleInputChange = (indexKategori, indexAnggota, field, value) => {
    const updated = [...strukturData];
    updated[indexKategori].anggota[indexAnggota][field] = value;
    setStrukturData(updated);
  };

  // ================= FUNGSI UPLOAD GAMBAR KE CLOUDINARY =================
  const handleImageUpload = async (e, indexKategori, indexAnggota) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Harap pilih file berupa gambar (JPG/PNG)!");
      e.target.value = null;
      return;
    }

    // Set status uploading spesifik untuk pengurus ini
    setUploadingId(`${indexKategori}-${indexAnggota}`);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Gagal upload");
      
      const data = await res.json();
      // Langsung masukkan URL yang didapat ke dalam input foto pengurus tersebut
      handleInputChange(indexKategori, indexAnggota, "foto", data.url);
      
    } catch (error) {
      console.error(error);
      alert("Gagal mengunggah foto. Pastikan API & Kredensial Cloudinary sudah benar.");
    } finally {
      setUploadingId(null);
      e.target.value = null;
    }
  };

  // ================= FUNGSI IMPORT EXCEL OTOMATIS =================
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

        let currentStruktur = [...strukturData];

        data.forEach((row) => {
          const biroName = row["Biro"] || row["Kategori"] || row["Biro/LSO"] || "Tanpa Kategori";
          const nama = row["Nama Lengkap"] || row["Nama"] || "-";
          const jabatan = row["Jabatan"] || "Anggota";
          const nim = row["NIM"] || "-";
          const nia = row["NIA"] || "-";
          const rayon = row["Rayon"] || "-";
          const angkatan = row["Angkatan"] || "-";
          const whatsapp = row["WhatsApp"] || row["WA"] || "";
          const foto = row["URL Foto"] || row["Foto"] || "";

          let biroIndex = currentStruktur.findIndex(
            (b) => b.kategori.toLowerCase().trim() === biroName.toLowerCase().trim()
          );
          
          if (biroIndex === -1) {
            currentStruktur.push({ kategori: biroName, anggota: [] });
            biroIndex = currentStruktur.length - 1;
          }

          currentStruktur[biroIndex].anggota.push({
            nama: String(nama),
            jabatan: String(jabatan),
            nim: String(nim),
            nia: String(nia),
            rayon: String(rayon),
            angkatan: String(angkatan),
            whatsapp: String(whatsapp),
            foto: String(foto)
          });
        });

        setStrukturData(currentStruktur);
        alert(`Berhasil mengimpor ${data.length} data pengurus! Silakan cek ke bawah, lalu tekan tombol "Simpan Seluruh Struktur" untuk mematenkan data.`);
      } catch (error) {
        alert("Gagal memproses file Excel. Pastikan formatnya benar.");
        console.error(error);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await saveAllToFirebase(strukturData);
      alert("Seluruh susunan data struktur kepengurusan berhasil disimpan ke Database!");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (loading) return <p className="text-slate-500 animate-pulse font-medium">Memuat database struktur...</p>;

  return (
    <div className="space-y-6 pb-12 w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users size={24} className="text-blue-600" /> Manajemen Struktur Organisasi
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">Kelola pembagian biro, divisi, lembaga, serta data pengurus komisariat.</p>
        </div>
      </div>

      {/* Grid: Form Tambah Biro Manual & Form Import Excel */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Form 1: Tambah Biro Manual */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm h-full flex flex-col">
          <div className="flex items-center gap-2 mb-3">
             <Briefcase size={18} className="text-blue-600"/>
             <h2 className="font-bold text-slate-800 text-sm">Input Biro Manual</h2>
          </div>
          <form onSubmit={handleAddKategori} className="flex flex-col sm:flex-row items-end gap-3 mt-auto">
            <div className="flex-grow w-full space-y-1">
              <input 
                type="text" required
                value={newKategori}
                onChange={(e) => setNewKategori(e.target.value)}
                placeholder="Misal: Biro Keagamaan"
                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button type="submit" className="w-full sm:w-auto bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-3 px-5 rounded-xl text-sm flex items-center justify-center gap-1.5 transition whitespace-nowrap">
              <Plus size={16}/> Buat Biro
            </button>
          </form>
        </div>

        {/* Form 2: IMPORT EXCEL */}
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm h-full flex flex-col">
          <div className="flex items-center gap-2 mb-2">
             <FileSpreadsheet size={18} className="text-emerald-600"/>
             <h2 className="font-bold text-emerald-800 text-sm">Otomatis (Import Excel)</h2>
          </div>
          <p className="text-xs text-emerald-600 mb-4 leading-relaxed">
            Format Kolom Excel Wajib (Baris Pertama): <br/>
            <span className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded font-bold">Biro</span> | 
            <span className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded font-bold ml-1">Nama Lengkap</span> | 
            <span className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded font-bold ml-1">Jabatan</span> | 
            <span className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded ml-1">NIM</span> | 
            <span className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded ml-1">NIA</span> | 
            <span className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded ml-1">Rayon</span> | 
            <span className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded ml-1">Angkatan</span>
          </p>
          <div className="mt-auto relative w-full overflow-hidden inline-block">
             <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-5 rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-md shadow-emerald-500/20">
               <UploadCloud size={18}/> Unggah File Excel (.xlsx / .xls)
             </button>
             <input 
               type="file" 
               accept=".xlsx, .xls"
               ref={fileInputRef}
               onChange={handleFileUpload}
               className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
             />
          </div>
        </div>

      </div>

      {/* Utama List Biro & Anggota */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mt-4">
           <h3 className="font-bold text-slate-800">Preview Data Tersimpan</h3>
           {strukturData.length > 0 && (
              <button type="button" onClick={() => setStrukturData([])} className="text-xs text-red-500 hover:underline">Kosongkan Semua Data</button>
           )}
        </div>

        {strukturData.map((divisi, divIdx) => (
          <div key={divIdx} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            
            {/* Header Biro */}
            <div className="bg-slate-100/50 px-4 py-3 md:px-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-slate-600" />
                <input 
                  type="text" 
                  value={divisi.kategori}
                  onChange={(e) => {
                     const updated = [...strukturData];
                     updated[divIdx].kategori = e.target.value;
                     setStrukturData(updated);
                  }}
                  className="font-bold text-slate-800 text-sm md:text-base bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition w-full sm:w-64"
                />
                <span className="bg-white border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-sm whitespace-nowrap">
                  {divisi.anggota.length} Orang
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => handleAddAnggota(divIdx)} className="bg-white hover:bg-slate-50 border border-slate-200 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm">
                  <Plus size={14}/> Personil Manual
                </button>
                <button type="button" onClick={() => handleDelKategori(divIdx)} className="text-red-500 bg-white hover:bg-red-50 border border-slate-200 p-1.5 rounded-lg transition shadow-sm" title="Hapus Biro Ini">
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>

            {/* Grid Anggota di dalam Biro */}
            <div className="p-4 md:p-6 overflow-x-auto">
              {divisi.anggota.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4 italic">Biro ini belum memiliki personil.</p>
              ) : (
                <div className="space-y-4 divide-y divide-slate-100 min-w-[700px]">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 pr-8">
                     <div className="col-span-3">Nama Lengkap</div>
                     <div className="col-span-2">Jabatan</div>
                     <div className="col-span-2">NIM & NIA</div>
                     <div className="col-span-2">Rayon & Angkatan</div>
                     <div className="col-span-3">WA & Foto</div>
                  </div>

                  {divisi.anggota.map((member, memIdx) => (
                    <div key={memIdx} className="grid grid-cols-12 gap-3 pt-4 relative group">
                      
                      <div className="col-span-3">
                        <input type="text" placeholder="Nama..." required value={member.nama} onChange={(e) => handleInputChange(divIdx, memIdx, "nama", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-blue-500 outline-none" />
                      </div>
                      
                      <div className="col-span-2">
                        <input type="text" placeholder="Jabatan..." required value={member.jabatan} onChange={(e) => handleInputChange(divIdx, memIdx, "jabatan", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none" />
                      </div>

                      <div className="col-span-2 space-y-1.5">
                        <input type="text" placeholder="NIM..." value={member.nim} onChange={(e) => handleInputChange(divIdx, memIdx, "nim", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-blue-500 outline-none font-mono" />
                        <input type="text" placeholder="NIA..." value={member.nia} onChange={(e) => handleInputChange(divIdx, memIdx, "nia", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-blue-500 outline-none font-mono" />
                      </div>

                      <div className="col-span-2 space-y-1.5">
                        <input type="text" placeholder="Rayon..." value={member.rayon} onChange={(e) => handleInputChange(divIdx, memIdx, "rayon", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-blue-500 outline-none" />
                        <input type="text" placeholder="Angkatan..." value={member.angkatan} onChange={(e) => handleInputChange(divIdx, memIdx, "angkatan", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-blue-500 outline-none" />
                      </div>

                      {/* FITUR BARU: Tombol Upload Foto Berjejer dengan Input */}
                      <div className="col-span-3 space-y-1.5">
                        <input type="text" placeholder="No WhatsApp (628...)" value={member.whatsapp} onChange={(e) => handleInputChange(divIdx, memIdx, "whatsapp", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-blue-500 outline-none font-mono" />
                        
                        <div className="flex items-center gap-1.5">
                           <label 
                             className={`cursor-pointer flex items-center justify-center p-1.5 rounded-md border transition-colors shrink-0 ${uploadingId === `${divIdx}-${memIdx}` ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200'}`} 
                             title="Upload Foto Pengurus ke Cloudinary"
                           >
                              {uploadingId === `${divIdx}-${memIdx}` ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, divIdx, memIdx)} disabled={uploadingId !== null} />
                           </label>
                           <input type="text" placeholder="URL Foto akan terisi otomatis..." value={member.foto} onChange={(e) => handleInputChange(divIdx, memIdx, "foto", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-blue-500 outline-none" />
                        </div>
                      </div>
                      
                      <button type="button" onClick={() => handleDelAnggota(divIdx, memIdx)} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 p-2 rounded transition md:opacity-0 group-hover:opacity-100 bg-white" title="Hapus Personil">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ))}

        {/* Floating/Bottom Action Bar */}
        {strukturData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-blue-50 p-4 rounded-xl border border-blue-200 sticky bottom-4 z-40 shadow-lg shadow-blue-500/10">
             <div className="flex items-start gap-2 text-xs text-blue-800">
               <Info size={16} className="shrink-0 mt-0.5 text-blue-600" />
               <p>Klik tombol awan (<UploadCloud size={12} className="inline"/>) di kolom foto untuk mengunggah gambar otomatis. Tekan <strong>Simpan Seluruh Struktur</strong> agar data tayang ke publik.</p>
             </div>
             <button type="submit" disabled={uploadingId !== null} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-8 rounded-xl transition flex items-center justify-center gap-2 shadow-md text-sm whitespace-nowrap shrink-0">
                <Save size={18} /> Simpan Seluruh Struktur
              </button>
          </div>
        )}
      </form>
    </div>
  );
}