"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, Plus, Trash2, Trophy, Search, Image as ImageIcon, Award, BookOpen } from "lucide-react";

export default function AdminApresiasi() {
  const [loading, setLoading] = useState(true);
  const [kaderData, setKaderData] = useState([]);
  
  // State Input Kader Baru
  const [newNama, setNewNama] = useState("");
  const [newRayon, setNewRayon] = useState("");
  const [newFoto, setNewFoto] = useState("");
  
  // State untuk Panel Edit Prestasi
  const [activeEditKader, setActiveEditKader] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const docRef = doc(db, "website_config", "database_apresiasi");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listApresiasi) {
          setKaderData(docSnap.data().listApresiasi);
        }
      } catch (error) {
        console.error("Gagal load apresiasi:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddKader = (e) => {
    e.preventDefault();
    if (!newNama.trim()) return;
    const updated = [{ id: Date.now().toString(), namaLengkap: newNama, asalRayon: newRayon, fotoKader: newFoto, prestasi: [] }, ...kaderData];
    setKaderData(updated);
    setNewNama(""); setNewRayon(""); setNewFoto("");
  };

  const handleDeleteKader = (id) => {
    if (!confirm("Hapus kader berprestasi ini beserta seluruh riwayat prestasinya?")) return;
    setKaderData(kaderData.filter(item => item.id !== id));
    if(activeEditKader?.id === id) setActiveEditKader(null);
  };

  const handleAddPrestasi = (kaderId, tipe) => {
    const updated = kaderData.map(k => {
      if (k.id === kaderId) {
        return {
          ...k, 
          prestasi: [...k.prestasi, { id: Date.now(), tipe, judul: "", pencapaian: "", tingkat: "", tahun: "", linkOrFoto: "" }]
        };
      }
      return k;
    });
    setKaderData(updated);
    setActiveEditKader(updated.find(k => k.id === kaderId)); // Sync modal
  };

  const handleUpdatePrestasi = (kaderId, presId, field, value) => {
    const updated = kaderData.map(k => {
      if (k.id === kaderId) {
        return { ...k, prestasi: k.prestasi.map(p => p.id === presId ? { ...p, [field]: value } : p) };
      }
      return k;
    });
    setKaderData(updated);
    setActiveEditKader(updated.find(k => k.id === kaderId));
  };

  const handleDeletePrestasi = (kaderId, presId) => {
    const updated = kaderData.map(k => {
      if (k.id === kaderId) return { ...k, prestasi: k.prestasi.filter(p => p.id !== presId) };
      return k;
    });
    setKaderData(updated);
    setActiveEditKader(updated.find(k => k.id === kaderId));
  };

  const handleSaveAll = async () => {
    try {
      await setDoc(doc(db, "website_config", "database_apresiasi"), { listApresiasi: kaderData });
      alert("Database Apresiasi Kader berhasil diperbarui!");
      setActiveEditKader(null);
    } catch (error) {
      alert("Gagal menyimpan: " + error.message);
    }
  };

  if (loading) return <p className="text-slate-500 animate-pulse">Memuat database apresiasi...</p>;

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Trophy size={24} className="text-amber-500"/> Kelola Apresiasi Kader</h1>
        <p className="text-sm text-slate-500 mt-1">Input kader berprestasi, lalu tambahkan riwayat lomba atau publikasi jurnal di dalam profil mereka.</p>
      </div>

      {/* Form Tambah Kader Master */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5"><Plus size={16} className="text-blue-600" /> Daftarkan Profil Kader Baru</h2>
        <form onSubmit={handleAddKader} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2 space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Nama Kader</label><input type="text" required value={newNama} onChange={e => setNewNama(e.target.value)} className="w-full p-2 border rounded-xl text-sm" placeholder="Nama Lengkap"/></div>
          <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Asal Rayon</label><input type="text" value={newRayon} onChange={e => setNewRayon(e.target.value)} className="w-full p-2 border rounded-xl text-sm" placeholder="Nama Rayon"/></div>
          <div className="flex gap-2 w-full"><div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Foto Profil (URL)</label><input type="text" value={newFoto} onChange={e => setNewFoto(e.target.value)} className="w-full p-2 border rounded-xl text-sm font-mono" placeholder="ImgBB url..."/></div><button type="submit" className="bg-blue-600 text-white font-bold px-4 rounded-xl text-sm mt-4">Tambah</button></div>
        </form>
      </div>

      {/* List Kader Tersimpan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kaderData.map(kader => (
          <div key={kader.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              {kader.fotoKader ? <img src={kader.fotoKader} className="w-14 h-14 rounded-full object-cover"/> : <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center"><ImageIcon size={20} className="text-slate-400"/></div>}
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{kader.namaLengkap}</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">{kader.asalRayon}</p>
              </div>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
               <span className="text-xs font-bold text-slate-600"><Trophy size={14} className="inline text-amber-500 mr-1"/> {kader.prestasi.length} Prestasi</span>
               <div className="flex gap-2">
                 <button onClick={() => setActiveEditKader(kader)} className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition">Kelola Prestasi</button>
                 <button onClick={() => handleDeleteKader(kader.id)} className="bg-red-100 text-red-600 px-2 py-1.5 rounded-lg"><Trash2 size={14}/></button>
               </div>
            </div>
          </div>
        ))}
      </div>
      {kaderData.length > 0 && <button onClick={handleSaveAll} className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition shadow-xl"><Save size={18} className="inline mr-2"/>Simpan Permanen Seluruh Data ke Database Publik</button>}

      {/* MODAL KELOLA PRESTASI PER KADER */}
      {activeEditKader && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
              <div className="bg-slate-50 p-5 border-b border-slate-200 flex justify-between items-center">
                 <div><h2 className="font-bold text-lg text-slate-800">Prestasi: {activeEditKader.namaLengkap}</h2><p className="text-xs text-slate-500">Tambahkan lomba atau publikasi jurnal.</p></div>
                 <button onClick={() => setActiveEditKader(null)} className="bg-slate-200 hover:bg-slate-300 px-4 py-2 text-xs font-bold rounded-lg">Tutup</button>
              </div>
              <div className="p-5 overflow-y-auto bg-slate-100 flex-1 space-y-4">
                 <div className="flex gap-3 mb-4">
                    <button onClick={() => handleAddPrestasi(activeEditKader.id, 'non-akademik')} className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 shadow-md"><Award size={14}/> + Lomba / Kejuaraan</button>
                    <button onClick={() => handleAddPrestasi(activeEditKader.id, 'akademik')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 shadow-md"><BookOpen size={14}/> + Jurnal / Akademik</button>
                 </div>
                 {activeEditKader.prestasi.map((p, idx) => (
                    <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                       <span className={`absolute -top-3 left-4 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md text-white ${p.tipe === 'akademik' ? 'bg-emerald-600' : 'bg-amber-500'}`}>{p.tipe === 'akademik' ? 'Publikasi Ilmiah' : 'Kejuaraan Lomba'}</span>
                       <button onClick={() => handleDeletePrestasi(activeEditKader.id, p.id)} className="absolute top-3 right-3 text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                          <div className="col-span-2"><label className="text-[10px] font-bold text-slate-400 uppercase">{p.tipe === 'akademik' ? 'Judul Jurnal / Karya' : 'Jenis Lomba'}</label><input type="text" value={p.judul} onChange={e => handleUpdatePrestasi(activeEditKader.id, p.id, "judul", e.target.value)} className="w-full border-b border-slate-200 p-1 text-sm outline-none bg-transparent" placeholder="Tulis di sini..."/></div>
                          <div className="col-span-2"><label className="text-[10px] font-bold text-slate-400 uppercase">{p.tipe === 'akademik' ? 'Nama Jurnal' : 'Juara Ke Berapa'}</label><input type="text" value={p.pencapaian} onChange={e => handleUpdatePrestasi(activeEditKader.id, p.id, "pencapaian", e.target.value)} className="w-full border-b border-slate-200 p-1 text-sm outline-none bg-transparent" placeholder="Tulis di sini..."/></div>
                          <div><label className="text-[10px] font-bold text-slate-400 uppercase">Tingkat</label><input type="text" value={p.tingkat} onChange={e => handleUpdatePrestasi(activeEditKader.id, p.id, "tingkat", e.target.value)} className="w-full border-b border-slate-200 p-1 text-sm outline-none bg-transparent" placeholder="Nasional/Internasional"/></div>
                          <div><label className="text-[10px] font-bold text-slate-400 uppercase">Tahun</label><input type="text" value={p.tahun} onChange={e => handleUpdatePrestasi(activeEditKader.id, p.id, "tahun", e.target.value)} className="w-full border-b border-slate-200 p-1 text-sm outline-none bg-transparent" placeholder="2025"/></div>
                          <div className="col-span-2"><label className="text-[10px] font-bold text-slate-400 uppercase">{p.tipe === 'akademik' ? 'Link DOI / Website' : 'URL Foto Bawa Piala'}</label><input type="text" value={p.linkOrFoto} onChange={e => handleUpdatePrestasi(activeEditKader.id, p.id, "linkOrFoto", e.target.value)} className="w-full border-b border-slate-200 p-1 text-xs font-mono outline-none bg-transparent" placeholder="https://..."/></div>
                       </div>
                    </div>
                 ))}
                 {activeEditKader.prestasi.length === 0 && <p className="text-center text-slate-400 py-10">Belum ada riwayat prestasi yang diinput.</p>}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}