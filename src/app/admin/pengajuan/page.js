// app/admin/pengajuan/page.js
"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { Inbox, Settings, FileSignature, Users, Loader2, CheckCircle, XCircle, Trash2, Plus, Edit, X, Save } from "lucide-react";

export default function AdminPengajuan() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inbox-sk"); // inbox-sk, inbox-rtar, form-sk, form-rtar
  
  // Data Inbox
  const [inboxSK, setInboxSK] = useState([]);
  const [inboxRTAR, setInboxRTAR] = useState([]);

  // Data Schema Form Custom
  const [skSchema, setSkSchema] = useState([]);
  const [rtarSchema, setRtarSchema] = useState([]);

  // Modal Custom Form Builder
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [fieldForm, setFieldForm] = useState({ id: "", label: "", type: "text", required: true, placeholder: "" });
  
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch Inbox SK
      const skSnap = await getDocs(collection(db, "pengajuan_sk"));
      setInboxSK(skSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));

      // Fetch Inbox RTAR
      const rtarSnap = await getDocs(collection(db, "pengajuan_rtar"));
      setInboxRTAR(rtarSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));

      // Fetch Schema Form
      const schemaSnap = await getDoc(doc(db, "website_config", "pengajuan_schema"));
      if (schemaSnap.exists()) {
        const sData = schemaSnap.data();
        setSkSchema(sData.sk || defaultSkSchema);
        setRtarSchema(sData.rtar || defaultRtarSchema);
      } else {
        setSkSchema(defaultSkSchema);
        setRtarSchema(defaultRtarSchema);
      }
    } catch (err) { console.error("Error fetching pengajuan:", err); }
    finally { setLoading(false); }
  }

  // Fallback if not configured
  const defaultSkSchema = [
    { id: "namaOrganisasi", label: "Asal Organisasi / Nama Kepanitiaan", type: "text", required: true, placeholder: "Contoh: PR PMII Rayon XYZ" },
    { id: "email", label: "Email Pemohon (Penerima Info ACC)", type: "email", required: true, placeholder: "email_anda@gmail.com" },
    { id: "tentangSK", label: "Tentang SK", type: "textarea", required: true, placeholder: "Deskripsikan dengan singkat mengenai SK apa yang diajukan..." },
    { id: "linkBerkas", label: "Link Surat Permohonan / Berkas Dukung", type: "url", required: false, placeholder: "https://drive.google.com/..." }
  ];

  const defaultRtarSchema = [
    { id: "namaRayon", label: "Nama Rayon", type: "text", required: true, placeholder: "Contoh: PR PMII Penakluk" },
    { id: "email", label: "Email Pemohon (Penerima Info ACC)", type: "email", required: true, placeholder: "email_anda@gmail.com" },
    { id: "waktuPelaksanaan", label: "Rencana Tgl Pelaksanaan", type: "date", required: true, placeholder: "" },
    { id: "tempat", label: "Tempat Pelaksanaan", type: "text", required: true, placeholder: "Misal: Gedung NU Kota Malang" },
    { id: "linkBerkas", label: "Link Berkas / Proposal (G-Drive)", type: "url", required: false, placeholder: "https://drive.google.com/..." }
  ];

  const formatDate = (isoString) => {
    if(!isoString) return "-";
    const d = new Date(isoString);
    return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}`;
  };

  // ================= ACTION INBOX (ACC / TOLAK / DELETE) =================
  const handleUpdateStatus = async (item, collectionName, newStatus) => {
    if (!confirm(`Yakin mengubah status menjadi ${newStatus}?`)) return;
    setIsSendingEmail(true);
    try {
      await updateDoc(doc(db, collectionName, item.id), { status: newStatus });
      
      // Update State Local
      if(collectionName === "pengajuan_sk") setInboxSK(prev => prev.map(p => p.id === item.id ? { ...p, status: newStatus } : p));
      else setInboxRTAR(prev => prev.map(p => p.id === item.id ? { ...p, status: newStatus } : p));

      // Kirim Notifikasi Email
      if (item.email) {
        try {
          await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: item.email,
              namaBarang: `Pengajuan ${collectionName === "pengajuan_sk" ? "SK Kepengurusan" : "Kegiatan RTAR"}`,
              namaOrganisasi: item.dataForm?.namaOrganisasi || item.dataForm?.namaRayon || "Organisasi PMII",
              status: newStatus,
              waktuPinjam: formatDate(item.createdAt)
            })
          });
        } catch (e) { console.error("Gagal kirim email", e); }
      }
      alert(`Berhasil! Pengajuan telah ${newStatus}.`);
    } catch (err) { alert("Gagal update status: " + err.message); }
    finally { setIsSendingEmail(false); }
  };

  const handleDeleteInbox = async (id, collectionName) => {
    if (!confirm("Hapus data pengajuan ini permanen?")) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      if(collectionName === "pengajuan_sk") setInboxSK(prev => prev.filter(p => p.id !== id));
      else setInboxRTAR(prev => prev.filter(p => p.id !== id));
    } catch (err) { alert("Gagal menghapus: " + err.message); }
  };


  // ================= ACTION FORM BUILDER =================
  const handleOpenBuilder = (index = null) => {
    if(index !== null) {
       const currentSchema = activeTab === "form-sk" ? skSchema : rtarSchema;
       setFieldForm(currentSchema[index]);
       setEditingIndex(index);
    } else {
       setFieldForm({ id: "", label: "", type: "text", required: true, placeholder: "" });
       setEditingIndex(null);
    }
    setIsModalOpen(true);
  };

  const handleSaveField = async (e) => {
    e.preventDefault();
    
    // Auto-generate ID if empty (lowercase, no space)
    const fieldId = fieldForm.id || fieldForm.label.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newField = { ...fieldForm, id: fieldId };

    let updatedSchema = activeTab === "form-sk" ? [...skSchema] : [...rtarSchema];
    if (editingIndex !== null) updatedSchema[editingIndex] = newField;
    else updatedSchema.push(newField);

    // Save to State & Firebase
    if (activeTab === "form-sk") setSkSchema(updatedSchema);
    else setRtarSchema(updatedSchema);
    
    await setDoc(doc(db, "website_config", "pengajuan_schema"), {
       [activeTab === "form-sk" ? "sk" : "rtar"]: updatedSchema
    }, { merge: true });

    setIsModalOpen(false);
  };

  const handleDeleteField = async (indexToDelete) => {
    if(!confirm("Yakin menghapus pertanyaan ini dari Form?")) return;
    let updatedSchema = activeTab === "form-sk" ? skSchema.filter((_, i) => i !== indexToDelete) : rtarSchema.filter((_, i) => i !== indexToDelete);
    
    if (activeTab === "form-sk") setSkSchema(updatedSchema);
    else setRtarSchema(updatedSchema);

    await setDoc(doc(db, "website_config", "pengajuan_schema"), {
       [activeTab === "form-sk" ? "sk" : "rtar"]: updatedSchema
    }, { merge: true });
  };


  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="text-blue-600 animate-spin"/></div>;

  const currentInbox = activeTab === "inbox-sk" ? inboxSK : inboxRTAR;
  const currentSchema = activeTab === "form-sk" ? skSchema : rtarSchema;

  return (
    <div className="space-y-6 pb-12 w-full text-sm">
      {/* Header */}
      <div className="mb-6">
         <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">Pusat Layanan Pengajuan</h1>
         <p className="text-sm text-slate-500 mt-1">Kelola data permohonan SK, RTAR, dan kustomisasi formulir pertanyaan yang ditampilkan ke kader.</p>
      </div>

      {/* Tabs Navigasi */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-px">
        <button onClick={() => setActiveTab("inbox-sk")} className={`px-4 py-2.5 font-semibold text-sm border-b-2 flex items-center gap-2 ${activeTab === "inbox-sk" ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-slate-500 hover:bg-slate-50"}`}><Inbox size={16}/> Inbox SK</button>
        <button onClick={() => setActiveTab("inbox-rtar")} className={`px-4 py-2.5 font-semibold text-sm border-b-2 flex items-center gap-2 ${activeTab === "inbox-rtar" ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-slate-500 hover:bg-slate-50"}`}><Inbox size={16}/> Inbox RTAR</button>
        <button onClick={() => setActiveTab("form-sk")} className={`px-4 py-2.5 font-semibold text-sm border-b-2 flex items-center gap-2 ${activeTab === "form-sk" ? "border-purple-600 text-purple-600 bg-purple-50/50" : "border-transparent text-slate-500 hover:bg-slate-50"}`}><Settings size={16}/> Setting Form SK</button>
        <button onClick={() => setActiveTab("form-rtar")} className={`px-4 py-2.5 font-semibold text-sm border-b-2 flex items-center gap-2 ${activeTab === "form-rtar" ? "border-purple-600 text-purple-600 bg-purple-50/50" : "border-transparent text-slate-500 hover:bg-slate-50"}`}><Settings size={16}/> Setting Form RTAR</button>
      </div>

      {/* ================= AREA INBOX ================= */}
      {(activeTab === "inbox-sk" || activeTab === "inbox-rtar") && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap min-w-max">
               <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Tanggal Masuk</th>
                    <th className="py-3 px-4">Data Pemohon</th>
                    <th className="py-3 px-4">Detail Pengajuan (Custom Form)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {currentInbox.length === 0 ? (
                    <tr><td colSpan="6" className="py-12 text-center text-slate-400">Belum ada pengajuan masuk.</td></tr>
                  ) : (
                    currentInbox.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                         <td className="py-3 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                         <td className="py-3 px-4 font-mono text-xs">{formatDate(item.createdAt)}</td>
                         <td className="py-3 px-4">
                            <p className="font-bold text-slate-800">{item.dataForm?.namaOrganisasi || item.dataForm?.namaRayon || "Hamba Allah"}</p>
                            <p className="text-xs text-blue-500 mt-0.5">{item.email}</p>
                         </td>
                         
                         {/* Menampilkan isi dari form custom */}
                         <td className="py-3 px-4 max-w-[300px] whitespace-normal">
                           <div className="flex flex-col gap-1.5 text-xs">
                             {Object.entries(item.dataForm || {}).map(([key, val]) => (
                               <div key={key}>
                                 <span className="font-semibold text-slate-600 capitalize">{key}:</span> {val.startsWith('http') ? <a href={val} target="_blank" className="text-blue-500 underline ml-1">Buka Link</a> : <span className="ml-1 text-slate-500">{val}</span>}
                               </div>
                             ))}
                           </div>
                         </td>
                         
                         <td className="py-3 px-4 text-center">
                            {item.status === "Disetujui" ? (
                              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider flex items-center justify-center gap-1 w-max mx-auto"><CheckCircle size={12}/> Disetujui</span>
                            ) : item.status === "Ditolak" ? (
                              <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider flex items-center justify-center gap-1 w-max mx-auto"><XCircle size={12}/> Ditolak</span>
                            ) : (
                              <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider flex items-center justify-center gap-1 w-max mx-auto"><Loader2 size={12} className="animate-spin"/> Diproses</span>
                            )}
                         </td>
                         <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                               {item.status === "Diproses" && (
                                  <>
                                    <button disabled={isSendingEmail} onClick={() => handleUpdateStatus(item, activeTab === "inbox-sk" ? "pengajuan_sk" : "pengajuan_rtar", "Disetujui")} className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white p-1.5 rounded shadow-sm transition tooltip" title="Setujui (Kirim Email)"><CheckCircle size={14}/></button>
                                    <button disabled={isSendingEmail} onClick={() => handleUpdateStatus(item, activeTab === "inbox-sk" ? "pengajuan_sk" : "pengajuan_rtar", "Ditolak")} className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white p-1.5 rounded shadow-sm transition tooltip" title="Tolak (Kirim Email)"><XCircle size={14}/></button>
                                  </>
                               )}
                               <button onClick={() => handleDeleteInbox(item.id, activeTab === "inbox-sk" ? "pengajuan_sk" : "pengajuan_rtar")} className="bg-white border border-slate-300 text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded shadow-sm transition" title="Hapus Permanen"><Trash2 size={14}/></button>
                            </div>
                         </td>
                      </tr>
                    ))
                  )}
               </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= AREA FORM BUILDER ================= */}
      {(activeTab === "form-sk" || activeTab === "form-rtar") && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
           <div className="flex justify-between items-center mb-6">
              <div>
                 <h2 className="font-bold text-slate-800 text-lg">Konfigurasi Pertanyaan Formulir</h2>
                 <p className="text-xs text-slate-500">Sesuaikan data apa saja yang wajib diisi kader saat mengajukan permohonan.</p>
              </div>
              <button onClick={() => handleOpenBuilder()} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition">
                 <Plus size={16}/> Tambah Pertanyaan
              </button>
           </div>

           <div className="space-y-3">
             {currentSchema.map((field, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 border border-slate-200 rounded-md bg-slate-50 hover:border-purple-300 transition-colors">
                   <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                         {field.label} {field.required && <span className="text-red-500 text-xs">*Wajib</span>}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 font-mono">Tipe: {field.type} | ID: {field.id}</p>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => handleOpenBuilder(idx)} className="text-amber-500 hover:bg-amber-50 p-2 rounded border border-slate-200"><Edit size={14}/></button>
                      <button onClick={() => handleDeleteField(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded border border-slate-200"><Trash2 size={14}/></button>
                   </div>
                </div>
             ))}
           </div>
        </div>
      )}

      {/* MODAL FORM BUILDER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
               <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Settings size={18} className="text-purple-600"/> {editingIndex !== null ? "Edit Pertanyaan" : "Buat Pertanyaan Baru"}
               </h2>
               <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:bg-slate-200 rounded-md"><X size={18}/></button>
            </div>
            
            <form id="fieldForm" onSubmit={handleSaveField} className="p-6 space-y-4">
               <div>
                 <label className="text-xs font-semibold text-slate-700 block mb-1.5">Judul Pertanyaan (Label) <span className="text-red-500">*</span></label>
                 <input type="text" required value={fieldForm.label} onChange={e => setFieldForm({...fieldForm, label: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" placeholder="Contoh: Nama Kegiatan" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-semibold text-slate-700 block mb-1.5">Jenis Input</label>
                   <select value={fieldForm.type} onChange={e => setFieldForm({...fieldForm, type: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                      <option value="text">Teks Pendek (Text)</option>
                      <option value="textarea">Teks Panjang (Textarea)</option>
                      <option value="email">Email</option>
                      <option value="date">Tanggal (Date)</option>
                      <option value="number">Angka (Number)</option>
                      <option value="url">Link/URL (Drive dll)</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-slate-700 block mb-1.5">Wajib Diisi?</label>
                   <select value={fieldForm.required} onChange={e => setFieldForm({...fieldForm, required: e.target.value === 'true'})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                      <option value="true">Ya, Wajib</option>
                      <option value="false">Tidak (Opsional)</option>
                   </select>
                 </div>
               </div>
               <div>
                 <label className="text-xs font-semibold text-slate-700 block mb-1.5">Teks Petunjuk (Placeholder)</label>
                 <input type="text" value={fieldForm.placeholder} onChange={e => setFieldForm({...fieldForm, placeholder: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" placeholder="Misal: Masukkan nama lengkap disini..." />
               </div>
            </form>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-2">
               <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md">Batal</button>
               <button type="submit" form="fieldForm" className="text-sm font-medium px-6 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"><Save size={16}/> Simpan Pertanyaan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}