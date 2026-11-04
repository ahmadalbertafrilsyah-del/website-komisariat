"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as XLSX from "xlsx"; 
import { Save, Users, Plus, Trash2, Briefcase, FileSpreadsheet, UploadCloud, Info, Loader2, ChevronDown, ChevronUp, Edit, CalendarDays, Star } from "lucide-react";

const makePeriodeId = () => `periode-${Date.now()}`;

export default function AdminStrukturEditor() {
  const [loading, setLoading] = useState(true);
  // Setiap periode menyimpan susunan biro & personilnya sendiri
  const [periodeList, setPeriodeList] = useState([]);
  const [activePeriodeId, setActivePeriodeId] = useState("");
  const [periodeBerjalanId, setPeriodeBerjalanId] = useState("");
  const [newKategori, setNewKategori] = useState("");
  
  const [uploadingId, setUploadingId] = useState(null); 
  const [expandedDivisi, setExpandedDivisi] = useState({}); // State untuk mengatur panel buka/tutup
  const fileInputRef = useRef(null);

  const activePeriode = periodeList.find(p => p.id === activePeriodeId) || periodeList[0] || null;
  const strukturData = activePeriode?.listKategori || [];
  const setStrukturData = (newList) => {
    if (!activePeriode) return;
    setPeriodeList(prev => prev.map(p => (p.id === activePeriode.id ? { ...p, listKategori: newList } : p)));
  };

  useEffect(() => {
    async function loadStruktur() {
      try {
        const docRef = doc(db, "website_config", "struktur_organisasi");
        const docSnap = await getDoc(docRef);
        let list = [];
        let berjalan = "";
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.listPeriode) && data.listPeriode.length > 0) {
            list = data.listPeriode;
            berjalan = data.periodeBerjalanId || list[0].id;
          } else if (Array.isArray(data.listKategori)) {
            // Migrasi otomatis: data lama dijadikan Periode 2026
            list = [{ id: "periode-2026", periode: "2026", listKategori: data.listKategori }];
            berjalan = "periode-2026";
          }
        }
        if (list.length === 0) {
          list = [{ id: "periode-2026", periode: "2026", listKategori: [{ kategori: "Badan Pengurus Harian (BPH)", anggota: [] }] }];
          berjalan = "periode-2026";
        }
        setPeriodeList(list);
        setPeriodeBerjalanId(berjalan);
        setActivePeriodeId(berjalan);
      } catch (error) {
        console.error("Gagal mengambil data struktur:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStruktur();
  }, []);

  const saveAllToFirebase = async (list = periodeList, berjalanId = periodeBerjalanId) => {
    const berjalan = list.find(p => p.id === berjalanId) || list[0];
    const docRef = doc(db, "website_config", "struktur_organisasi");
    // listKategori tetap ditulis (periode berjalan) agar kompatibel dengan komponen lama
    await setDoc(docRef, {
      listPeriode: list,
      periodeBerjalanId: berjalan?.id || "",
      listKategori: berjalan?.listKategori || [],
    });
  };

  // ================= MANAJEMEN PERIODE =================
  const handleAddPeriode = async () => {
    const nama = (prompt("Nama periode baru (misal: 2027 atau 2027/2028):") || "").trim();
    if (!nama) return;
    if (periodeList.some(p => String(p.periode).toLowerCase() === nama.toLowerCase())) {
      return alert("Periode dengan nama tersebut sudah ada!");
    }
    const salinBiro = activePeriode && strukturData.length > 0 && confirm(
      `Salin NAMA biro/divisi dari periode ${activePeriode.periode}?\n\nOK = salin nama biro saja (personil tetap kosong)\nBatal = mulai benar-benar kosong`
    );
    const newPeriode = {
      id: makePeriodeId(),
      periode: nama,
      listKategori: salinBiro
        ? strukturData.map(b => ({ kategori: b.kategori, anggota: [] }))
        : [{ kategori: "Badan Pengurus Harian (BPH)", anggota: [] }],
    };
    const newList = [newPeriode, ...periodeList];
    const jadikanBerjalan = confirm(`Jadikan periode ${nama} sebagai periode berjalan (tampil default di halaman pengunjung)?`);
    const newBerjalan = jadikanBerjalan ? newPeriode.id : periodeBerjalanId;
    setPeriodeList(newList);
    setPeriodeBerjalanId(newBerjalan);
    setActivePeriodeId(newPeriode.id);
    setExpandedDivisi({});
    try {
      await saveAllToFirebase(newList, newBerjalan);
    } catch (err) {
      alert("Gagal menyimpan periode baru: " + err.message);
    }
  };

  const handleRenamePeriode = () => {
    if (!activePeriode) return;
    const nama = (prompt("Ubah nama periode:", activePeriode.periode) || "").trim();
    if (!nama || nama === activePeriode.periode) return;
    setPeriodeList(prev => prev.map(p => (p.id === activePeriode.id ? { ...p, periode: nama } : p)));
  };

  const handleDeletePeriode = async () => {
    if (!activePeriode) return;
    if (periodeList.length <= 1) return alert("Minimal harus ada satu periode.");
    if (!confirm(`HAPUS PERIODE ${activePeriode.periode}? Seluruh biro & personil di periode ini akan terhapus permanen.`)) return;
    const newList = periodeList.filter(p => p.id !== activePeriode.id);
    const newBerjalan = periodeBerjalanId === activePeriode.id ? newList[0].id : periodeBerjalanId;
    setPeriodeList(newList);
    setPeriodeBerjalanId(newBerjalan);
    setActivePeriodeId(newBerjalan);
    try {
      await saveAllToFirebase(newList, newBerjalan);
    } catch (err) {
      alert("Gagal menghapus periode: " + err.message);
    }
  };

  const handleSwitchPeriode = (id) => {
    setActivePeriodeId(id);
    setExpandedDivisi({});
  };

  const handleAddKategori = (e) => {
    e.preventDefault();
    if (!newKategori.trim()) return;
    const updated = [...strukturData, { kategori: newKategori.trim(), anggota: [] }];
    setStrukturData(updated);
    setNewKategori("");
    // Otomatis buka panel biro yang baru dibuat
    setExpandedDivisi(prev => ({ ...prev, [updated.length - 1]: true }));
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
    // Otomatis buka panel jika ada penambahan anggota
    setExpandedDivisi(prev => ({ ...prev, [indexKategori]: true }));
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

  const toggleExpand = (index) => {
    setExpandedDivisi(prev => ({ ...prev, [index]: !prev[index] }));
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
      await saveAllToFirebase();
      alert(`Struktur kepengurusan periode ${activePeriode?.periode || ""} berhasil disimpan ke Database!`);
    } catch (err) {
      alert("Gagal sinkronisasi ke server: " + err.message);
    }
  };

  // Kalkulasi Total Personil untuk Persentase
  const totalPersonil = strukturData.reduce((acc, curr) => acc + (curr.anggota?.length || 0), 0);

  // STYLE STANDAR ENTERPRISE
  const inputStyle = "w-full px-3 py-2 border border-slate-300 rounded-md text-[13px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white placeholder:text-slate-400";
  const labelStyle = "text-[13px] font-semibold text-slate-700 block mb-1.5";

  if (loading) return <p className="text-slate-500 text-sm font-medium">Memuat database struktur...</p>;

  return (
    <div className="space-y-5 pb-12 w-full">
      
      {/* STICKY HEADER PANEL & TOMBOL SIMPAN DI ATAS */}
      <div className="sticky top-0 z-30 -mx-3.5 sm:-mx-6 px-3.5 sm:px-6 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600 block">
            Organigram Periode {activePeriode?.periode} // {totalPersonil} Total Personil
          </span>
          <h1 className="text-base sm:text-lg font-black text-slate-900">Manajemen Struktur Kepengurusan</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <CalendarDays size={15} className="text-amber-600 shrink-0" />
            <select
              value={activePeriode?.id || ""}
              onChange={(e) => handleSwitchPeriode(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer max-w-[140px] truncate"
            >
              {periodeList.map(p => (
                <option key={p.id} value={p.id}>
                  Periode {p.periode}{p.id === periodeBerjalanId ? " (berjalan)" : ""}
                </option>
              ))}
            </select>
          </div>
          <button type="button" onClick={handleAddPeriode} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3.5 rounded-xl transition-colors text-xs shadow-xs shrink-0 flex items-center gap-1.5">
            <Plus size={14} className="text-amber-400" /> Periode Baru
          </button>
          {strukturData.length > 0 && (
            <button type="button" onClick={() => { if(confirm("Yakin ingin menghapus seluruh data struktur yang ada?")) setStrukturData([]) }} className="bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold py-2 px-3.5 rounded-xl transition-colors text-xs shadow-xs shrink-0">
              Kosongkan Data
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploadingId !== null}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-xs text-xs whitespace-nowrap shrink-0"
          >
            <Save size={15} /> Simpan Pembaruan Struktur
          </button>
        </div>
      </div>

      {/* PANEL INFO PERIODE AKTIF */}
      {activePeriode && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <CalendarDays size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-black text-slate-900">Periode {activePeriode.periode}</h2>
                {activePeriode.id === periodeBerjalanId ? (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Periode Berjalan</span>
                ) : (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">Arsip</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Semua perubahan biro &amp; personil di bawah hanya berlaku untuk periode ini. Pengunjung dapat memilih periode di halaman Struktur.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {activePeriode.id !== periodeBerjalanId && (
              <button type="button" onClick={() => setPeriodeBerjalanId(activePeriode.id)} className="text-xs font-bold px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 flex items-center gap-1.5">
                <Star size={13} /> Jadikan Berjalan
              </button>
            )}
            <button type="button" onClick={handleRenamePeriode} className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5">
              <Edit size={13} /> Ubah Nama
            </button>
            {periodeList.length > 1 && (
              <button type="button" onClick={handleDeletePeriode} className="text-xs font-bold px-3 py-2 rounded-lg border border-red-200 text-red-600 bg-white hover:bg-red-50 flex items-center gap-1.5">
                <Trash2 size={13} /> Hapus Periode
              </button>
            )}
          </div>
        </div>
      )}

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
              <span className="font-mono font-bold text-slate-700">Biro | Nama Lengkap | Jabatan | NIM | NIA | Rayon | Angkatan | WhatsApp</span>
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
        
        {strukturData.map((divisi, divIdx) => {
          const isExpanded = expandedDivisi[divIdx] || false;
          const pct = totalPersonil === 0 ? "0.0" : (((divisi.anggota?.length || 0) / totalPersonil) * 100).toFixed(1);

          return (
            <div key={divIdx} className={`bg-white rounded-md border shadow-sm overflow-hidden transition-all duration-300 ${isExpanded ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}>
              
              {/* Header Biro (Bisa di-klik untuk buka/tutup) */}
              <div 
                className={`px-5 py-3 flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/50 border-b border-blue-100' : 'bg-slate-50/80'}`}
                onClick={() => toggleExpand(divIdx)}
              >
                <div className="flex items-center gap-3 flex-grow">
                  <button type="button" className="text-slate-400 hover:text-blue-600 transition p-1 rounded-md hover:bg-slate-200">
                    {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                  </button>
                  <Briefcase size={16} className="text-slate-500 shrink-0" />
                  
                  <input 
                    type="text" value={divisi.kategori}
                    onClick={(e) => e.stopPropagation()} 
                    onChange={(e) => {
                       const updated = [...strukturData];
                       updated[divIdx].kategori = e.target.value;
                       setStrukturData(updated);
                    }}
                    className="font-bold text-slate-800 text-[14px] bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none transition w-full sm:max-w-md py-1"
                  />

                  {/* Badge Statistik Formal */}
                  <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-200 px-3 py-1 rounded-md shadow-sm shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Users size={12} className="text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-700">{divisi.anggota.length} Personil</span>
                    <span className="text-[10px] text-slate-400 font-medium">({pct}%)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-10 xl:ml-0" onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={() => toggleExpand(divIdx)} className={`bg-white border text-[12px] font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition shadow-sm ${isExpanded ? 'text-slate-500 border-slate-200 hover:bg-slate-50' : 'text-blue-600 border-blue-200 hover:bg-blue-50'}`}>
                    <Edit size={14} className={isExpanded ? "text-slate-400" : "text-blue-500"}/> {isExpanded ? "Tutup Data" : "Edit Data"}
                  </button>
                  <button type="button" onClick={() => { handleAddAnggota(divIdx); }} className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[12px] font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition shadow-sm">
                    <Plus size={14}/> Personil Baru
                  </button>
                  <button type="button" onClick={() => handleDelKategori(divIdx)} className="bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 p-1.5 rounded transition shadow-sm" title="Hapus Biro Ini">
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>

              {/* Grid Tabel Anggota (Hanya Tampil Jika isExpanded === true) */}
              {isExpanded && (
                <div className="p-0 overflow-x-auto animate-in slide-in-from-top-2 duration-300">
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
                      <div className="divide-y divide-slate-100 pb-2">
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
              )}

            </div>
          );
        })}
      </form>
    </div>
  );
}