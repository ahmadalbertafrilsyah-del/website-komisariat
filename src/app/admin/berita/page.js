"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { Save, Link as LinkIcon, Newspaper, Plus, Trash2, Edit, Image as ImageIcon, Send, X, UploadCloud, Loader2, DownloadCloud, Eye, MessageSquare, FileText, ChevronLeft, Globe, Search, Users, Tag, MapPin } from "lucide-react";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill-new"), { 
  ssr: false,
  loading: () => <div className="p-10 text-center text-[13px] text-slate-500 animate-pulse border border-slate-200 rounded-md bg-slate-50">Memuat Workspace Editor...</div>
});
import "react-quill-new/dist/quill.snow.css"; 

const quillModules = {
  clipboard: { matchVisual: false },
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
    ['link', 'image', 'video'],
    [{ 'align': [] }, { 'color': [] }, { 'background': [] }],
    ['clean']
  ],
};

export default function AdminBerita() {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list"); 

  const [externalLink, setExternalLink] = useState("");
  const [newsList, setNewsList] = useState([]);
  
  // STATE FILTER & SEARCH
  const [activeTabKategori, setActiveTabKategori] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // EDITOR STATE UTAMA
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState("");
  const [kategori, setKategori] = useState("Berita Utama");
  const [imageUrl, setImageUrl] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Dipublikasikan"); 

  // EDITOR STATE TAMBAHAN (REDAKSI & TAGS)
  const [dateline, setDateline] = useState("");
  const [tags, setTags] = useState("");
  const [penulis, setPenulis] = useState("");
  const [fotoPenulis, setFotoPenulis] = useState("");
  const [editorName, setEditorName] = useState("");
  const [fotoEditor, setFotoEditor] = useState("");
  const [fotografer, setFotografer] = useState("");
  const [fotoFotografer, setFotoFotografer] = useState("");
  const [sumber, setSumber] = useState("");
  const [logoSumber, setLogoSumber] = useState("");
  
  const [uploadingField, setUploadingField] = useState(null); // Melacak field mana yang sedang upload
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const docRef = doc(db, "website_config", "berita_config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setExternalLink(docSnap.data().externalNewsLink || "");
      }

      const q = query(collection(db, "berita"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const beritaData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNewsList(beritaData);
    } catch (error) {
      console.error("Gagal memuat data:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleImageUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Harap pilih file berupa gambar (JPG/PNG)!");
      e.target.value = null;
      return;
    }

    setUploadingField(fieldName);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Gagal mengunggah gambar ke server");

      const data = await res.json();
      
      if (fieldName === "cover") setImageUrl(data.url);
      else if (fieldName === "penulis") setFotoPenulis(data.url);
      else if (fieldName === "editor") setFotoEditor(data.url);
      else if (fieldName === "fotografer") setFotoFotografer(data.url);
      else if (fieldName === "sumber") setLogoSumber(data.url);

    } catch (error) {
      console.error("Error Upload:", error);
      alert("Terjadi kesalahan saat mengunggah gambar.");
    } finally {
      setUploadingField(null);
      e.target.value = null; 
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, "website_config", "berita_config");
      await setDoc(docRef, { externalNewsLink: externalLink }, { merge: true });
      alert("Tautan Portal Eksternal Berhasil Disimpan!");
    } catch (error) {
      alert("Gagal menyimpan: " + error.message);
    }
  };

  const handleSaveArticle = async (e) => {
    e.preventDefault();
    if (!title || !content) {
      alert("Judul dan Isi Konten tidak boleh kosong!");
      return;
    }

    const cleanedContent = content
      .replace(/word-break:\s*[^;"]+;?/gi, '') 
      .replace(/overflow-wrap:\s*[^;"]+;?/gi, '') 
      .replace(/white-space:\s*[^;"]+;?/gi, '');

    const payload = {
      title, kategori, imageUrl, status,
      content: cleanedContent, 
      dateline, tags, 
      penulis, fotoPenulis, 
      editorName, fotoEditor, 
      fotografer, fotoFotografer, 
      sumber, logoSumber,
      updatedAt: serverTimestamp()
    };

    try {
      if (isEditing && editId) {
        const articleRef = doc(db, "berita", editId);
        await updateDoc(articleRef, payload);
        alert("Artikel berhasil diperbarui!");
      } else {
        payload.createdAt = serverTimestamp();
        payload.views = 0; 
        payload.commentsCount = 0; 
        await addDoc(collection(db, "berita"), payload);
        alert("Artikel baru berhasil disimpan!");
      }
      
      resetForm();
      setViewMode("list");
      fetchData(); 
    } catch (error) {
      alert("Gagal menyimpan artikel: " + error.message);
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus artikel ini secara permanen?")) return;
    try {
      await deleteDoc(doc(db, "berita", id));
      setNewsList(newsList.filter(item => item.id !== id));
    } catch (error) {
      alert("Gagal menghapus: " + error.message);
    }
  };

  const openEditorForNew = () => {
    resetForm();
    setViewMode("editor");
  };

  const handleEditClick = (article) => {
    setIsEditing(true);
    setEditId(article.id);
    setTitle(article.title || "");
    setKategori(article.kategori || "Berita Utama");
    setImageUrl(article.imageUrl || "");
    setContent(article.content || "");
    setStatus(article.status || "Dipublikasikan");
    setDateline(article.dateline || "");
    setTags(article.tags || "");
    setPenulis(article.penulis || ""); setFotoPenulis(article.fotoPenulis || "");
    setEditorName(article.editorName || ""); setFotoEditor(article.fotoEditor || "");
    setFotografer(article.fotografer || ""); setFotoFotografer(article.fotoFotografer || "");
    setSumber(article.sumber || ""); setLogoSumber(article.logoSumber || "");

    setViewMode("editor");
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const resetForm = () => {
    setIsEditing(false); setEditId(null); setTitle("");
    setKategori("Berita Utama"); setImageUrl(""); setContent(""); setStatus("Dipublikasikan");
    setDateline(""); setTags(""); setPenulis(""); setFotoPenulis(""); setEditorName(""); setFotoEditor(""); setFotografer(""); setFotoFotografer(""); setSumber(""); setLogoSumber("");
  };

  // FILTER & PENCARIAN DAFTAR BERITA
  const filteredNews = newsList.filter(item => {
    const matchKategori = activeTabKategori === "Semua" || item.kategori === activeTabKategori;
    const matchSearch = (item.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchKategori && matchSearch;
  });

  const inputStyle = "w-full px-3 py-2 border border-slate-300 rounded-md text-[13px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white placeholder:text-slate-400";
  const labelStyle = "text-[12px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider";

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="text-blue-600 animate-spin"/></div>;

  return (
    <div className="space-y-6 pb-12 w-full">
      
      {/* ================= MODE: DAFTAR ARTIKEL (DASHBOARD) ================= */}
      {viewMode === "list" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">Jurnalisme & Postingan</h1>
              <p className="text-[13px] text-slate-500 mt-1">Kelola artikel, redaksional, dan manajemen portal media.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <input type="file" accept=".xml,.atom" className="hidden" ref={importInputRef} />
              <button onClick={openEditorForNew} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-md transition flex items-center gap-2 shadow-sm text-[13px] shrink-0">
                <Plus size={16} /> Tulis Artikel Baru
              </button>
            </div>
          </div>

          {/* Panel Metrik */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col justify-center">
               <div className="flex items-center gap-2 text-slate-500 mb-1"><FileText size={16}/> <span className="text-[11px] font-bold uppercase tracking-wider">Total Tayang</span></div>
               <p className="text-2xl font-black text-slate-800">{newsList.filter(n => n.status !== "Draf").length} <span className="text-[12px] font-medium text-slate-400">Post</span></p>
            </div>
            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col justify-center">
               <div className="flex items-center gap-2 text-slate-500 mb-1"><Eye size={16}/> <span className="text-[11px] font-bold uppercase tracking-wider">Total Dilihat</span></div>
               <p className="text-2xl font-black text-slate-800">{newsList.reduce((acc, curr) => acc + (curr.views || 0), 0)} <span className="text-[12px] font-medium text-slate-400">Views</span></p>
            </div>
            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col justify-center relative group">
               <div className="flex items-center gap-2 text-slate-500 mb-1"><MessageSquare size={16}/> <span className="text-[11px] font-bold uppercase tracking-wider">Komentar Publik</span></div>
               <p className="text-2xl font-black text-slate-800">{newsList.reduce((acc, curr) => acc + (curr.commentsCount || 0), 0)} <span className="text-[12px] font-medium text-slate-400">Balasan</span></p>
            </div>
            
            {/* Setting Portal Eksternal Mini */}
            <form onSubmit={handleSaveConfig} className="bg-slate-50 p-4 rounded-md border border-slate-200 shadow-inner flex flex-col justify-center relative group">
               <div className="flex items-center justify-between mb-1">
                 <div className="flex items-center gap-2 text-slate-500"><Globe size={16}/> <span className="text-[11px] font-bold uppercase tracking-wider">Web Portal</span></div>
                 <button type="submit" className="text-[10px] bg-white border border-slate-300 px-2 py-0.5 rounded shadow-sm hover:bg-slate-100 font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">Simpan</button>
               </div>
               <input type="url" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} className="w-full bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none text-[12px] font-mono text-slate-700 py-1 placeholder:text-slate-400" placeholder="https://berita..."/>
            </form>
          </div>

          <div className="text-[11px] text-slate-400 mb-6 italic">* Catatan: Metrik Dilihat (Views) dan Komentar akan otomatis tersinkronisasi ketika ada pengunjung yang membaca artikel di halaman depan.</div>

          {/* FILTER KATEGORI & PENCARIAN */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
             <div className="flex overflow-x-auto gap-2 w-full md:w-auto scrollbar-none">
                {["Semua", "Berita Utama", "Opini Kader", "Kajian & Artikel", "Pengumuman"].map(kat => (
                  <button key={kat} onClick={() => setActiveTabKategori(kat)} className={`px-4 py-2 text-[12px] font-bold rounded-md whitespace-nowrap transition-colors ${activeTabKategori === kat ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    {kat}
                  </button>
                ))}
             </div>
             <div className="relative w-full md:w-72 shrink-0">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
               <input type="text" placeholder="Cari judul postingan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`${inputStyle} pl-9`} />
             </div>
          </div>

          {/* TABEL POSTINGAN DENGAN JARAK ANTAR BARIS (CARD ROWS) */}
          <div className="overflow-x-auto min-h-[40vh] pb-8">
            <table className="w-full text-left border-separate border-spacing-y-3 min-w-[900px]">
              <thead>
                <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4">
                  <th className="px-4 pb-2 w-12 text-center">No</th>
                  <th className="px-4 pb-2">Judul Postingan</th>
                  <th className="px-4 pb-2 w-36">Kategori</th>
                  <th className="px-4 pb-2 w-28 text-center">Statistik</th>
                  <th className="px-4 pb-2 w-32 text-center">Tanggal Tayang</th>
                  <th className="px-4 pb-2 w-28 text-center">Aksi (Edit)</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {filteredNews.length > 0 ? filteredNews.map((item, index) => {
                  const date = item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-";
                  const isDraft = item.status === "Draf";
                  
                  return (
                    <tr key={item.id} className="bg-white shadow-sm border border-slate-200 rounded-md transition-shadow hover:shadow-md">
                      <td className="py-4 px-4 text-center font-mono font-bold text-slate-400 rounded-l-md border-y border-l border-slate-200">{index + 1}</td>
                      <td className="py-4 px-4 border-y border-slate-200">
                        <div className="flex items-center gap-4">
                           {item.imageUrl ? (
                             <img src={item.imageUrl} alt="cover" className="w-12 h-12 rounded object-cover border border-slate-200 shrink-0" />
                           ) : (
                             <div className="w-12 h-12 rounded bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0"><ImageIcon size={18} className="text-slate-300"/></div>
                           )}
                           <div className="flex flex-col">
                             <span className={`font-bold text-[14px] truncate max-w-[350px] ${isDraft ? 'text-slate-500' : 'text-slate-800'}`}>
                               {item.title} {isDraft && <span className="font-bold text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded ml-2 uppercase tracking-wide">Draf</span>}
                             </span>
                           </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 border-y border-slate-200">
                        <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded text-[11px] font-bold tracking-wide">{item.kategori}</span>
                      </td>
                      <td className="py-4 px-4 text-center border-y border-slate-200">
                        <div className="flex items-center justify-center gap-3 text-[12px] font-mono font-bold text-slate-500">
                           <span className="flex items-center gap-1" title="Dilihat"><Eye size={14} className="text-blue-400"/> {item.views || 0}</span>
                           <span className="flex items-center gap-1" title="Komentar"><MessageSquare size={14} className="text-pink-400"/> {item.commentsCount || 0}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-slate-500 text-[12px] font-bold border-y border-slate-200">{date}</td>
                      <td className="py-4 px-4 text-center rounded-r-md border-y border-r border-slate-200">
                         <div className="flex items-center justify-center gap-2">
                           <button onClick={() => handleEditClick(item)} className="bg-slate-50 border border-slate-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 p-2 rounded transition shadow-sm" title="Edit Artikel"><Edit size={16}/></button>
                           <button onClick={() => handleDeleteArticle(item.id)} className="bg-slate-50 border border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200 p-2 rounded transition shadow-sm" title="Hapus Artikel"><Trash2 size={16}/></button>
                         </div>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan="6" className="py-16 text-center bg-white border border-slate-200 border-dashed rounded-md">
                       <div className="flex flex-col items-center justify-center text-slate-400">
                         <Search size={32} className="mb-3 opacity-30" />
                         <p className="font-bold text-slate-600 text-[13px]">Artikel tidak ditemukan.</p>
                         <p className="text-[12px] mt-1">Coba sesuaikan filter kategori atau kata kunci pencarian.</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODE: WORKSPACE EDITOR ================= */}
      {viewMode === "editor" && (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          
          <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
             <button onClick={() => setViewMode("list")} className="flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-800 transition">
               <ChevronLeft size={16}/> Kembali ke Daftar
             </button>
             <h2 className="text-[13px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100">
               {isEditing ? <><Edit size={16}/> Edit Mode</> : <><Plus size={16}/> Naskah Baru</>}
             </h2>
          </div>

          <form onSubmit={handleSaveArticle} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
             
             {/* KIRI: AREA PENGETIKAN UTAMA & REDAKSI */}
             <div className="lg:col-span-8 space-y-6">
                
                {/* Judul & Dateline */}
                <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm space-y-4">
                   <div>
                     <label className="text-[11px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider flex items-center gap-1"><MapPin size={14}/> Dateline / Lokasi (Opsional)</label>
                     <input type="text" value={dateline} onChange={(e) => setDateline(e.target.value)} className={`${inputStyle} font-bold text-slate-600`} placeholder="Misal: KOTA MALANG - "/>
                   </div>
                   <div>
                     <label className="text-[11px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Judul Utama Berita</label>
                     <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-2xl font-black text-slate-900 placeholder:text-slate-300 transition-shadow" placeholder="Masukkan judul yang menarik..."/>
                   </div>
                </div>

                {/* Editor Text */}
                <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all [&_.quill]:flex [&_.quill]:flex-col [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200 [&_.ql-toolbar]:bg-slate-50 [&_.ql-container]:border-none [&_.ql-container]:min-h-[500px] [&_.ql-container]:text-[15px] [&_.ql-container]:text-slate-800 [&_.ql-editor]:min-h-[500px] [&_.ql-editor]:p-6">
                  <ReactQuill theme="snow" value={content} onChange={setContent} modules={quillModules} placeholder="Mulai menulis reportase atau opini di sini..."/>
                </div>

                {/* SUSUNAN REDAKSI (KREDIT) */}
                <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden mt-6">
                   <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                     <Users size={16} className="text-slate-600" />
                     <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-widest">Susunan Redaksi (Kredit)</h3>
                   </div>
                   <div className="p-5 grid sm:grid-cols-2 gap-5">
                      {/* Penulis */}
                      <div className="border border-slate-200 rounded-md p-4 bg-slate-50/50">
                         <label className="text-[11px] font-bold text-slate-600 block mb-2">1. NAMA PENULIS</label>
                         <input type="text" value={penulis} onChange={e => setPenulis(e.target.value)} className={`${inputStyle} mb-3`} placeholder="Nama Penulis..."/>
                         <label className="text-[10px] font-bold text-slate-400 block mb-1.5">UPLOAD FOTO (OPSIONAL):</label>
                         <div className="flex items-center gap-2">
                           <label className={`cursor-pointer flex-grow text-center text-[11px] font-bold py-1.5 rounded border transition-colors ${uploadingField === 'penulis' ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-white hover:bg-slate-900'}`}>
                              {uploadingField === 'penulis' ? 'Loading...' : 'Choose File'}
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'penulis')} disabled={uploadingField !== null} />
                           </label>
                           <input type="text" value={fotoPenulis} readOnly className={`${inputStyle} w-2/3 font-mono text-[10px] py-1.5`} placeholder="No file chosen"/>
                         </div>
                      </div>
                      {/* Editor */}
                      <div className="border border-slate-200 rounded-md p-4 bg-slate-50/50">
                         <label className="text-[11px] font-bold text-slate-600 block mb-2">2. NAMA EDITOR</label>
                         <input type="text" value={editorName} onChange={e => setEditorName(e.target.value)} className={`${inputStyle} mb-3`} placeholder="Nama Editor..."/>
                         <label className="text-[10px] font-bold text-slate-400 block mb-1.5">UPLOAD FOTO (OPSIONAL):</label>
                         <div className="flex items-center gap-2">
                           <label className={`cursor-pointer flex-grow text-center text-[11px] font-bold py-1.5 rounded border transition-colors ${uploadingField === 'editor' ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-white hover:bg-slate-900'}`}>
                              {uploadingField === 'editor' ? 'Loading...' : 'Choose File'}
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'editor')} disabled={uploadingField !== null} />
                           </label>
                           <input type="text" value={fotoEditor} readOnly className={`${inputStyle} w-2/3 font-mono text-[10px] py-1.5`} placeholder="No file chosen"/>
                         </div>
                      </div>
                      {/* Fotografer */}
                      <div className="border border-slate-200 rounded-md p-4 bg-slate-50/50">
                         <label className="text-[11px] font-bold text-slate-600 block mb-2">3. FOTOGRAFER</label>
                         <input type="text" value={fotografer} onChange={e => setFotografer(e.target.value)} className={`${inputStyle} mb-3`} placeholder="Nama Fotografer..."/>
                         <label className="text-[10px] font-bold text-slate-400 block mb-1.5">UPLOAD FOTO (OPSIONAL):</label>
                         <div className="flex items-center gap-2">
                           <label className={`cursor-pointer flex-grow text-center text-[11px] font-bold py-1.5 rounded border transition-colors ${uploadingField === 'fotografer' ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-white hover:bg-slate-900'}`}>
                              {uploadingField === 'fotografer' ? 'Loading...' : 'Choose File'}
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'fotografer')} disabled={uploadingField !== null} />
                           </label>
                           <input type="text" value={fotoFotografer} readOnly className={`${inputStyle} w-2/3 font-mono text-[10px] py-1.5`} placeholder="No file chosen"/>
                         </div>
                      </div>
                      {/* Sumber */}
                      <div className="border border-slate-200 rounded-md p-4 bg-slate-50/50">
                         <label className="text-[11px] font-bold text-slate-600 block mb-2">4. INSTANSI / SUMBER</label>
                         <input type="text" value={sumber} onChange={e => setSumber(e.target.value)} className={`${inputStyle} mb-3`} placeholder="Sumber Berita..."/>
                         <label className="text-[10px] font-bold text-slate-400 block mb-1.5">UPLOAD LOGO (OPSIONAL):</label>
                         <div className="flex items-center gap-2">
                           <label className={`cursor-pointer flex-grow text-center text-[11px] font-bold py-1.5 rounded border transition-colors ${uploadingField === 'sumber' ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-white hover:bg-slate-900'}`}>
                              {uploadingField === 'sumber' ? 'Loading...' : 'Choose File'}
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'sumber')} disabled={uploadingField !== null} />
                           </label>
                           <input type="text" value={logoSumber} readOnly className={`${inputStyle} w-2/3 font-mono text-[10px] py-1.5`} placeholder="No file chosen"/>
                         </div>
                      </div>
                   </div>
                </div>

             </div>

             {/* KANAN: PANEL SETTING TAMBAHAN */}
             <div className="lg:col-span-4 space-y-6">
                
                {/* Panel Publish */}
                <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                   <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                     <h3 className="text-[13px] font-bold text-slate-800">Status & Visibilitas</h3>
                   </div>
                   <div className="p-4 space-y-4">
                     <div>
                       <label className={labelStyle}>Status Pos</label>
                       <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputStyle} bg-slate-50 cursor-pointer font-bold`}>
                         <option value="Dipublikasikan">✅ Terbit (Publik)</option>
                         <option value="Draf">📝 Draf (Sembunyikan)</option>
                       </select>
                     </div>
                     <div className="pt-2">
                       <button type="submit" disabled={uploadingField !== null} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 px-4 rounded-md transition flex items-center justify-center gap-2 shadow-sm text-[13px]">
                         {uploadingField !== null ? <Loader2 size={16} className="animate-spin"/> : <Send size={16} />}
                         {isEditing ? "Perbarui Pos" : "Simpan & Publikasikan"}
                       </button>
                     </div>
                   </div>
                </div>

                {/* Panel Kategori */}
                <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                   <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                     <h3 className="text-[13px] font-bold text-slate-800">Kategori Publikasi</h3>
                   </div>
                   <div className="p-4">
                     <select value={kategori} onChange={(e) => setKategori(e.target.value)} className={`${inputStyle} cursor-pointer`}>
                        <option value="Berita Utama">Berita Utama</option>
                        <option value="Opini Kader">Opini Kader</option>
                        <option value="Kajian & Artikel">Kajian & Artikel</option>
                        <option value="Pengumuman">Pengumuman</option>
                      </select>
                   </div>
                </div>

                {/* Panel Tags */}
                <div className="bg-[#fffdf2] rounded-md border border-[#fef08a] shadow-sm overflow-hidden">
                   <div className="px-4 py-3 border-b border-[#fef08a] bg-[#fef9c3]/50 flex items-center gap-2">
                     <Tag size={16} className="text-amber-500" />
                     <h3 className="text-[13px] font-bold text-slate-800">Kata Kunci (Tags)</h3>
                   </div>
                   <div className="p-4">
                     <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">Gunakan tanda koma ( , ) untuk memisahkan kata kunci agar berita ini mudah dicari pembaca.</p>
                     <textarea rows="3" value={tags} onChange={(e) => setTags(e.target.value)} className={`${inputStyle} resize-none bg-white border-amber-200 focus:border-amber-400 focus:ring-amber-400`} placeholder="PMII, Advokasi, Chondro Hebat..."/>
                   </div>
                </div>

                {/* Panel Gambar Cover */}
                <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                   <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                     <h3 className="text-[13px] font-bold text-slate-800">Gambar Cover Utama</h3>
                   </div>
                   <div className="p-4 space-y-3">
                     {imageUrl ? (
                        <div className="relative group rounded-md overflow-hidden border border-slate-200 shadow-sm">
                           <img src={imageUrl} alt="Cover Preview" className="w-full h-auto object-cover aspect-video" />
                           <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button type="button" onClick={() => setImageUrl("")} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg" title="Hapus Gambar"><Trash2 size={16}/></button>
                           </div>
                        </div>
                     ) : (
                        <div className="w-full aspect-video bg-slate-50 border border-slate-200 border-dashed rounded-md flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                           <ImageIcon size={32} className="mb-2 opacity-30"/>
                           <p className="text-[11px] font-medium">Belum ada cover</p>
                        </div>
                     )}
                     
                     <label className={`w-full cursor-pointer flex items-center justify-center gap-2 px-4 py-2 rounded-md text-[12px] font-bold transition-colors border ${uploadingField === 'cover' ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm'}`}>
                       {uploadingField === 'cover' ? <><Loader2 size={14} className="animate-spin" /> Mengunggah...</> : <><UploadCloud size={14} /> Pilih Gambar Cover</>}
                       <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'cover')} disabled={uploadingField !== null} />
                     </label>
                     <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={`${inputStyle} font-mono text-[10px]`} placeholder="Atau paste URL gambar..." readOnly={uploadingField === 'cover'} />
                   </div>
                </div>

             </div>
          </form>

        </div>
      )}

    </div>
  );
}