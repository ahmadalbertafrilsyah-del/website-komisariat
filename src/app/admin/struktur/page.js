"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as XLSX from "xlsx"; 
import { Save, Users, Plus, Trash2, Briefcase, FileSpreadsheet, UploadCloud, Info, Loader2 } from "lucide-react";

export default function AdminStrukturEditor() {
  const [loading, setLoading] = useState(true);
  const [strukturData, setStrukturData] = useState([]);
  const [newKategori, setNewKategori] = useState("");
  
  const [uploadingId, setUploadingId] = useState(null); 
  const fileInputRef = useRef(null);

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

  const handleImageUpload = async (e, indexKategori, indexAnggota) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Harap pilih file berupa gambar (JPG/PNG)!");
      e.target.value = null;
      return;
    }

    setUploadingId(`${indexKategori}-${indexAnggota}`);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Gagal upload");
      
      const data = await res.json();
      handleInputChange(indexKategori, indexAnggota, "foto", data.url);
      
    } catch (error) {
      console.error(error);
      alert("Gagal mengunggah foto. Pastikan API & Kredensial Cloudinary sudah benar.");
    } finally {
      setUploadingId(null);
      e.target.value = null;
    }
  };

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

  // STYLE STANDAR ENTERPRISE
  const inputStyle = "w-full px-3 py-2 border border-slate-300 rounded-md text-[13px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white placeholder:text-slate-400";
  const labelStyle = "text-[13px] font-semibold text-slate-700 block mb-1.5";

  if (loading) return <p className="text-slate-500 text-sm font-medium">Memuat database struktur...</p>;

  return (
    <div className="space-y-6 pb-12 w-full">
      
      {/* HEADER PANEL */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manajemen Struktur Kepengurusan</h1>
          <p className="text-[13px] text-slate-500 mt-1">Kelola pembagian biro, divisi, lembaga, serta penempatan personil komisariat.</p>
        </div>
        {strukturData.length > 0 && (
          <button type="button" onClick={() => { if(confirm("Yakin ingin menghapus seluruh data struktur yang ada?")) setStrukturData([]) }} className="bg-white hover:bg-red-50 text-red-600 border border-red-200 font-medium py-2 px-4 rounded-md transition-colors text-[13px] shadow-sm shrink-0">
            Kosongkan Data
          </button>
        )}
      </div>

      {/* GRID: TAMBAH BIRO & IMPORT EXCEL */}
      <div className="grid md:grid-cols-2 gap-5 mb-6">
        
        {/* Form 1: Tambah Biro Manual */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center gap-2">
             <Briefcase size={16} className="text-slate-600"/>
             <h2 className="text-sm font-bold text-slate-800">Tambah Biro / Divisi Baru</h2>
          </div>
          <div className="p-5 flex flex-col flex-1">
            <form onSubmit={handleAddKategori} className="flex flex-col sm:flex-row items-end gap-3 mt-auto">
              <div className="flex-grow w-full">
                <label className={labelStyle}>Nama Biro / Divisi</label>
                <input type="text" required value={newKategori} onChange={(e) => setNewKategori(e.target.value)} placeholder="Misal: Biro Keagamaan" className={inputStyle} />
              </div>
              <button type="submit" className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 px-5 rounded-md text-[13px] flex items-center justify-center gap-2 transition shadow-sm shrink-0">
                <Plus size={16}/> Buat Biro
              </button>
            </form>
          </div>
        </div>

        {/* Form 2: IMPORT EXCEL */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center gap-2">
             <FileSpreadsheet size={16} className="text-emerald-600"/>
             <h2 className="text-sm font-bold text-slate-800">Impor Data Masal (Excel)</h2>
          </div>
          <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
            <p className="text-[12px] text-slate-500 leading-relaxed">
              Format Header Kolom Wajib:<br/>
              <span className="font-mono bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] mr-1">Biro</span> | 
              <span className="font-mono bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] mx-1">Nama Lengkap</span> | 
              <span className="font-mono bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] mx-1">Jabatan</span> | 
              <span className="font-mono bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] ml-1">NIM</span>
              <span className="font-mono bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] ml-1">NIA</span>
              <span className="font-mono bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] ml-1">Rayon</span>
              <span className="font-mono bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] ml-1">Angkatan</span>
              <span className="font-mono bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] ml-1">WhatsApp</span>
            </p>
            <div className="relative w-full overflow-hidden inline-block">
               <button className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-medium py-2 px-4 rounded-md text-[13px] flex items-center justify-center gap-2 transition">
                 <UploadCloud size={16}/> Unggah File (.xlsx / .xls)
               </button>
               <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
          </div>
        </div>

      </div>

      {/* ================= AREA DATA STRUKTUR ================= */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {strukturData.map((divisi, divIdx) => (
          <div key={divIdx} className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden mb-6">
            
            {/* Header Biro */}
            <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-grow">
                <Briefcase size={16} className="text-slate-400 shrink-0" />
                <input 
                  type="text" value={divisi.kategori}
                  onChange={(e) => {
                     const updated = [...strukturData];
                     updated[divIdx].kategori = e.target.value;
                     setStrukturData(updated);
                  }}
                  className="font-bold text-slate-800 text-[14px] bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition w-full sm:max-w-md py-1"
                />
                <span className="bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded text-[11px] font-bold shadow-sm whitespace-nowrap shrink-0">
                  {divisi.anggota.length} Personil
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => handleAddAnggota(divIdx)} className="bg-white hover:bg-blue-50 border border-slate-200 text-blue-600 text-[12px] font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition shadow-sm">
                  <Plus size={14}/> Tambah Personil
                </button>
                <button type="button" onClick={() => handleDelKategori(divIdx)} className="bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 p-1.5 rounded transition shadow-sm" title="Hapus Biro Ini">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>

            {/* Grid Tabel Anggota */}
            <div className="p-0 overflow-x-auto">
              {divisi.anggota.length === 0 ? (
                <p className="text-center text-[13px] text-slate-400 py-8 bg-white">Biro ini belum memiliki personil yang ditugaskan.</p>
              ) : (
                <div className="min-w-[900px] w-full">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-3 px-5 py-2.5 bg-slate-50/40 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                     <div className="col-span-3">Nama Lengkap</div>
                     <div className="col-span-2">Jabatan</div>
                     <div className="col-span-2">NIM & NIA</div>
                     <div className="col-span-2">Rayon & Angkatan</div>
                     <div className="col-span-3">WA & Tautan Foto</div>
                  </div>

                  {/* Table Rows */}
                  <div className="divide-y divide-slate-100">
                    {divisi.anggota.map((member, memIdx) => (
                      <div key={memIdx} className="grid grid-cols-12 gap-3 px-5 py-3 relative group hover:bg-slate-50/50 transition-colors">
                        
                        <div className="col-span-3 flex flex-col justify-center">
                          <input type="text" placeholder="Nama..." required value={member.nama} onChange={(e) => handleInputChange(divIdx, memIdx, "nama", e.target.value)} className={`${inputStyle} font-semibold`} />
                        </div>
                        
                        <div className="col-span-2 flex flex-col justify-center">
                          <input type="text" placeholder="Jabatan..." required value={member.jabatan} onChange={(e) => handleInputChange(divIdx, memIdx, "jabatan", e.target.value)} className={inputStyle} />
                        </div>

                        <div className="col-span-2 space-y-2">
                          <input type="text" placeholder="NIM..." value={member.nim} onChange={(e) => handleInputChange(divIdx, memIdx, "nim", e.target.value)} className={`${inputStyle} font-mono text-[12px]`} />
                          <input type="text" placeholder="NIA..." value={member.nia} onChange={(e) => handleInputChange(divIdx, memIdx, "nia", e.target.value)} className={`${inputStyle} font-mono text-[12px]`} />
                        </div>

                        <div className="col-span-2 space-y-2">
                          <input type="text" placeholder="Rayon..." value={member.rayon} onChange={(e) => handleInputChange(divIdx, memIdx, "rayon", e.target.value)} className={inputStyle} />
                          <input type="text" placeholder="Angkatan..." value={member.angkatan} onChange={(e) => handleInputChange(divIdx, memIdx, "angkatan", e.target.value)} className={inputStyle} />
                        </div>

                        <div className="col-span-3 space-y-2 pr-6">
                          <input type="text" placeholder="No WhatsApp (628...)" value={member.whatsapp} onChange={(e) => handleInputChange(divIdx, memIdx, "whatsapp", e.target.value)} className={`${inputStyle} font-mono text-[12px]`} />
                          <div className="flex items-center gap-2">
                             <label className={`cursor-pointer flex items-center justify-center p-2 rounded-md border transition-colors shrink-0 ${uploadingId === `${divIdx}-${memIdx}` ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-slate-50 text-slate-600 hover:text-blue-600 hover:border-blue-300 border-slate-300 shadow-sm'}`} title="Upload Foto">
                                {uploadingId === `${divIdx}-${memIdx}` ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, divIdx, memIdx)} disabled={uploadingId !== null} />
                             </label>
                             <input type="text" placeholder="URL Foto Profil..." value={member.foto} onChange={(e) => handleInputChange(divIdx, memIdx, "foto", e.target.value)} className={`${inputStyle} font-mono text-[11px] text-slate-500`} />
                          </div>
                        </div>
                        
                        {/* Action Delete melayang */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => handleDelAnggota(divIdx, memIdx)} className="bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded shadow-sm transition" title="Hapus Personil">
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        ))}

        {/* Floating/Bottom Action Bar */}
        {strukturData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-md border border-slate-200 sticky bottom-6 z-40 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
             <div className="flex items-start gap-2.5 text-[13px] text-slate-600 max-w-2xl">
               <Info size={16} className="shrink-0 mt-0.5 text-blue-500" />
               <p>Setiap perubahan yang Anda ketik akan tersimpan sementara. Klik tombol <strong>Simpan Pembaruan Struktur</strong> untuk mematenkan data ke server.</p>
             </div>
             <button type="submit" disabled={uploadingId !== null} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 px-6 rounded-md transition flex items-center justify-center gap-2 shadow-sm text-[13px] whitespace-nowrap shrink-0">
                <Save size={16} /> Simpan Pembaruan Struktur
              </button>
          </div>
        )}
      </form>
    </div>
  );
}