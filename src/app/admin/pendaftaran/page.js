"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, getDocs, addDoc, setDoc, deleteDoc, query, orderBy, serverTimestamp, writeBatch } from "firebase/firestore";
import * as XLSX from "xlsx";
import { ClipboardList, Users, Plus, Trash2, Edit, Save, Download, Settings, UploadCloud, Loader2, Image as ImageIcon, XCircle, Copy, Eye, X, Share2, ExternalLink, Link as LinkIcon, Search } from "lucide-react";

export default function AdminPendaftaran() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("formulir");

  const [formulirList, setFormulirList] = useState([]);
  const [pendaftarList, setPendaftarList] = useState([]);
  const [selectedFormFilter, setSelectedFormFilter] = useState("semua");

  // State Editor Form
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [editFormId, setEditFormId] = useState(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  
  // State Form Dinamis
  const [formData, setFormData] = useState({
    judul: "", kategori: "", deskripsi: "", status: "Buka", linkGrupWA: "", thumbnailUrl: "", 
    kuota: "", deadline: "", pesanSukses: "Terima kasih, pendaftaran Anda berhasil direkam!", customQuestions: [] 
  });

  // State Bulk Actions & Modal
  const [selectedPendaftar, setSelectedPendaftar] = useState([]);
  const [viewDetailModal, setViewDetailModal] = useState(null);

  // Styling Standar Enterprise
  const inputStandardClass = "w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm bg-white";
  const labelStandardClass = "text-xs font-semibold text-slate-700 block mb-1.5";

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const qForm = query(collection(db, "formulir_kaderisasi"), orderBy("createdAt", "desc"));
      const snapForm = await getDocs(qForm);
      setFormulirList(snapForm.docs.map(d => ({ id: d.id, ...d.data() })));

      const qPendaftar = query(collection(db, "data_pendaftar"), orderBy("createdAt", "desc"));
      const snapPendaftar = await getDocs(qPendaftar);
      setPendaftarList(snapPendaftar.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Gagal memuat data:", error);
    } finally {
      setLoading(false);
    }
  }

  // ================= FUNGSI CLOUDINARY UPLOAD =================
  const handleUploadThumbnail = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Harap pilih gambar!");

    setUploadingThumb(true);
    const formUpload = new FormData();
    formUpload.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formUpload });
      if (!res.ok) throw new Error("Upload gagal");
      const data = await res.json();
      setFormData(prev => ({ ...prev, thumbnailUrl: data.url }));
    } catch (error) {
      alert("Gagal mengunggah thumbnail.");
    } finally {
      setUploadingThumb(false);
      e.target.value = null;
    }
  };

  // ================= BUILDER PERTANYAAN CUSTOM =================
  const addCustomQuestion = (type) => {
    const uniqueId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    setFormData(prev => ({ ...prev, customQuestions: [...prev.customQuestions, { id: uniqueId, type, question: "", options: type === 'select' || type === 'radio' ? ["Opsi 1"] : [], required: true }] }));
  };

  const updateQuestion = (id, field, value) => {
    setFormData(prev => ({ ...prev, customQuestions: prev.customQuestions.map(q => q.id === id ? { ...q, [field]: value } : q) }));
  };

  const deleteQuestion = (id) => {
    setFormData(prev => ({ ...prev, customQuestions: prev.customQuestions.filter(q => q.id !== id) }));
  };

  const updateOption = (qId, optIndex, value) => {
    setFormData(prev => ({ ...prev, customQuestions: prev.customQuestions.map(q => { if (q.id === qId) { const newOpts = [...q.options]; newOpts[optIndex] = value; return { ...q, options: newOpts }; } return q; }) }));
  };

  const addOption = (qId) => {
    setFormData(prev => ({ ...prev, customQuestions: prev.customQuestions.map(q => { if (q.id === qId) return { ...q, options: [...q.options, `Opsi ${q.options.length + 1}`] }; return q; }) }));
  };

  const removeOption = (qId, optIndex) => {
    setFormData(prev => ({ ...prev, customQuestions: prev.customQuestions.map(q => { if (q.id === qId) return { ...q, options: q.options.filter((_, idx) => idx !== optIndex) }; return q; }) }));
  };

  // ================= HANDLER FORMULIR =================
  const handleSaveFormulir = async (e) => {
    e.preventDefault();
    if (!formData.judul) return alert("Judul formulir harus diisi!");
    const invalidQ = formData.customQuestions.find(q => !q.question.trim());
    if (invalidQ) return alert("Ada pertanyaan kustom yang belum diisi teks pertanyaannya!");

    const formSlug = formData.judul.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const finalData = { ...formData, slug: formSlug };

    try {
      if (isEditingForm && editFormId) {
        await setDoc(doc(db, "formulir_kaderisasi", editFormId), { ...finalData, updatedAt: serverTimestamp() }, { merge: true });
        alert("Formulir berhasil diperbarui!");
      } else {
        await addDoc(collection(db, "formulir_kaderisasi"), { ...finalData, createdAt: serverTimestamp() });
        alert("Formulir baru berhasil dibuat!");
      }
      resetFormState(); fetchData();
    } catch (error) { alert("Gagal menyimpan formulir: " + error.message); }
  };

  const handleEditClick = (form) => {
    setIsEditingForm(true); setEditFormId(form.id);
    setFormData({ ...form, customQuestions: form.customQuestions || [] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloneForm = (form) => {
    setIsEditingForm(false); setEditFormId(null);
    setFormData({ ...form, judul: `${form.judul} (Salinan)`, status: "Tutup" });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert("Formulir berhasil disalin ke editor! Silakan edit dan terbitkan.");
  };

  const resetFormState = () => {
    setIsEditingForm(false); setEditFormId(null);
    setFormData({ judul: "", kategori: "", deskripsi: "", status: "Buka", linkGrupWA: "", thumbnailUrl: "", kuota: "", deadline: "", pesanSukses: "Terima kasih, pendaftaran Anda berhasil direkam!", customQuestions: [] });
  };

  const handleDeleteFormulir = async (id) => {
    if (!confirm("Hapus formulir ini secara permanen?")) return;
    await deleteDoc(doc(db, "formulir_kaderisasi", id)); fetchData();
  };

  const toggleFormStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Buka" ? "Tutup" : "Buka";
    try { await setDoc(doc(db, "formulir_kaderisasi", id), { status: newStatus }, { merge: true }); fetchData(); } catch (error) { alert("Gagal mengubah status: " + error.message); }
  };

  const handleCopyLink = (form) => {
    const identifier = form.slug || form.id;
    const link = `${window.location.origin}/pendaftaran?form=${identifier}`;
    navigator.clipboard.writeText(link); alert(`Link pendaftaran (Untuk Peserta) disalin:\n${link}`);
  };

  const handleShareHasil = (form) => {
    const identifier = form.slug || form.id;
    const link = `${window.location.origin}/pendaftaran/hasil?form=${identifier}`;
    navigator.clipboard.writeText(link); alert(`Link Tabel Hasil Publik disalin!\nSiapapun yang punya link ini bisa melihat tabel hasil kelulusan.\n\nLink: ${link}`);
  };

  // ================= HANDLER PENDAFTAR =================
  const updateStatusPendaftar = async (id, statusBaru) => {
    await setDoc(doc(db, "data_pendaftar", id), { statusLulus: statusBaru }, { merge: true });
    setPendaftarList(pendaftarList.map(p => p.id === id ? { ...p, statusLulus: statusBaru } : p));
  };

  const handleDeletePendaftar = async (id) => {
    if (!confirm("Hapus data pendaftar ini?")) return;
    await deleteDoc(doc(db, "data_pendaftar", id));
    setPendaftarList(pendaftarList.filter(p => p.id !== id));
    setSelectedPendaftar(selectedPendaftar.filter(pid => pid !== id));
  };

  const handleSelectAll = (e) => { e.target.checked ? setSelectedPendaftar(filteredPendaftar.map(p => p.id)) : setSelectedPendaftar([]); };
  const handleSelectOne = (id) => { selectedPendaftar.includes(id) ? setSelectedPendaftar(selectedPendaftar.filter(pid => pid !== id)) : setSelectedPendaftar([...selectedPendaftar, id]); };

  const handleBulkAction = async (actionType) => {
    if (selectedPendaftar.length === 0) return alert("Pilih minimal 1 pendaftar!");
    if (!confirm(`Yakin ingin memproses ${selectedPendaftar.length} pendaftar?`)) return;

    try {
      const batch = writeBatch(db);
      selectedPendaftar.forEach(id => {
        const ref = doc(db, "data_pendaftar", id);
        actionType === 'delete' ? batch.delete(ref) : batch.update(ref, { statusLulus: actionType });
      });
      await batch.commit();
      if (actionType === 'delete') {
        setPendaftarList(pendaftarList.filter(p => !selectedPendaftar.includes(p.id)));
      } else {
        setPendaftarList(pendaftarList.map(p => selectedPendaftar.includes(p.id) ? { ...p, statusLulus: actionType } : p));
      }
      setSelectedPendaftar([]); alert("Aksi massal berhasil!");
    } catch (error) { alert("Terjadi kesalahan: " + error.message); }
  };

  const handleExportExcel = () => {
    const dataToExport = pendaftarList.filter(p => selectedFormFilter === "semua" || p.formId === selectedFormFilter);
    if (dataToExport.length === 0) return alert("Tidak ada data untuk diekspor!");

    const formattedData = dataToExport.map((p, index) => {
      let baseData = { "No": index + 1, "Tanggal Daftar": p.createdAt?.toDate ? p.createdAt.toDate().toLocaleString('id-ID') : "-", "Formulir": p.formJudul || "-", "Status": p.statusLulus || "Pending" };
      if (p.answers) {
        const originalForm = formulirList.find(f => f.id === p.formId);
        if (originalForm && originalForm.customQuestions) {
          originalForm.customQuestions.forEach(q => { if (p.answers[q.question] !== undefined) baseData[q.question] = p.answers[q.question]; });
          Object.keys(p.answers).forEach(qTitle => { if(baseData[qTitle] === undefined) baseData[qTitle] = p.answers[qTitle]; });
        } else { Object.keys(p.answers).forEach(qTitle => baseData[qTitle] = p.answers[qTitle]); }
      }
      return baseData;
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pendaftar");
    XLSX.writeFile(workbook, `Pendaftar_${Date.now()}.xlsx`);
  };

  const filteredPendaftar = pendaftarList.filter(p => selectedFormFilter === "semua" || p.formId === selectedFormFilter);

  const getOrderedAnswers = (pendaftar) => {
      if(!pendaftar.answers) return [];
      const originalForm = formulirList.find(f => f.id === pendaftar.formId);
      let ordered = [];
      const keysSudahDiproses = new Set();
      if (originalForm && originalForm.customQuestions) {
          originalForm.customQuestions.forEach(q => {
              if (pendaftar.answers[q.question] !== undefined) { ordered.push({ pertanyaan: q.question, jawaban: pendaftar.answers[q.question] }); keysSudahDiproses.add(q.question); }
          });
      }
      Object.entries(pendaftar.answers).forEach(([q, a]) => { if (!keysSudahDiproses.has(q)) ordered.push({ pertanyaan: q, jawaban: a }); });
      return ordered;
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="text-blue-600 animate-spin"/></div>;

  return (
    <div className="space-y-6 pb-12 w-full text-sm">
      
      {/* HEADER PANEL */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Kelola Pendaftaran
          </h1>
          <p className="text-sm text-slate-500 mt-1">Buat formulir kegiatan, pantau data pendaftar, dan kelola kelulusan.</p>
        </div>
      </div>

      {/* TABS PENGATURAN */}
      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setActiveTab("formulir")} className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === "formulir" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
          <Settings size={16} /> Builder Formulir
        </button>
        <button onClick={() => setActiveTab("pendaftar")} className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === "pendaftar" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
          <Users size={16} /> Database Pendaftar
          <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === "pendaftar" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>{pendaftarList.length}</span>
        </button>
      </div>

      {activeTab === "formulir" && (
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          
          {/* EDITOR FORMULIR */}
          <div className="bg-white p-5 md:p-6 rounded-lg border border-slate-200 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
               <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                 {isEditingForm ? <><Edit size={18} className="text-amber-500" /> Edit Formulir</> : <><Plus size={18} className="text-blue-600" /> Buat Formulir Baru</>}
               </h2>
               {isEditingForm && <button type="button" onClick={resetFormState} className="text-xs text-red-500 hover:text-red-700 font-semibold border border-red-200 bg-red-50 px-3 py-1.5 rounded-md">Batal Edit</button>}
            </div>

            <form onSubmit={handleSaveFormulir} className="space-y-6">
              <div className="bg-slate-50/50 p-5 rounded-lg border border-slate-200 space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className={labelStandardClass}>Judul Pendaftaran</label>
                    <input type="text" required value={formData.judul} onChange={(e) => setFormData({...formData, judul: e.target.value})} placeholder="Pendaftaran Pelatihan Jurnalistik..." className={inputStandardClass} />
                  </div>
                  <div>
                    <label className={labelStandardClass}>Kategori / Tingkatan</label>
                    <input type="text" required value={formData.kategori} onChange={(e) => setFormData({...formData, kategori: e.target.value})} placeholder="Seminar Nasional..." className={inputStandardClass} />
                  </div>
                </div>

                <div>
                  <label className={labelStandardClass}>Deskripsi / Persyaratan Khusus</label>
                  <textarea rows="2" value={formData.deskripsi} onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} placeholder="Jelaskan instruksi pengisian form ini..." className={inputStandardClass} />
                </div>

                <div className="grid md:grid-cols-2 gap-4 items-end">
                   <div>
                      <label className={labelStandardClass}>Thumbnail Formulir (Opsional)</label>
                      <div className="flex gap-2">
                        <input type="text" readOnly value={formData.thumbnailUrl} className={`${inputStandardClass} font-mono text-xs text-slate-500 bg-slate-50`} placeholder="Kosong..." />
                        <label className="bg-white hover:bg-slate-50 text-slate-600 cursor-pointer px-3 border border-slate-300 rounded-md flex items-center justify-center transition shadow-sm shrink-0">
                          {uploadingThumb ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                          <input type="file" accept="image/*" className="hidden" onChange={handleUploadThumbnail} disabled={uploadingThumb} />
                        </label>
                      </div>
                   </div>
                   <div>
                    <label className={labelStandardClass}>Link Grup WA (Bila Sukses)</label>
                    <input type="url" value={formData.linkGrupWA} onChange={(e) => setFormData({...formData, linkGrupWA: e.target.value})} placeholder="https://chat.whatsapp..." className={inputStandardClass} />
                   </div>
                </div>
              </div>

              <div className="bg-slate-50/50 p-5 rounded-lg border border-slate-200 space-y-4">
                 <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                   <Settings size={16} className="text-slate-600"/>
                   <span className="text-sm font-bold text-slate-800">Pengaturan Lanjutan</span>
                 </div>
                 <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelStandardClass}>Batas Waktu (Otomatis Tutup)</label>
                      <input type="datetime-local" value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} className={inputStandardClass} />
                    </div>
                    <div>
                      <label className={labelStandardClass}>Batas Kuota Peserta (Angka)</label>
                      <input type="number" value={formData.kuota} onChange={(e) => setFormData({...formData, kuota: e.target.value})} placeholder="Misal: 50" className={inputStandardClass} />
                    </div>
                 </div>
                 <div>
                    <label className={labelStandardClass}>Pesan Sukses (Muncul setelah Kirim)</label>
                    <textarea rows="2" value={formData.pesanSukses} onChange={(e) => setFormData({...formData, pesanSukses: e.target.value})} className={inputStandardClass} />
                 </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                 <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center text-sm font-bold text-slate-800">
                    Desain Pertanyaan Form
                 </div>
                 <div className="p-5 space-y-4 bg-white">
                    {formData.customQuestions.map((q, index) => (
                      <div key={q.id} className="bg-white p-4 border border-slate-200 rounded-md shadow-sm relative group">
                         <div className="flex flex-col md:flex-row justify-between gap-3 items-start md:items-center mb-3">
                            <input 
                              type="text" required value={q.question} onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                              placeholder={`Pertanyaan ${index + 1}...`} 
                              className="w-full md:w-2/3 p-2 border-b border-slate-300 focus:border-blue-500 outline-none font-semibold text-sm bg-transparent"
                            />
                            <select value={q.type} onChange={(e) => updateQuestion(q.id, 'type', e.target.value)} className="w-full md:w-auto p-2 text-sm bg-slate-50 border border-slate-300 rounded-md outline-none shrink-0 cursor-pointer">
                               <option value="text">Jawaban Singkat</option>
                               <option value="textarea">Paragraf Panjang</option>
                               <option value="select">Dropdown Pilihan</option>
                               <option value="radio">Pilihan Ganda</option>
                               <option value="file">Upload File</option>
                            </select>
                         </div>

                         {(q.type === 'select' || q.type === 'radio') && (
                           <div className="pl-2 space-y-2 mt-3 p-3 bg-slate-50 rounded-md border border-slate-200">
                             {q.options.map((opt, oIdx) => (
                               <div key={oIdx} className="flex items-center gap-2">
                                 <div className={`w-3 h-3 border border-slate-400 shrink-0 ${q.type === 'radio' ? 'rounded-full' : 'rounded-sm'}`}></div>
                                 <input type="text" required value={opt} onChange={(e) => updateOption(q.id, oIdx, e.target.value)} className="text-sm border-b border-slate-300 bg-transparent outline-none flex-grow pb-0.5 focus:border-blue-500" placeholder={`Teks Opsi ${oIdx + 1}`} />
                                 {q.options.length > 1 && <button type="button" onClick={() => removeOption(q.id, oIdx)} className="text-slate-400 hover:text-red-600"><XCircle size={16}/></button>}
                               </div>
                             ))}
                             <button type="button" onClick={() => addOption(q.id)} className="text-xs font-semibold text-blue-600 mt-2 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1.5 rounded-md w-max">+ Tambah Pilihan Lain</button>
                           </div>
                         )}

                         {q.type === 'file' && (
                           <div className="mt-2 text-xs text-slate-500 italic flex items-center gap-1"><ImageIcon size={14}/> Peserta akan diminta mengunggah file.</div>
                         )}

                         <div className="flex justify-end items-center gap-4 mt-4 pt-3 border-t border-slate-100">
                           <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer">
                             Wajib Diisi <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                           </label>
                           <div className="w-px h-4 bg-slate-300"></div>
                           <button type="button" onClick={() => deleteQuestion(q.id)} className="text-slate-500 hover:text-red-600 transition flex items-center gap-1 text-xs font-semibold"><Trash2 size={14}/> Hapus Baris</button>
                         </div>
                      </div>
                    ))}

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <span className="text-xs font-semibold text-slate-600 mr-2">Tambah Kolom:</span>
                      <button type="button" onClick={() => addCustomQuestion('text')} className="bg-white border border-slate-300 text-slate-700 text-xs font-medium px-3 py-2 rounded-md hover:bg-slate-50 transition shadow-sm">+ Teks</button>
                      <button type="button" onClick={() => addCustomQuestion('radio')} className="bg-white border border-slate-300 text-slate-700 text-xs font-medium px-3 py-2 rounded-md hover:bg-slate-50 transition shadow-sm">+ Pilihan</button>
                      <button type="button" onClick={() => addCustomQuestion('file')} className="bg-white border border-slate-300 text-slate-700 text-xs font-medium px-3 py-2 rounded-md hover:bg-slate-50 transition shadow-sm">+ Upload File</button>
                    </div>
                 </div>
              </div>

              <div className="flex justify-end pt-4">
                 <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-md transition flex items-center gap-2 shadow-sm w-full sm:w-auto justify-center">
                   <Save size={16} /> {isEditingForm ? "Simpan Perubahan" : "Terbitkan Formulir Baru"}
                 </button>
              </div>
            </form>
          </div>

          {/* LIST FORMULIR */}
          <div className="flex flex-col gap-4">
             <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-2 font-bold text-sm text-slate-800 shadow-sm">
                <ClipboardList size={18} className="text-blue-600"/> Daftar Formulir
             </div>
             {formulirList.length === 0 ? (
                <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-500 text-sm shadow-sm">Belum ada form yang dibuat.</div>
             ) : (
                formulirList.map((form) => (
                  <div key={form.id} className={`bg-white rounded-lg border transition-colors p-5 relative shadow-sm ${editFormId === form.id ? 'border-amber-400' : 'border-slate-200 hover:border-blue-300'}`}>
                    <div className="flex justify-between items-start mb-3">
                       <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${form.status === 'Buka' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {form.status === 'Buka' ? 'Dibuka' : 'Ditutup'}
                       </span>
                       <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md max-w-[120px] truncate">{form.kategori}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm leading-snug mb-2">{form.judul}</h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-4"><Users size={14}/> {pendaftarList.filter(p => p.formId === form.id).length} Data masuk</div>
                    
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                       <button onClick={() => handleCopyLink(form)} className="col-span-1 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold py-2 rounded-md transition border border-slate-300 flex items-center justify-center gap-1.5 shadow-sm">
                         <LinkIcon size={12}/> Link Daftar
                       </button>
                       {/* --- TOMBOL SHARE HASIL PUBLIK DI FORM BUILDER --- */}
                       <button onClick={() => handleShareHasil(form)} className="col-span-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold py-2 rounded-md transition border border-indigo-200 flex items-center justify-center gap-1.5 shadow-sm">
                         <Share2 size={12}/> Link Hasil
                       </button>
                       
                       <button onClick={() => toggleFormStatus(form.id, form.status)} className="col-span-1 bg-white hover:bg-slate-50 text-slate-600 text-[11px] font-semibold py-2 rounded-md transition border border-slate-300 shadow-sm">{form.status === 'Buka' ? 'Tutup Form' : 'Buka Form'}</button>
                       <button onClick={() => handleCloneForm(form)} className="col-span-1 bg-white hover:bg-slate-50 text-slate-600 text-[11px] font-semibold py-2 rounded-md transition border border-slate-300 flex items-center justify-center gap-1.5 shadow-sm"><Copy size={12}/> Duplikat</button>
                       
                       <button onClick={() => handleEditClick(form)} className="col-span-1 bg-white hover:bg-slate-50 text-amber-600 text-[11px] font-semibold py-2 rounded-md transition border border-slate-300 flex justify-center items-center gap-1.5 shadow-sm"><Edit size={12}/> Edit</button>
                       <button onClick={() => handleDeleteFormulir(form.id)} className="col-span-1 bg-white hover:bg-red-50 text-red-600 text-[11px] font-semibold py-2 rounded-md transition border border-slate-300 flex justify-center items-center gap-1.5 shadow-sm"><Trash2 size={12}/> Hapus</button>
                    </div>
                  </div>
                ))
             )}
          </div>

        </div>
      )}

      {activeTab === "pendaftar" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* STATISTIK PENDAFTAR */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
               <p className="text-xs font-semibold text-slate-500 mb-1">Total Pendaftar</p>
               <h3 className="text-2xl font-bold text-slate-800">{filteredPendaftar.length}</h3>
             </div>
             <div className="bg-white p-5 rounded-lg border border-emerald-200 shadow-sm">
               <p className="text-xs font-semibold text-emerald-600 mb-1">Diluluskan</p>
               <h3 className="text-2xl font-bold text-emerald-700">{filteredPendaftar.filter(p => p.statusLulus === 'Lulus').length}</h3>
             </div>
             <div className="bg-white p-5 rounded-lg border border-amber-200 shadow-sm">
               <p className="text-xs font-semibold text-amber-600 mb-1">Pending Seleksi</p>
               <h3 className="text-2xl font-bold text-amber-700">{filteredPendaftar.filter(p => !p.statusLulus || p.statusLulus === 'Pending').length}</h3>
             </div>
             <div className="bg-white p-5 rounded-lg border border-red-200 shadow-sm">
               <p className="text-xs font-semibold text-red-600 mb-1">Ditolak</p>
               <h3 className="text-2xl font-bold text-red-700">{filteredPendaftar.filter(p => p.statusLulus === 'Ditolak').length}</h3>
             </div>
          </div>

          {/* FILTER & AKSI TABEL */}
          <div className="bg-white p-4 md:p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-4">
             <div className="flex items-center gap-3">
               <span className="text-sm font-semibold text-slate-700 shrink-0">Filter Form:</span>
               <select value={selectedFormFilter} onChange={(e) => {setSelectedFormFilter(e.target.value); setSelectedPendaftar([]);}} className={inputStandardClass + " max-w-[250px] cursor-pointer"}>
                 <option value="semua">Semua Data Pendaftar</option>
                 {formulirList.map(f => (
                   <option key={`filter-${f.id}`} value={f.id}>{f.judul}</option>
                 ))}
               </select>
             </div>
             
             <div className="flex flex-wrap gap-3 items-center">
               {selectedPendaftar.length > 0 && (
                 <div className="flex bg-slate-50 p-1.5 rounded-md border border-slate-200 items-center gap-1.5">
                   <span className="text-[11px] font-semibold text-slate-600 px-2">{selectedPendaftar.length} Dipilih:</span>
                   <button onClick={() => handleBulkAction('Lulus')} className="text-[11px] font-semibold bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded shadow-sm transition">Luluskan</button>
                   <button onClick={() => handleBulkAction('Ditolak')} className="text-[11px] font-semibold bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 px-3 py-1.5 rounded shadow-sm transition">Tolak</button>
                   <button onClick={() => handleBulkAction('delete')} className="text-[11px] font-semibold bg-white border border-red-200 text-red-700 hover:bg-red-50 px-3 py-1.5 rounded shadow-sm transition">Hapus</button>
                 </div>
               )}

               {/* --- TOMBOL SHARE HASIL PUBLIK DI TABEL (MUNCUL JIKA FILTER DIPILIH) --- */}
               {selectedFormFilter !== "semua" && (
                 <button onClick={() => handleShareHasil(formulirList.find(f => f.id === selectedFormFilter))} className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-medium py-2 px-4 rounded-md transition flex items-center justify-center gap-2 shadow-sm text-sm">
                   <Share2 size={16} /> Salin Link Hasil
                 </button>
               )}
               
               <button onClick={handleExportExcel} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-2 px-4 rounded-md transition flex items-center justify-center gap-2 shadow-sm text-sm">
                  <Download size={16} /> Ekspor Excel
               </button>
             </div>
          </div>

          {/* TABEL DATA PENDAFTAR */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-4 w-12 text-center">
                      <input type="checkbox" onChange={handleSelectAll} checked={filteredPendaftar.length > 0 && selectedPendaftar.length === filteredPendaftar.length} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    </th>
                    <th className="py-4 px-4 w-48">Nama Pendaftar</th>
                    <th className="py-4 px-4 w-32 text-center">Tanggal</th>
                    <th className="py-4 px-4 w-32 text-center">Berkas / Isian</th>
                    <th className="py-4 px-4 w-28 text-center">Status</th>
                    <th className="py-4 px-4 w-16 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredPendaftar.length === 0 ? (
                    <tr><td colSpan="6" className="py-16 text-center text-slate-500 font-medium">Belum ada data pendaftar pada filter ini.</td></tr>
                  ) : (
                    filteredPendaftar.map((pendaftar) => {
                      const date = pendaftar.createdAt?.toDate ? pendaftar.createdAt.toDate().toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'}) : "-";
                      
                      const ansKeys = pendaftar.answers ? Object.keys(pendaftar.answers) : [];
                      let namaKey = ansKeys.find(k => k.toLowerCase().includes("nama lengkap"));
                      if (!namaKey) namaKey = ansKeys.find(k => { const l = k.toLowerCase(); return l.includes("nama") && !l.includes("orang tua") && !l.includes("panggilan"); });
                      if (!namaKey) namaKey = ansKeys.find(k => k.toLowerCase().includes("nama"));

                      const identifier = namaKey ? pendaftar.answers[namaKey] : (pendaftar.nama || (ansKeys.length > 0 ? pendaftar.answers[ansKeys[0]] : "Tanpa Nama"));
                      
                      return (
                        <tr key={`pendaftar-${pendaftar.id}`} className={`transition-colors hover:bg-slate-50 ${selectedPendaftar.includes(pendaftar.id) ? 'bg-blue-50/50' : ''}`}>
                          <td className="py-3 px-4 text-center">
                            <input type="checkbox" checked={selectedPendaftar.includes(pendaftar.id)} onChange={() => handleSelectOne(pendaftar.id)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900 text-sm truncate max-w-[200px]">{identifier}</p>
                            <p className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">{pendaftar.formJudul || "-"}</p>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500 text-center">{date}</td>
                          
                          <td className="py-3 px-4 text-center">
                             <button onClick={() => setViewDetailModal(pendaftar)} className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-blue-600 text-xs font-medium px-3 py-1.5 rounded-md transition-colors border border-slate-300 shadow-sm">
                               <Eye size={14}/> Detail
                             </button>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <select 
                              value={pendaftar.statusLulus || "Pending"}
                              onChange={(e) => updateStatusPendaftar(pendaftar.id, e.target.value)}
                              className={`text-xs font-semibold px-2.5 py-1.5 rounded-md outline-none cursor-pointer border shadow-sm ${pendaftar.statusLulus === 'Lulus' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : pendaftar.statusLulus === 'Ditolak' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Lulus">Diterima</option>
                              <option value="Ditolak">Ditolak</option>
                            </select>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button onClick={() => handleDeletePendaftar(pendaftar.id)} className="text-slate-400 hover:text-red-600 p-1.5 bg-white border border-slate-200 hover:border-red-200 rounded-md transition shadow-sm" title="Hapus Data"><Trash2 size={14}/></button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL PENDAFTAR */}
      {viewDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewDetailModal(null)}></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[85vh] border border-slate-200">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center shrink-0">
               <div>
                 <h3 className="font-bold text-sm text-slate-800">Detail Berkas Pendaftar</h3>
                 <p className="text-[11px] text-slate-500 font-medium">{viewDetailModal.formJudul}</p>
               </div>
               <button onClick={() => setViewDetailModal(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition"><X size={18}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5 bg-white">
               {viewDetailModal.answers ? (
                 getOrderedAnswers(viewDetailModal).map((item, idx) => {
                   const uniqueKey = `ans-${idx}-${item.pertanyaan.replace(/\s+/g, '-')}`;
                   return (
                     <div key={uniqueKey} className="border-b border-slate-100 pb-4">
                        <label className={labelStandardClass}>{item.pertanyaan}</label>
                        {typeof item.jawaban === 'string' && item.jawaban.startsWith('http') && (item.jawaban.includes('cloudinary') || item.pertanyaan.toLowerCase().includes('file')) ? (
                           <a href={item.jawaban} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-white text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-semibold transition border border-blue-200 shadow-sm"><ExternalLink size={14}/> Buka File Lampiran</a>
                        ) : (
                           <p className="text-sm font-medium text-slate-900 whitespace-pre-wrap bg-slate-50 p-3 rounded-md border border-slate-200">{item.jawaban || "-"}</p>
                        )}
                     </div>
                   );
                 })
               ) : (
                 <p className="text-slate-500 text-sm text-center py-6">Format data lama tidak dapat memuat detail kustom.</p>
               )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}