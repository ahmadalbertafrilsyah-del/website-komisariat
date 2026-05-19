"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, FileText, Plus, Trash2, Folder, Info, Hash, Mail } from "lucide-react";

export default function AdminAdministrasiEditor() {
  const [loading, setLoading] = useState(true);
  const [dokumenData, setDokumenData] = useState([]);
  
  // State untuk Tambah Surat Baru
  const [newNomorSurat, setNewNomorSurat] = useState("");
  const [newPerihal, setNewPerihal] = useState("");
  const [newDeskripsi, setNewDeskripsi] = useState("");
  const [newLink, setNewLink] = useState("");

  useEffect(() => {
    async function loadDokumen() {
      try {
        const docRef = doc(db, "website_config", "database_administrasi");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listDokumen) {
          setDokumenData(docSnap.data().listDokumen);
        } else {
          // Data Default Awal
          setDokumenData([
            { id: Date.now(), nomorSurat: "001/PR-V/V-04/PMII/X/2026", perihalSurat: "Peminjaman Tempat", deskripsiSurat: "Peminjaman Gedung Sport Center untuk pelantikan.", linkFile: "" }
          ]);
        }
      } catch (error) {
        console.error("Gagal mengambil data administrasi:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDokumen();
  }, []);

  const handleAddDokumen = (e) => {
    e.preventDefault();
    if (!newPerihal.trim() || !newNomorSurat.trim()) return;

    const updated = [
      {
        id: Date.now(),
        nomorSurat: newNomorSurat.trim(),
        perihalSurat: newPerihal.trim(),
        deskripsiSurat: newDeskripsi.trim(),
        linkFile: newLink.trim()
      },
      ...dokumenData
    ];

    setDokumenData(updated);
    setNewNomorSurat("");
    setNewPerihal("");
    setNewDeskripsi("");
    setNewLink("");
  };

  const handleDelete = (id) => {
    if (!confirm("Hapus surat ini dari sistem arsip?")) return;
    setDokumenData(dokumenData.filter(item => item.id !== id));
  };

  const handleInputChange = (id, field, value) => {
    setDokumenData(dokumenData.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, "website_config", "database_administrasi");
      await setDoc(docRef, { listDokumen: dokumenData });
      alert("Database Administrasi Persuratan berhasil diperbarui!");
    } catch (error) {
      alert("Gagal menyimpan: " + error.message);
    }
  };

  if (loading) return <p className="text-slate-500 animate-pulse font-medium">Memuat database administrasi...</p>;

  return (
    <div className="space-y-6 pb-12 w-full max-w-6xl mx-auto">
      
      {/* Header Halaman */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Mail size={24} className="text-blue-600" /> Arsip Administrasi Surat
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">Kelola penomoran, perihal, dan tautan file surat secara terpusat.</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 text-center">
           <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Total Surat</p>
           <p className="text-xl font-black text-blue-700 leading-none mt-0.5">{dokumenData.length}</p>
        </div>
      </div>

      {/* Form Tambah Surat Baru */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5"><Plus size={16} className="text-blue-600" /> Input Surat / Arsip Baru</h2>
        <form onSubmit={handleAddDokumen} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Nomor Surat</label>
            <input type="text" required value={newNomorSurat} onChange={(e) => setNewNomorSurat(e.target.value)} placeholder="001/PR.../2026" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Perihal Surat</label>
            <input type="text" required value={newPerihal} onChange={(e) => setNewPerihal(e.target.value)} placeholder="Peminjaman Tempat" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Deskripsi Singkat</label>
            <input type="text" value={newDeskripsi} onChange={(e) => setNewDeskripsi(e.target.value)} placeholder="Keterangan tambahan..." className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Link File Surat (G-Drive)</label>
            <input type="text" value={newLink} onChange={(e) => setNewLink(e.target.value)} placeholder="https://..." className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
          </div>
          <button type="submit" className="md:col-span-2 lg:col-span-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-xl text-sm flex items-center justify-center gap-1.5 transition shadow-sm mt-2">
            Simpan ke Sistem Arsip
          </button>
        </form>
      </div>

      {/* Daftar Tabel Surat Aktif */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
              <thead className="bg-[#1e293b] text-white">
                <tr>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider w-12 text-center">No</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider w-1/4">Nomor Surat</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider w-1/4">Perihal Surat</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider w-1/4">Deskripsi Surat</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider w-48">Link File Surat</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider w-16 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm bg-white">
                {dokumenData.length > 0 ? dokumenData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">{index + 1}</td>
                    
                    {/* Nomor Surat */}
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-1.5">
                        <Hash size={14} className="text-slate-400 shrink-0"/>
                        <input type="text" value={item.nomorSurat || ""} onChange={(e) => handleInputChange(item.id, "nomorSurat", e.target.value)} className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 px-2 py-1 outline-none font-mono text-xs font-bold text-blue-600" />
                      </div>
                    </td>
                    
                    {/* Perihal Surat */}
                    <td className="py-2 px-4">
                      <input type="text" value={item.perihalSurat || ""} onChange={(e) => handleInputChange(item.id, "perihalSurat", e.target.value)} className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 px-2 py-1 outline-none font-bold text-slate-800 text-sm" />
                    </td>
                    
                    {/* Deskripsi */}
                    <td className="py-2 px-4">
                      <input type="text" value={item.deskripsiSurat || ""} onChange={(e) => handleInputChange(item.id, "deskripsiSurat", e.target.value)} className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 px-2 py-1 outline-none text-slate-500 text-xs" placeholder="Keterangan..." />
                    </td>
                    
                    {/* Link Surat */}
                    <td className="py-2 px-4">
                      <input type="text" value={item.linkFile || ""} onChange={(e) => handleInputChange(item.id, "linkFile", e.target.value)} className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 px-2 py-1 outline-none font-mono text-xs text-emerald-600" placeholder="https://..." />
                    </td>
                    
                    <td className="py-2 px-4 text-center">
                      <button type="button" onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-500 p-1.5"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="py-12 text-center text-slate-400">Belum ada surat yang ditambahkan ke sistem.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Floating Action Bar */}
        {dokumenData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100 sticky bottom-4 z-40 shadow-xl shadow-blue-500/5">
             <div className="flex items-center gap-2 text-xs text-blue-700">
               <Info size={16} className="shrink-0 text-blue-600" />
               <p>Klik Simpan agar perubahan data nomor dan file surat ter-sinkronisasi ke halaman pengunjung.</p>
             </div>
             <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition flex items-center justify-center gap-2 shadow-md text-sm shrink-0">
                Simpan Arsip Surat <Save size={16} />
              </button>
          </div>
        )}
      </form>
    </div>
  );
}