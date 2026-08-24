// app/admin/pengajuan/page.js
"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { Inbox, Settings, FileSignature, Users, Loader2, CheckCircle, XCircle, Trash2, Plus, Edit, X, Save, ArrowUp, ArrowDown, Link as LinkIcon } from "lucide-react";

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
  
  // Modal ACC SK (Input Link Rekomendasi)
  const [accModal, setAccModal] = useState({ isOpen: false, item: null, collection: "", linkRekomendasi: "" });
  
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const skSnap = await getDocs(collection(db, "pengajuan_sk"));
      setInboxSK(skSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));

      const rtarSnap = await getDocs(collection(db, "pengajuan_rtar"));
      setInboxRTAR(rtarSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));

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
    return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // ================= ACTION INBOX (ACC / TOLAK / DELETE) =================
  
  // Fungsi Khusus Membuka Modal ACC SK
  const openAccModal = (item, collectionName) => {
    setAccModal({ isOpen: true, item, collection: collectionName, linkRekomendasi: "" });
  };

  const handleUpdateStatus = async (item, collectionName, newStatus, customLinkRekomendasi = null) => {
    if (newStatus === "Ditolak" && !confirm(`Yakin menolak pengajuan ini? Notifikasi email akan dikirim.`)) return;
    if (newStatus === "Disetujui" && customLinkRekomendasi === null && !confirm(`Yakin menyetujui pengajuan ini?`)) return;
    
    setIsSendingEmail(true);
    try {
      const updateData = { status: newStatus };
      if (customLinkRekomendasi) updateData.linkRekomendasi = customLinkRekomendasi;

      await updateDoc(doc(db, collectionName, item.id), updateData);
      
      // Update State Local
      if(collectionName === "pengajuan_sk") {
        setInboxSK(prev => prev.map(p => p.id === item.id ? { ...p, ...updateData } : p));
      } else {
        setInboxRTAR(prev => prev.map(p => p.id === item.id ? { ...p, ...updateData } : p));
      }

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
              waktuPinjam: formatDate(item.createdAt),
              linkRekomendasi: customLinkRekomendasi || "" // Kirim link ke email
            })
          });
        } catch (e) { console.error("Gagal kirim email", e); }
      }
      
      alert(`Berhasil! Pengajuan telah ${newStatus}.`);
      setAccModal({ isOpen: false, item: null, collection: "", linkRekomendasi: "" }); // Tutup modal
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
    const fieldId = fieldForm.id || fieldForm.label.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newField = { ...fieldForm, id: fieldId };

    let updatedSchema = activeTab === "form-sk" ? [...skSchema] : [...rtarSchema];
    if (editingIndex !== null) updatedSchema[editingIndex] = newField;
    else updatedSchema.push(newField);

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

  const handleMoveField = async (index, direction) => {
    let updatedSchema = activeTab === "form-sk" ? [...skSchema] : [...rtarSchema];
    
    if (direction === -1 && index > 0) { 
      [updatedSchema[index - 1], updatedSchema[index]] = [updatedSchema[index], updatedSchema[index - 1]];
    } else if (direction === 1 && index < updatedSchema.length - 1) { 
      [updatedSchema[index], updatedSchema[index + 1]] = [updatedSchema[index + 1], updatedSchema[index]];
    } else {
      return;
    }

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
      <div className="mb-6">
         <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">Pusat Layanan Pengajuan</h1>
         <p className="text-sm text-slate-500 mt-1">Kelola data permohonan SK, RTAR, dan kustomisasi formulir pertanyaan yang ditampilkan ke kader.</p>
      </div>

      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-px scrollbar-none">
        <button onClick={() => setActiveTab("inbox-sk")} className={`px-4 py-2.5 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "inbox-sk" ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-slate-500 hover:bg-slate-50"}`}><Inbox size={16}/> Inbox SK</button>
        <button onClick={() => setActiveTab("inbox-rtar")} className={`px-4 py-2.5 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "inbox-rtar" ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-slate-500 hover:bg-slate-50"}`}><Inbox size={16}/> Inbox RTAR</button>
        <button onClick={() => setActiveTab("form-sk")} className={`px-4 py-2.5 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "form-sk" ? "border-purple-600 text-purple-600 bg-purple-50/50" : "border-transparent text-slate-500 hover:bg-slate-50"}`}><Settings size={16}/> Setting Form SK</button>
        <button onClick={() => setActiveTab("form-rtar")} className={`px-4 py-2.5 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "form-rtar" ? "border-purple-600 text-purple-600 bg-purple-50/50" : "border-transparent text-slate-500 hover:bg-slate-50"}`}><Settings size={16}/> Setting Form RTAR</button>
      </div>

      {/* ================= AREA INBOX ================= */}
      {(activeTab === "inbox-sk" || activeTab === "inbox-rtar") && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap min-w-max">
               <thead className="bg-slate-50 text-slate-600 text-[11px] md:text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 md:px-4 w-12 text-center">No</th>
                    <th className="py-3 px-3 md:px-4">Tanggal Masuk</th>
                    <th className="py-3 px-3 md:px-4">Data Pemohon</th>
                    <th className="py-3 px-3 md:px-4 min-w-[250px]">Detail Pengajuan (Custom Form)</th>
                    <th className="py-3 px-3 md:px-4 text-center">Status</th>
                    <th className="py-3 px-3 md:px-4 text-center">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 text-xs md:text-sm text-slate-700">
                  {currentInbox.length === 0 ? (
                    <tr><td colSpan="6" className="py-12 text-center text-slate-400">Belum ada pengajuan masuk.</td></tr>
                  ) : (
                    currentInbox.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                         <td className="py-3 px-3 md:px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                         <td className="py-3 px-3 md:px-4 font-mono text-[10px] md:text-xs">{formatDate(item.createdAt)}</td>
                         <td className="py-3 px-3 md:px-4 max-w-[200px] whitespace-normal">
                            <p className="font-bold text-slate-800 line-clamp-2">{item.dataForm?.namaOrganisasi || item.dataForm?.namaRayon || "Hamba Allah"}</p>
                            <p className="text-[10px] md:text-xs text-blue-500 mt-0.5 break-words">{item.email}</p>
                         </td>
                         
                         <td className="py-3 px-3 md:px-4 max-w-[300px] md:max-w-[350px] whitespace-normal">
                           <div className="flex flex-col gap-1.5 text-[11px] md:text-xs">
                             {Object.entries(item.dataForm || {}).map(([key, val]) => {
                               const isLink = typeof val === 'string' && val.startsWith('http');
                               return (
                                 <div key={key} className="border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                                   <span className="font-semibold text-slate-600 capitalize block mb-0.5">{key}:</span> 
                                   {isLink ? (
                                      <a href={val} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline inline-flex items-center gap-1 font-medium bg-blue-50 px-2 py-0.5 rounded break-all">
                                        <ExternalLink size={10} className="shrink-0"/> Buka Link/File
                                      </a>
                                   ) : (
                                      <span className="text-slate-500 break-words">{val || "-"}</span>
                                   )}
                                 </div>
                               );
                             })}
                           </div>
                         </td>
                         
                         <td className="py-3 px-3 md:px-4 text-center">
                            {item.status === "Disetujui" ? (
                              <div className="flex flex-col gap-1 items-center">
                                <span className="bg-emerald-100 text-emerald-700 text-[9px] md:text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider flex items-center justify-center gap-1"><CheckCircle size={12}/> Disetujui</span>
                                {item.linkRekomendasi && (
                                  <a href={item.linkRekomendasi} target="_blank" className="text-[9px] text-blue-600 underline whitespace-nowrap mt-1">Lihat SK Rekom</a>
                                )}
                              </div>
                            ) : item.status === "Ditolak" ? (
                              <span className="bg-red-100 text-red-700 text-[9px] md:text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider flex items-center justify-center gap-1 w-max mx-auto"><XCircle size={12}/> Ditolak</span>
                            ) : (
                              <span className="bg-amber-100 text-amber-700 text-[9px] md:text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider flex items-center justify-center gap-1 w-max mx-auto"><Loader2 size={12} className="animate-spin"/> Diproses</span>
                            )}
                         </td>
                         <td className="py-3 px-3 md:px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                               {item.status === "Diproses" && (
                                  <>
                                    {activeTab === "inbox-sk" ? (
                                        <button disabled={isSendingEmail} onClick={() => openAccModal(item, "pengajuan_sk")} className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white p-1.5 rounded shadow-sm transition tooltip" title="Setujui SK & Input Rekomendasi"><CheckCircle size={14}/></button>
                                    ) : (
                                        <button disabled={isSendingEmail} onClick={() => handleUpdateStatus(item, "pengajuan_rtar", "Disetujui")} className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white p-1.5 rounded shadow-sm transition tooltip" title="Setujui (Kirim Email)"><CheckCircle size={14}/></button>
                                    )}
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

      {/* ================= MODAL KHUSUS ACC SK (INPUT LINK REKOMENDASI) ================= */}
      {accModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center gap-3">
                 <div className="bg-emerald-500 p-1.5 rounded-full text-white"><CheckCircle size={18}/></div>
                 <h3 className="font-bold text-emerald-800 text-lg">Setujui & Terbitkan SK</h3>
              </div>
              <div className="p-6">
                 <p className="text-[13px] text-slate-600 mb-4 leading-relaxed">
                    Pengajuan dari <strong>{accModal.item.dataForm?.namaOrganisasi || 'Pemohon'}</strong> akan disetujui. <br/><br/>
                    Masukkan link Google Drive Surat Rekomendasi/Balasan yang telah dibuat agar terkirim otomatis ke email <b>{accModal.item.email}</b>.
                 </p>
                 <div className="mb-2 relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                    <input type="url" value={accModal.linkRekomendasi} onChange={e => setAccModal({...accModal, linkRekomendasi: e.target.value})} className="w-full border border-slate-300 pl-10 pr-4 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" placeholder="https://drive.google.com/..." required />
                 </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                 <button onClick={() => setAccModal({ isOpen: false, item: null, collection: "", linkRekomendasi: "" })} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold transition">Batal</button>
                 <button disabled={isSendingEmail || !accModal.linkRekomendasi} onClick={() => handleUpdateStatus(accModal.item, accModal.collection, "Disetujui", accModal.linkRekomendasi)} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition">
                    {isSendingEmail ? <><Loader2 size={16} className="animate-spin"/> Mengirim...</> : <><Send size={16}/> Setujui & Kirim Email</>}
                 </button>
              </div>
           </div>
        </div>
      )}


      {/* ================= AREA FORM BUILDER ================= */}
      {(activeTab === "form-sk" || activeTab === "form-rtar") && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 sm:p-6 w-full">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                 <h2 className="font-bold text-slate-800 text-lg">Konfigurasi Pertanyaan Formulir</h2>
                 <p className="text-xs text-slate-500">Sesuaikan data apa saja yang wajib diisi kader saat mengajukan permohonan.</p>
              </div>
              <button onClick={() => handleOpenBuilder()} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition shadow-sm">
                 <Plus size={16}/> Tambah Pertanyaan
              </button>
           </div>

           <div className="space-y-3 w-full">
             {currentSchema.map((field, idx) => (
                <div key={idx} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 p-4 border border-slate-200 rounded-md bg-slate-50 hover:border-purple-300 transition-colors w-full">
                   
                   <div className="flex-1 min-w-0 w-full pr-0 md:pr-4">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2 truncate whitespace-normal">
                         <span className="line-clamp-2">{field.label}</span> 
                         {field.required && <span className="text-red-600 text-[10px] sm:text-xs shrink-0 bg-red-100 px-1.5 py-0.5 rounded font-black">*Wajib</span>}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 font-mono bg-slate-200 w-max px-2 py-0.5 rounded">Tipe: {field.type} | ID: {field.id}</p>
                   </div>
                   
                   <div className="flex items-center gap-2 self-end md:self-auto shrink-0 mt-2 md:mt-0">
                      <div className="flex bg-white border border-slate-200 rounded overflow-hidden mr-1 shadow-sm">
                        <button onClick={() => handleMoveField(idx, -1)} disabled={idx === 0} className="p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white transition"><ArrowUp size={14}/></button>
                        <div className="w-px bg-slate-200"></div>
                        <button onClick={() => handleMoveField(idx, 1)} disabled={idx === currentSchema.length - 1} className="p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white transition"><ArrowDown size={14}/></button>
                      </div>
                      <button onClick={() => handleOpenBuilder(idx)} className="text-amber-600 hover:bg-amber-50 p-2 rounded border border-amber-200 bg-white transition shadow-sm"><Edit size={14}/></button>
                      <button onClick={() => handleDeleteField(idx)} className="text-red-600 hover:bg-red-50 p-2 rounded border border-red-200 bg-white transition shadow-sm"><Trash2 size={14}/></button>
                   </div>
                   
                </div>
             ))}
           </div>
        </div>
      )}

      {/* MODAL FORM BUILDER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 w-full">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
               <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Settings size={18} className="text-purple-600"/> {editingIndex !== null ? "Edit Pertanyaan" : "Buat Pertanyaan Baru"}
               </h2>
               <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:bg-slate-200 rounded-md"><X size={18}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-white flex-1">
               <form id="fieldForm" onSubmit={handleSaveField} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">Judul Pertanyaan (Label) <span className="text-red-500">*</span></label>
                    <input type="text" required value={fieldForm.label} onChange={e => setFieldForm({...fieldForm, label: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" placeholder="Contoh: Lampirkan Surat Rekomendasi" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">Jenis Input</label>
                      <select value={fieldForm.type} onChange={e => setFieldForm({...fieldForm, type: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                         <option value="text">Teks Pendek (Text)</option>
                         <option value="textarea">Teks Panjang (Textarea)</option>
                         <option value="email">Email</option>
                         <option value="date">Tanggal (Date)</option>
                         <option value="number">Angka (Number)</option>
                         <option value="url">Link Teks (G-Drive / Web)</option>
                         <option value="file">Upload Dokumen/Berkas (.pdf)</option>
                         <option value="image">Upload Gambar/Foto (.jpg, .png)</option>
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
                    <input type="text" value={fieldForm.placeholder} onChange={e => setFieldForm({...fieldForm, placeholder: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" placeholder="Misal: Masukkan data disini..." />
                  </div>
               </form>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-2 shrink-0">
               <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md">Batal</button>
               <button type="submit" form="fieldForm" className="text-sm font-medium px-6 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"><Save size={16}/> Simpan Pertanyaan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}