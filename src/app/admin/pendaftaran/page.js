"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, getDocs, addDoc, setDoc, deleteDoc, query, orderBy, serverTimestamp, writeBatch } from "firebase/firestore";
import * as XLSX from "xlsx";
import { ClipboardList, Users, Plus, Trash2, Edit, Save, Download, Settings, UploadCloud, Loader2, Image as ImageIcon, XCircle, Copy, Eye, X, Share2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    judul: "",
    kategori: "", 
    deskripsi: "",
    status: "Buka",
    linkGrupWA: "",
    thumbnailUrl: "", 
    kuota: "",
    deadline: "", 
    pesanSukses: "Terima kasih, pendaftaran Anda berhasil direkam!",
    customQuestions: [] 
  });

  // State Bulk Actions & Modal
  const [selectedPendaftar, setSelectedPendaftar] = useState([]);
  const [viewDetailModal, setViewDetailModal] = useState(null);

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
    setFormData(prev => ({
      ...prev,
      customQuestions: [
        ...prev.customQuestions, 
        { id: uniqueId, type, question: "", options: type === 'select' || type === 'radio' ? ["Opsi 1"] : [], required: true }
      ]
    }));
  };

  const updateQuestion = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.map(q => q.id === id ? { ...q, [field]: value } : q)
    }));
  };

  const deleteQuestion = (id) => {
    setFormData(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.filter(q => q.id !== id)
    }));
  };

  const updateOption = (qId, optIndex, value) => {
    setFormData(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.map(q => {
        if (q.id === qId) {
          const newOpts = [...q.options];
          newOpts[optIndex] = value;
          return { ...q, options: newOpts };
        }
        return q;
      })
    }));
  };

  const addOption = (qId) => {
    setFormData(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.map(q => {
        if (q.id === qId) return { ...q, options: [...q.options, `Opsi ${q.options.length + 1}`] };
        return q;
      })
    }));
  };

  const removeOption = (qId, optIndex) => {
    setFormData(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.map(q => {
        if (q.id === qId) return { ...q, options: q.options.filter((_, idx) => idx !== optIndex) };
        return q;
      })
    }));
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
      resetFormState();
      fetchData();
    } catch (error) {
      alert("Gagal menyimpan formulir: " + error.message);
    }
  };

  const handleEditClick = (form) => {
    setIsEditingForm(true);
    setEditFormId(form.id);
    setFormData({
      judul: form.judul || "", kategori: form.kategori || "", deskripsi: form.deskripsi || "",
      status: form.status || "Buka", linkGrupWA: form.linkGrupWA || "", thumbnailUrl: form.thumbnailUrl || "",
      kuota: form.kuota || "", deadline: form.deadline || "", pesanSukses: form.pesanSukses || "Terima kasih, pendaftaran Anda berhasil direkam!",
      customQuestions: form.customQuestions || []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloneForm = (form) => {
    setIsEditingForm(false);
    setEditFormId(null);
    setFormData({
      ...form,
      judul: `${form.judul} (Salinan)`,
      status: "Tutup", 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert("Formulir berhasil disalin ke editor! Silakan edit dan terbitkan.");
  };

  const resetFormState = () => {
    setIsEditingForm(false);
    setEditFormId(null);
    setFormData({
      judul: "", kategori: "", deskripsi: "", status: "Buka", linkGrupWA: "", thumbnailUrl: "", 
      kuota: "", deadline: "", pesanSukses: "Terima kasih, pendaftaran Anda berhasil direkam!", customQuestions: []
    });
  };

  const handleDeleteFormulir = async (id) => {
    if (!confirm("Hapus formulir ini secara permanen?")) return;
    await deleteDoc(doc(db, "formulir_kaderisasi", id));
    fetchData();
  };

  const toggleFormStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Buka" ? "Tutup" : "Buka";
    try {
      await setDoc(doc(db, "formulir_kaderisasi", id), { status: newStatus }, { merge: true });
      fetchData();
    } catch (error) {
      alert("Gagal mengubah status: " + error.message);
    }
  };

  const handleCopyLink = (form) => {
    const identifier = form.slug || form.id;
    const link = `${window.location.origin}/pendaftaran?form=${identifier}`;
    navigator.clipboard.writeText(link);
    alert(`Link pendaftaran berhasil disalin:\n${link}`);
  };

  // ================= HANDLER PENDAFTAR & BULK ACTIONS =================
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

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPendaftar(filteredPendaftar.map(p => p.id));
    } else {
      setSelectedPendaftar([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedPendaftar.includes(id)) setSelectedPendaftar(selectedPendaftar.filter(pid => pid !== id));
    else setSelectedPendaftar([...selectedPendaftar, id]);
  };

  const handleBulkAction = async (actionType) => {
    if (selectedPendaftar.length === 0) return alert("Pilih minimal 1 pendaftar!");
    if (!confirm(`Yakin ingin melakukan aksi ini pada ${selectedPendaftar.length} pendaftar?`)) return;

    try {
      const batch = writeBatch(db);
      selectedPendaftar.forEach(id => {
        const ref = doc(db, "data_pendaftar", id);
        if (actionType === 'delete') {
          batch.delete(ref);
        } else {
          batch.update(ref, { statusLulus: actionType });
        }
      });
      await batch.commit();

      if (actionType === 'delete') {
        setPendaftarList(pendaftarList.filter(p => !selectedPendaftar.includes(p.id)));
      } else {
        setPendaftarList(pendaftarList.map(p => selectedPendaftar.includes(p.id) ? { ...p, statusLulus: actionType } : p));
      }
      setSelectedPendaftar([]); 
      alert("Aksi massal berhasil diproses!");
    } catch (error) {
      alert("Terjadi kesalahan: " + error.message);
    }
  };

  // Ekspor Excel yang Diurutkan
  const handleExportExcel = () => {
    const dataToExport = pendaftarList.filter(p => selectedFormFilter === "semua" || p.formId === selectedFormFilter);
    if (dataToExport.length === 0) return alert("Tidak ada data untuk diekspor!");

    const formattedData = dataToExport.map((p, index) => {
      let baseData = {
        "No": index + 1,
        "Tanggal Daftar": p.createdAt?.toDate ? p.createdAt.toDate().toLocaleString('id-ID') : "-",
        "Formulir": p.formJudul || "-",
        "Status": p.statusLulus || "Pending",
      };

      if (p.answers) {
        // Cari form aslinya untuk mendapatkan urutan
        const originalForm = formulirList.find(f => f.id === p.formId);
        if (originalForm && originalForm.customQuestions) {
          // Masukkan jawaban sesuai urutan pertanyaan asli
          originalForm.customQuestions.forEach(q => {
             if (p.answers[q.question] !== undefined) {
                 baseData[q.question] = p.answers[q.question];
             }
          });
          // Tambahkan sisa jawaban yang mungkin form-nya sudah diganti tapi jawabannya masih nempel
          Object.keys(p.answers).forEach(questionTitle => {
            if(baseData[questionTitle] === undefined) {
                baseData[questionTitle] = p.answers[questionTitle];
            }
          });
        } else {
           // Jika form tidak ditemukan, gunakan urutan default
           Object.keys(p.answers).forEach(questionTitle => {
             baseData[questionTitle] = p.answers[questionTitle];
           });
        }
      }

      if (p.nama) baseData["Nama Lengkap"] = p.nama;
      if (p.wa) baseData["No WhatsApp"] = p.wa;
      
      return baseData;
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pendaftar");
    XLSX.writeFile(workbook, `Pendaftar_${Date.now()}.xlsx`);
  };

  const filteredPendaftar = pendaftarList.filter(p => selectedFormFilter === "semua" || p.formId === selectedFormFilter);

  // Helper untuk Merender Modal Pendaftar yang Berurutan
  const getOrderedAnswers = (pendaftar) => {
      if(!pendaftar.answers) return [];
      
      const originalForm = formulirList.find(f => f.id === pendaftar.formId);
      let ordered = [];
      const keysSudahDiproses = new Set();

      // 1. Masukkan yang ada di Form Asli (Sesuai Urutan)
      if (originalForm && originalForm.customQuestions) {
          originalForm.customQuestions.forEach(q => {
              if (pendaftar.answers[q.question] !== undefined) {
                  ordered.push({ pertanyaan: q.question, jawaban: pendaftar.answers[q.question] });
                  keysSudahDiproses.add(q.question);
              }
          });
      }

      // 2. Masukkan sisa jawaban (misal ada field yang dulunya ada tapi sekarang dihapus dari form)
      Object.entries(pendaftar.answers).forEach(([q, a]) => {
          if (!keysSudahDiproses.has(q)) {
              ordered.push({ pertanyaan: q, jawaban: a });
          }
      });

      return ordered;
  }

  if (loading) return <p className="text-slate-500 animate-pulse font-medium text-center pt-20">Memuat Sistem...</p>;

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto">
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList size={24} className="text-blue-600" /> Pusat Kelola Pendaftaran
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">Buat formulir kegiatan tanpa batas, pantau data, dan ekskusi kelulusan massal.</p>
        </div>
      </div>

      <div className="bg-slate-900 p-2 rounded-2xl flex overflow-x-auto whitespace-nowrap scrollbar-none gap-2">
        <button onClick={() => setActiveTab("formulir")} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "formulir" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}>
          <Settings size={16} /> Form Builder
        </button>
        <button onClick={() => setActiveTab("pendaftar")} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "pendaftar" ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}>
          <Users size={16} /> Database Pendaftar
          <span className="bg-slate-800 text-white px-2 py-0.5 rounded-md text-[10px] ml-1">{pendaftarList.length}</span>
        </button>
      </div>

      {/* ======================= TAB 1: FORM BUILDER AREA ======================= */}
      {activeTab === "formulir" && (
        <div className="grid lg:grid-cols-3 gap-6 animate-in fade-in duration-300 items-start">
          
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/60 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
               <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                 {isEditingForm ? <><Edit size={16} className="text-amber-500" /> Edit Form</> : <><Plus size={16} className="text-blue-600" /> Buat Form Baru</>}
               </h2>
               {isEditingForm && <button type="button" onClick={resetFormState} className="text-xs text-red-500 hover:underline font-bold">Batal Edit / Form Baru</button>}
            </div>

            <form onSubmit={handleSaveFormulir} className="space-y-6">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Judul Pendaftaran</label>
                    <input type="text" required value={formData.judul} onChange={(e) => setFormData({...formData, judul: e.target.value})} placeholder="Misal: Pendaftaran Pelatihan Jurnalistik..." className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold mt-1 outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Kategori / Tingkatan</label>
                    <input type="text" required value={formData.kategori} onChange={(e) => setFormData({...formData, kategori: e.target.value})} placeholder="Misal: Seminar Nasional" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm mt-1 outline-none focus:border-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Deskripsi / Persyaratan Khusus</label>
                  <textarea rows="2" value={formData.deskripsi} onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} placeholder="Jelaskan instruksi pengisian form ini..." className="w-full p-2.5 border border-slate-200 rounded-xl text-xs mt-1 outline-none focus:border-blue-500" />
                </div>

                <div className="grid md:grid-cols-2 gap-4 items-end">
                   <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><ImageIcon size={12}/> Thumbnail Formulir (Opsional)</label>
                      <div className="flex items-center gap-2 mt-1">
                        <label className={`cursor-pointer px-3 py-2 rounded-lg text-xs font-bold transition border shrink-0 ${uploadingThumb ? 'bg-slate-100 text-slate-400' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}>
                          {uploadingThumb ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                          <input type="file" accept="image/*" className="hidden" onChange={handleUploadThumbnail} disabled={uploadingThumb} />
                        </label>
                        <input type="text" readOnly value={formData.thumbnailUrl} className="w-full p-2.5 border border-slate-200 rounded-lg text-[10px] bg-slate-100 text-slate-500 font-mono" placeholder="Kosong..." />
                      </div>
                   </div>
                   <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Link Grup WA (Bila Sukses)</label>
                    <input type="url" value={formData.linkGrupWA} onChange={(e) => setFormData({...formData, linkGrupWA: e.target.value})} placeholder="https://chat.whatsapp..." className="w-full p-2.5 border border-slate-200 rounded-xl text-xs mt-1 font-mono outline-none" />
                   </div>
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                   <Settings size={16} className="text-blue-600"/>
                   <span className="text-sm font-bold text-blue-900">Pengaturan Lanjutan (Opsional)</span>
                 </div>
                 <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Batas Waktu (Deadline Otomatis Tutup)</label>
                      <input type="datetime-local" value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Batas Kuota Peserta (Angka)</label>
                      <input type="number" value={formData.kuota} onChange={(e) => setFormData({...formData, kuota: e.target.value})} placeholder="Misal: 50" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none" />
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pesan Sukses (Muncul setelah klik Kirim)</label>
                    <textarea rows="2" value={formData.pesanSukses} onChange={(e) => setFormData({...formData, pesanSukses: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none" />
                 </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                 <div className="bg-slate-900 text-white p-3 flex justify-between items-center text-sm font-bold">
                    <span>Desain Pertanyaan Form</span>
                 </div>
                 <div className="p-4 space-y-4 bg-slate-50/50">
                    <p className="text-xs font-semibold text-slate-500">Anda memiliki kebebasan 100% untuk menentukan field apa saja yang diisi pendaftar. Buat field seperti "Nama Lengkap", "NIM", atau Upload File Bukti Bayar.</p>

                    {formData.customQuestions.map((q, index) => (
                      <div key={q.id} className="bg-white p-4 border border-blue-200 rounded-xl shadow-sm relative group">
                         <div className="flex flex-col md:flex-row justify-between gap-3 items-start md:items-center mb-3">
                            <input 
                              type="text" required value={q.question} onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                              placeholder={`Judul Pertanyaan ${index + 1} (Misal: Nama Lengkap)...`} 
                              className="w-full md:w-2/3 p-2 border-b border-slate-200 focus:border-blue-500 outline-none font-bold text-sm bg-transparent"
                            />
                            <select value={q.type} onChange={(e) => updateQuestion(q.id, 'type', e.target.value)} className="w-full md:w-auto p-2 text-xs bg-slate-100 border border-slate-200 rounded-md outline-none shrink-0 cursor-pointer font-semibold">
                               <option value="text">Jawaban Singkat</option>
                               <option value="textarea">Paragraf Panjang</option>
                               <option value="select">Dropdown Pilihan</option>
                               <option value="radio">Pilihan Ganda (Satu Pilihan)</option>
                               <option value="file">Upload File / Gambar</option>
                            </select>
                         </div>

                         {(q.type === 'select' || q.type === 'radio') && (
                           <div className="pl-2 space-y-2 mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                             {q.options.map((opt, oIdx) => (
                               <div key={oIdx} className="flex items-center gap-2">
                                 <div className={`w-3 h-3 border border-slate-400 shrink-0 ${q.type === 'radio' ? 'rounded-full' : 'rounded-sm'}`}></div>
                                 <input type="text" required value={opt} onChange={(e) => updateOption(q.id, oIdx, e.target.value)} className="text-xs border-b border-slate-300 bg-transparent outline-none flex-grow pb-0.5 focus:border-blue-500" placeholder={`Teks Opsi ${oIdx + 1}`} />
                                 {q.options.length > 1 && <button type="button" onClick={() => removeOption(q.id, oIdx)} className="text-red-400 hover:text-red-600"><XCircle size={14}/></button>}
                               </div>
                             ))}
                             <button type="button" onClick={() => addOption(q.id)} className="text-[10px] font-bold text-blue-600 mt-2 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1 rounded w-max">+ Tambah Pilihan Lain</button>
                           </div>
                         )}

                         {q.type === 'file' && (
                           <div className="mt-2 text-xs text-slate-400 italic flex items-center gap-1"><ImageIcon size={12}/> Pengunjung nanti akan melihat tombol upload file di sini.</div>
                         )}

                         <div className="flex justify-end items-center gap-4 mt-4 pt-3 border-t border-slate-100">
                           <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 cursor-pointer">
                             Wajib Diisi <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)} className="rounded text-blue-600" />
                           </label>
                           <div className="w-px h-4 bg-slate-200"></div>
                           <button type="button" onClick={() => deleteQuestion(q.id)} className="text-slate-400 hover:text-red-600 transition flex items-center gap-1 text-[10px] font-bold"><Trash2 size={12}/> Hapus</button>
                         </div>
                      </div>
                    ))}

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase mr-2">Tambah Kolom:</span>
                      <button type="button" onClick={() => addCustomQuestion('text')} className="bg-white border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg hover:border-blue-400 hover:text-blue-600 transition">+ Teks</button>
                      <button type="button" onClick={() => addCustomQuestion('radio')} className="bg-white border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg hover:border-blue-400 hover:text-blue-600 transition">+ Pilihan</button>
                      <button type="button" onClick={() => addCustomQuestion('file')} className="bg-white border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg hover:border-blue-400 hover:text-blue-600 transition">+ Upload File</button>
                    </div>
                 </div>
              </div>

              <div className="flex justify-end pt-2">
                 <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl transition flex items-center gap-2 shadow-md w-full sm:w-auto justify-center">
                   {isEditingForm ? "Simpan Perubahan Formulir" : "Terbitkan Formulir Baru"} <Save size={18} />
                 </button>
              </div>
            </form>
          </div>

          {/* ======================= LIST FORMULIR ======================= */}
          <div className="flex flex-col gap-4">
             <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center gap-2 font-bold text-sm">
                <ClipboardList size={18}/> Form Aktif & Arsip
             </div>
             {formulirList.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-sm">Belum ada form.</div>
             ) : (
                formulirList.map((form) => (
                  <div key={form.id} className={`bg-white rounded-xl border-2 transition-colors p-4 relative ${editFormId === form.id ? 'border-amber-400 shadow-md' : 'border-slate-100 hover:border-blue-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                       <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${form.status === 'Buka' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {form.status === 'Buka' ? 'Dibuka' : 'Ditutup'}
                       </span>
                       <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase max-w-[120px] truncate">{form.kategori}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm leading-snug mb-2 pr-6">{form.judul}</h3>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-3"><Users size={12}/> {pendaftarList.filter(p => p.formId === form.id).length} Pendaftar masuk</div>
                    
                    <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                       <button onClick={() => handleCopyLink(form)} className="flex-1 min-w-[70px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold py-1.5 rounded-lg transition border border-indigo-100 flex items-center justify-center gap-1"><Share2 size={12}/> Copy Link</button>
                       <button onClick={() => toggleFormStatus(form.id, form.status)} className="flex-1 min-w-[70px] bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-bold py-1.5 rounded-lg transition border border-slate-200">{form.status === 'Buka' ? 'Tutup Form' : 'Buka Form'}</button>
                       <button onClick={() => handleCloneForm(form)} className="flex-1 min-w-[70px] bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-bold py-1.5 rounded-lg transition border border-blue-200 flex items-center justify-center gap-1"><Copy size={12}/> Duplikat</button>
                       <button onClick={() => handleEditClick(form)} className="flex-1 min-w-[70px] bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white text-[10px] font-bold py-1.5 rounded-lg transition border border-amber-100 flex justify-center items-center gap-1"><Edit size={12}/> Edit</button>
                       <button onClick={() => handleDeleteFormulir(form.id)} className="flex-1 min-w-[70px] bg-red-50 text-red-600 hover:bg-red-500 hover:text-white text-[10px] font-bold py-1.5 rounded-lg transition border border-red-100 flex justify-center items-center gap-1"><Trash2 size={12}/> Hapus</button>
                    </div>
                  </div>
                ))
             )}
          </div>

        </div>
      )}

      {/* ======================= TAB 2: DATA PENDAFTAR ======================= */}
      {activeTab === "pendaftar" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
               <p className="text-[10px] font-bold text-slate-400 uppercase">Total Pendaftar View</p>
               <h3 className="text-2xl font-black text-slate-800">{filteredPendaftar.length}</h3>
             </div>
             <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm">
               <p className="text-[10px] font-bold text-emerald-600 uppercase">Diluluskan</p>
               <h3 className="text-2xl font-black text-emerald-700">{filteredPendaftar.filter(p => p.statusLulus === 'Lulus').length}</h3>
             </div>
             <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 shadow-sm">
               <p className="text-[10px] font-bold text-amber-600 uppercase">Pending Seleksi</p>
               <h3 className="text-2xl font-black text-amber-700">{filteredPendaftar.filter(p => !p.statusLulus || p.statusLulus === 'Pending').length}</h3>
             </div>
             <div className="bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm">
               <p className="text-[10px] font-bold text-red-600 uppercase">Ditolak</p>
               <h3 className="text-2xl font-black text-red-700">{filteredPendaftar.filter(p => p.statusLulus === 'Ditolak').length}</h3>
             </div>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row justify-between gap-4">
             <div className="flex items-center gap-3">
               <span className="text-sm font-bold text-slate-700 shrink-0">Filter Formulir:</span>
               <select value={selectedFormFilter} onChange={(e) => {setSelectedFormFilter(e.target.value); setSelectedPendaftar([]);}} className="p-2 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer max-w-[200px] truncate">
                 <option value="semua">Semua Data Pendaftar</option>
                 {formulirList.map(f => (
                   <option key={`filter-${f.id}`} value={f.id}>{f.judul}</option>
                 ))}
               </select>
             </div>
             
             <div className="flex flex-wrap gap-2">
               {selectedPendaftar.length > 0 && (
                 <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 items-center">
                   <span className="text-[10px] font-bold text-slate-500 px-2">{selectedPendaftar.length} Dipilih:</span>
                   <button onClick={() => handleBulkAction('Lulus')} className="text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1.5 rounded transition">Luluskan</button>
                   <button onClick={() => handleBulkAction('Ditolak')} className="text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white px-2 py-1.5 rounded mx-1 transition">Tolak</button>
                   <button onClick={() => handleBulkAction('delete')} className="text-[10px] font-bold bg-red-500 hover:bg-red-600 text-white px-2 py-1.5 rounded transition">Hapus</button>
                 </div>
               )}
               <button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-sm text-sm whitespace-nowrap">
                  Ekspor Excel <Download size={16} />
               </button>
             </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-x-auto min-h-[400px]">
            <table className="w-full text-left whitespace-nowrap min-w-[900px]">
              <thead className="bg-[#064e3b] text-white text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">
                    <input type="checkbox" onChange={handleSelectAll} checked={filteredPendaftar.length > 0 && selectedPendaftar.length === filteredPendaftar.length} className="rounded" />
                  </th>
                  <th className="py-3 px-4 w-48 text-center">Nama Pendaftar</th>
                  <th className="py-3 px-4 w-32 text-center">Tanggal</th>
                  <th className="py-3 px-4 w-32 text-center">Berkas / Isian</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                  <th className="py-3 px-4 w-16 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPendaftar.length === 0 ? (
                  <tr><td colSpan="6" className="py-12 text-center text-slate-400 font-medium">Belum ada data pendaftar pada filter ini.</td></tr>
                ) : (
                  filteredPendaftar.map((pendaftar) => {
                    const date = pendaftar.createdAt?.toDate ? pendaftar.createdAt.toDate().toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'}) : "-";
                    
                    const ansKeys = pendaftar.answers ? Object.keys(pendaftar.answers) : [];
                    let namaKey = ansKeys.find(k => k.toLowerCase().includes("nama lengkap"));
                    
                    if (!namaKey) {
                        namaKey = ansKeys.find(k => {
                           const l = k.toLowerCase();
                           return l.includes("nama") && !l.includes("orang tua") && !l.includes("panggilan");
                        });
                    }
                    if (!namaKey) {
                        namaKey = ansKeys.find(k => k.toLowerCase().includes("nama"));
                    }

                    const identifier = namaKey ? pendaftar.answers[namaKey] : (pendaftar.nama || (ansKeys.length > 0 ? pendaftar.answers[ansKeys[0]] : "Tanpa Nama"));
                    
                    return (
                      <tr key={`pendaftar-${pendaftar.id}`} className={`transition-colors ${selectedPendaftar.includes(pendaftar.id) ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>
                        <td className="py-3 px-4 text-center">
                          <input type="checkbox" checked={selectedPendaftar.includes(pendaftar.id)} onChange={() => handleSelectOne(pendaftar.id)} className="rounded" />
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-blue-600 text-sm truncate w-48">{identifier}</p>
                          <p className="text-[10px] text-slate-400 truncate w-48 mt-0.5">{pendaftar.formJudul || "-"}</p>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-slate-500 text-center">{date}</td>
                        
                        <td className="py-3 px-4 text-center">
                           <button onClick={() => setViewDetailModal(pendaftar)} className="inline-flex items-center justify-center gap-1 bg-slate-100 hover:bg-blue-100 text-blue-700 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors border border-slate-200 hover:border-blue-200">
                             <Eye size={12}/> Data Lengkap
                           </button>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <select 
                            value={pendaftar.statusLulus || "Pending"}
                            onChange={(e) => updateStatusPendaftar(pendaftar.id, e.target.value)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-md outline-none cursor-pointer border ${pendaftar.statusLulus === 'Lulus' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : pendaftar.statusLulus === 'Ditolak' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Lulus">Lulus / Diterima</option>
                            <option value="Ditolak">Ditolak</option>
                          </select>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button onClick={() => handleDeletePendaftar(pendaftar.id)} className="text-red-400 hover:text-red-600 p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition" title="Hapus Data"><Trash2 size={14}/></button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL DETAIL PENDAFTAR (DIURUTKAN) ================= */}
      <AnimatePresence>
        {viewDetailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewDetailModal(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="bg-[#064e3b] text-white p-4 flex justify-between items-center shrink-0">
                 <div>
                   <h3 className="font-bold text-sm">Berkas & Data Pendaftar</h3>
                   <p className="text-[10px] text-emerald-200">{viewDetailModal.formJudul}</p>
                 </div>
                 <button onClick={() => setViewDetailModal(null)} className="p-1 hover:bg-white/20 rounded-md transition"><X size={18}/></button>
              </div>
              
              <div className="p-5 overflow-y-auto space-y-4">
                 {/* PERBAIKAN: Render Data yang Sudah Diurutkan */}
                 {viewDetailModal.answers ? (
                   getOrderedAnswers(viewDetailModal).map((item, idx) => {
                     const uniqueKey = `ans-${idx}-${item.pertanyaan.replace(/\s+/g, '-')}`;
                     return (
                       <div key={uniqueKey} className="border-b border-slate-100 pb-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{item.pertanyaan}</p>
                          {typeof item.jawaban === 'string' && item.jawaban.startsWith('http') && (item.jawaban.includes('cloudinary') || item.pertanyaan.toLowerCase().includes('file')) ? (
                             <a href={item.jawaban} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition border border-blue-100"><ExternalLink size={14}/> Buka File Lampiran</a>
                          ) : (
                             <p className="text-sm font-semibold text-slate-800 whitespace-pre-wrap">{item.jawaban || "-"}</p>
                          )}
                       </div>
                     );
                   })
                 ) : (
                   <p className="text-slate-400 text-sm text-center">Data kustom tidak ditemukan (Kemungkinan format data lama).</p>
                 )}

                 {viewDetailModal.nama && !viewDetailModal.answers && (
                   <div className="space-y-3 border border-amber-200 bg-amber-50 p-4 rounded-xl">
                      <p className="text-xs font-bold text-amber-700 mb-2">Membaca Data Legacy (Versi Lama)</p>
                      <p className="text-sm font-bold text-slate-800">Nama: {viewDetailModal.nama}</p>
                      <p className="text-sm text-slate-600">NIM: {viewDetailModal.nim}</p>
                      <p className="text-sm text-slate-600">Fakultas: {viewDetailModal.fakultas}</p>
                      <p className="text-sm text-slate-600">WA: {viewDetailModal.wa}</p>
                   </div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}