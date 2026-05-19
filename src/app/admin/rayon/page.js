"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, MapPin, Plus, Trash2, Image as ImageIcon, ExternalLink, Shield, BookOpen, Info, Compass, ChevronDown, ChevronUp } from "lucide-react";

export default function AdminRayonEditor() {
  const [loading, setLoading] = useState(true);
  const [rayonData, setRayonData] = useState([]);
  
  const [newRayonName, setNewRayonName] = useState("");
  const [newRayonFakultas, setNewRayonFakultas] = useState("");
  
  // State untuk membuka/menutup panel Pengurus Inti di tabel Admin
  const [openAccordion, setOpenAccordion] = useState(null);

  useEffect(() => {
    async function loadRayon() {
      try {
        const docRef = doc(db, "website_config", "database_rayon");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listRayon) {
          setRayonData(docSnap.data().listRayon);
        } else {
          setRayonData([{ nama: "Rayon Ibnu Sina", fakultas: "Saintek", deskripsi: "", ketua: "", waKetua: "", sekretaris: "", waSekret: "", bendahara: "", waBendum: "", coKaderisasi: "", waKaderisasi: "", coGerakan: "", waGerakan: "", sekretariat: "", foto: "", linkSosmed: "" }]);
        }
      } catch (error) {
        console.error("Gagal mengambil data rayon:", error);
      } finally {
        setLoading(false);
      }
    }
    loadRayon();
  }, []);

  const handleSave = async (currentData) => {
    try {
      const docRef = doc(db, "website_config", "database_rayon");
      await setDoc(docRef, { listRayon: currentData });
    } catch (error) {
      alert("Gagal sinkronisasi ke server: " + error.message);
    }
  };

  const handleAddRayon = (e) => {
    e.preventDefault();
    if (!newRayonName.trim()) return;
    const updated = [
      ...rayonData,
      { nama: newRayonName.trim(), fakultas: newRayonFakultas.trim() || "Fakultas", deskripsi: "", ketua: "", waKetua: "", sekretariat: "", foto: "", linkSosmed: "" }
    ];
    setRayonData(updated);
    setNewRayonName("");
    setNewRayonFakultas("");
  };

  const handleDeleteRayon = (index) => {
    if (!confirm("Apakah Anda yakin ingin menghapus profil Rayon ini?")) return;
    const updated = rayonData.filter((_, idx) => idx !== index);
    setRayonData(updated);
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...rayonData];
    updated[index][field] = value;
    setRayonData(updated);
  };

  const handleSubmitAll = async (e) => {
    e.preventDefault();
    try {
      await handleSave(rayonData);
      alert("Seluruh data profil Rayon berhasil diperbarui!");
    } catch (error) {
      alert("Gagal menyimpan: " + error.message);
    }
  };

  if (loading) return <p className="text-slate-500 animate-pulse font-medium">Memuat database rayon...</p>;

  return (
    <div className="space-y-6 pb-12 w-full max-w-6xl mx-auto">
      
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Compass size={24} className="text-blue-600" /> Kustomisasi Data Rayon
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">Kelola profil, basecamp, sosial media, dan data pengurus inti rayon.</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5"><Plus size={16} className="text-blue-600" /> Registrasi Rayon Baru</h2>
        <form onSubmit={handleAddRayon} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="space-y-1"><label className="text-xs font-bold text-slate-600">Nama Rayon</label><input type="text" required value={newRayonName} onChange={(e) => setNewRayonName(e.target.value)} placeholder="Contoh: Rayon Kawah" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div className="space-y-1"><label className="text-xs font-bold text-slate-600">Nama Fakultas</label><input type="text" required value={newRayonFakultas} onChange={(e) => setNewRayonFakultas(e.target.value)} placeholder="Contoh: Tarbiyah" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm flex items-center justify-center gap-1.5 h-[42px]">Tambah ke Sistem</button>
        </form>
      </div>

      <form onSubmit={handleSubmitAll} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {rayonData.map((rayon, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
              
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <MapPin size={16} className="text-blue-600 shrink-0" />
                  <input type="text" required value={rayon.nama} onChange={(e) => handleInputChange(idx, "nama", e.target.value)} className="font-bold text-slate-800 text-base bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none w-full md:w-1/2" />
                </div>
                <button type="button" onClick={() => handleDeleteRayon(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg border border-transparent hover:border-red-100 transition"><Trash2 size={16}/></button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase">Fakultas</label><input type="text" required value={rayon.fakultas || ""} onChange={(e) => handleInputChange(idx, "fakultas", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm font-semibold" /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase">Alamat Basecamp</label><input type="text" required value={rayon.sekretariat || ""} onChange={(e) => handleInputChange(idx, "sekretariat", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm" placeholder="Jl. Sunan Kalijaga..." /></div>
                </div>

                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Slogan Singkat Rayon</label><textarea rows="2" required value={rayon.deskripsi || ""} onChange={(e) => handleInputChange(idx, "deskripsi", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm text-slate-600" /></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase">Tautan Instagram</label><input type="text" value={rayon.linkSosmed || ""} onChange={(e) => handleInputChange(idx, "linkSosmed", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono" placeholder="https://instagram.com/..." /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase">URL Tautan Foto Cover</label><input type="text" value={rayon.foto || ""} onChange={(e) => handleInputChange(idx, "foto", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs" placeholder="Tautan ImgBB..." /></div>
                </div>

                {/* ACCORDION: PENGURUS INTI */}
                <div className="border border-blue-100 rounded-xl overflow-hidden mt-4">
                  <button type="button" onClick={() => setOpenAccordion(openAccordion === idx ? null : idx)} className="w-full bg-blue-50/50 hover:bg-blue-50 p-3 flex items-center justify-between font-bold text-blue-800 text-sm transition">
                    <span className="flex items-center gap-2"><Shield size={16}/> Input Data Pengurus Inti & WhatsApp</span>
                    {openAccordion === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  
                  {openAccordion === idx && (
                    <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-blue-50">
                      <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Ketua Rayon</label><input type="text" placeholder="Nama..." value={rayon.ketua || ""} onChange={(e) => handleInputChange(idx, "ketua", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs"/><input type="text" placeholder="No. WA (628...)" value={rayon.waKetua || ""} onChange={(e) => handleInputChange(idx, "waKetua", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"/></div>
                      <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Wakil Ketua</label><input type="text" placeholder="Nama..." value={rayon.wakilKetua || ""} onChange={(e) => handleInputChange(idx, "wakilKetua", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs"/><input type="text" placeholder="No. WA (628...)" value={rayon.waWakil || ""} onChange={(e) => handleInputChange(idx, "waWakil", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"/></div>
                      <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Sekretaris</label><input type="text" placeholder="Nama..." value={rayon.sekretaris || ""} onChange={(e) => handleInputChange(idx, "sekretaris", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs"/><input type="text" placeholder="No. WA (628...)" value={rayon.waSekret || ""} onChange={(e) => handleInputChange(idx, "waSekret", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"/></div>
                      <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Bendahara</label><input type="text" placeholder="Nama..." value={rayon.bendahara || ""} onChange={(e) => handleInputChange(idx, "bendahara", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs"/><input type="text" placeholder="No. WA (628...)" value={rayon.waBendum || ""} onChange={(e) => handleInputChange(idx, "waBendum", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"/></div>
                      <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">CO Kaderisasi</label><input type="text" placeholder="Nama..." value={rayon.coKaderisasi || ""} onChange={(e) => handleInputChange(idx, "coKaderisasi", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs"/><input type="text" placeholder="No. WA (628...)" value={rayon.waKaderisasi || ""} onChange={(e) => handleInputChange(idx, "waKaderisasi", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"/></div>
                      <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">CO Gerakan</label><input type="text" placeholder="Nama..." value={rayon.coGerakan || ""} onChange={(e) => handleInputChange(idx, "coGerakan", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs"/><input type="text" placeholder="No. WA (628...)" value={rayon.waGerakan || ""} onChange={(e) => handleInputChange(idx, "waGerakan", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"/></div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>

        {rayonData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100 sticky bottom-4 z-40 shadow-xl shadow-blue-500/5">
             <div className="flex items-start gap-2 text-xs text-blue-700">
               <Info size={16} className="shrink-0 mt-0.5 text-blue-600" />
               <p>Klik Simpan agar perubahan data pengurus inti dan whatsapp masuk ke dalam sistem publik.</p>
             </div>
             <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition flex items-center justify-center gap-2 shadow-md text-sm whitespace-nowrap shrink-0">
                Simpan Konfigurasi <Save size={16} />
              </button>
          </div>
        )}
      </form>
    </div>
  );
}