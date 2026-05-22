"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, Plus, Trash2, GraduationCap, Search, Image as ImageIcon } from "lucide-react";

export default function AdminAlumni() {
  const [loading, setLoading] = useState(true);
  const [alumniData, setAlumniData] = useState([]);
  
  const [newNama, setNewNama] = useState("");
  const [newTahun, setNewTahun] = useState("");
  const [newRayon, setNewRayon] = useState("");
  const [newProfesi, setNewProfesi] = useState("");
  const [newFoto, setNewFoto] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const docRef = doc(db, "website_config", "database_alumni");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listAlumni) {
          setAlumniData(docSnap.data().listAlumni);
        }
      } catch (error) {
        console.error("Gagal load alumni:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newNama.trim()) return;
    const updated = [{ id: Date.now(), nama: newNama, tahunMapaba: newTahun, asalRayon: newRayon, profesi: newProfesi, foto: newFoto }, ...alumniData];
    setAlumniData(updated);
    setNewNama(""); setNewTahun(""); setNewRayon(""); setNewProfesi(""); setNewFoto("");
  };

  const handleDelete = (id) => {
    if (!confirm("Hapus alumni ini?")) return;
    setAlumniData(alumniData.filter(item => item.id !== id));
  };

  const handleInputChange = (id, field, value) => {
    setAlumniData(alumniData.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "website_config", "database_alumni"), { listAlumni: alumniData });
      alert("Data Alumni berhasil diperbarui di server!");
    } catch (error) {
      alert("Gagal menyimpan: " + error.message);
    }
  };

  const filteredData = alumniData.filter(a => a.nama?.toLowerCase().includes(searchQuery.toLowerCase()) || a.profesi?.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <p className="text-slate-500 animate-pulse">Memuat database alumni...</p>;

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><GraduationCap size={24} className="text-blue-600"/> Kelola Direktori Alumni</h1>
          <p className="text-sm text-slate-500">Pendataan karir dan jejak alumni PMII Komisariat.</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5"><Plus size={16} className="text-blue-600" /> Tambah Alumni Baru</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-2 space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Nama Lengkap</label><input type="text" required value={newNama} onChange={e => setNewNama(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl text-sm" placeholder="Nama & Gelar"/></div>
          <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Tahun Mapaba</label><input type="text" value={newTahun} onChange={e => setNewTahun(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl text-sm" placeholder="Misal: 2015"/></div>
          <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Asal Rayon</label><input type="text" value={newRayon} onChange={e => setNewRayon(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl text-sm" placeholder="Nama Rayon"/></div>
          <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Profesi Saat Ini</label><input type="text" value={newProfesi} onChange={e => setNewProfesi(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl text-sm" placeholder="Dosen / Pengusaha"/></div>
          <div className="md:col-span-5 flex gap-3 mt-2">
            <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">URL Foto (ImgBB dll)</label><input type="text" value={newFoto} onChange={e => setNewFoto(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl text-sm font-mono" placeholder="https://..."/></div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-xl text-sm transition mt-4 shrink-0">Tambah</button>
          </div>
        </form>
      </div>

      <form onSubmit={handleSaveAll} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
           <div className="relative w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input type="text" placeholder="Cari nama alumni..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-sm outline-none"/></div>
           <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-sm flex items-center gap-2 shadow-sm"><Save size={16}/> Simpan Perubahan</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredData.map(a => (
            <div key={a.id} className="border border-slate-100 p-4 rounded-xl flex items-start gap-4 hover:border-blue-200 transition bg-slate-50/50">
               {a.foto ? <img src={a.foto} className="w-16 h-16 rounded-xl object-cover shrink-0"/> : <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center shrink-0"><ImageIcon size={20} className="text-slate-400"/></div>}
               <div className="flex-1 space-y-2">
                  <input type="text" value={a.nama} onChange={e => handleInputChange(a.id, "nama", e.target.value)} className="w-full font-bold text-slate-800 bg-transparent border-b border-slate-200 text-sm outline-none focus:border-blue-500" placeholder="Nama Lengkap"/>
                  <input type="text" value={a.profesi} onChange={e => handleInputChange(a.id, "profesi", e.target.value)} className="w-full font-medium text-emerald-600 bg-transparent border-b border-slate-200 text-xs outline-none focus:border-blue-500" placeholder="Profesi"/>
                  <div className="flex gap-2">
                     <input type="text" value={a.tahunMapaba} onChange={e => handleInputChange(a.id, "tahunMapaba", e.target.value)} className="w-1/3 bg-transparent border-b border-slate-200 text-xs outline-none text-slate-500" placeholder="Thn Mapaba"/>
                     <input type="text" value={a.asalRayon} onChange={e => handleInputChange(a.id, "asalRayon", e.target.value)} className="w-2/3 bg-transparent border-b border-slate-200 text-xs outline-none text-slate-500" placeholder="Rayon Asal"/>
                  </div>
                  <input type="text" value={a.foto || ""} onChange={e => handleInputChange(a.id, "foto", e.target.value)} className="w-full font-mono text-[10px] text-slate-400 bg-white border rounded p-1" placeholder="URL Foto"/>
               </div>
               <button type="button" onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </form>
    </div>
  );
}