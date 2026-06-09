"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { Save, Link as LinkIcon, Newspaper, Plus, Trash2, Edit, Image as ImageIcon, Send, X, UploadCloud, Loader2, DownloadCloud, Eye, MessageSquare, FileText, ChevronLeft, Globe, BarChart2 } from "lucide-react";
import dynamic from "next/dynamic";

// IMPORT REACT QUILL DINAMIS DENGAN FALLBACK LOADING
const ReactQuill = dynamic(() => import("react-quill-new"), { 
  ssr: false,
  loading: () => <div className="p-10 text-center text-sm text-slate-500 animate-pulse border border-slate-200 rounded-lg bg-slate-50">Memuat Workspace Editor...</div>
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
  
  // VIEW STATE: 'list' untuk dashboard, 'editor' untuk nulis
  const [viewMode, setViewMode] = useState("list"); 

  const [externalLink, setExternalLink] = useState("");
  const [newsList, setNewsList] = useState([]);
  
  // EDITOR STATE
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState("");
  const [kategori, setKategori] = useState("Berita Utama");
  const [excerpt, setExcerpt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Dipublikasikan"); // Dipublikasikan atau Draf
  
  const [isUploading, setIsUploading] = useState(false);
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Harap pilih file berupa gambar (JPG, PNG, dll)!");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Gagal mengunggah gambar ke server");

      const data = await res.json();
      setImageUrl(data.url); 
    } catch (error) {
      console.error("Error Upload:", error);
      alert("Terjadi kesalahan saat mengunggah gambar. Pastikan API Cloudinary sudah benar.");
    } finally {
      setIsUploading(false);
      e.target.value = null; 
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, "website_config", "berita_config");
      await setDoc(docRef, { externalNewsLink: externalLink }, { merge: true });
      alert("Pengaturan Tautan Portal Eksternal Berhasil Disimpan!");
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
      .replace(/white-space:\s*[^;"]+;?/gi, '') 
      .replace(/&shy;/gi, '') 
      .replace(/[\u200B-\u200D\uFEFF]/g, '');

    const payload = {
      title, kategori, excerpt, imageUrl, status,
      content: cleanedContent, 
      updatedAt: serverTimestamp()
    };

    try {
      if (isEditing && editId) {
        const articleRef = doc(db, "berita", editId);
        await updateDoc(articleRef, payload);
        alert("Artikel berhasil diperbarui!");
      } else {
        payload.createdAt = serverTimestamp();
        payload.views = 0; // Default views
        payload.commentsCount = 0; // Default comments
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
    setTitle(article.title);
    setKategori(article.kategori);
    setExcerpt(article.excerpt);
    setImageUrl(article.imageUrl || "");
    setContent(article.content);
    setStatus(article.status || "Dipublikasikan");
    setViewMode("editor");
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const resetForm = () => {
    setIsEditing(false); setEditId(null); setTitle("");
    setKategori("Berita Utama"); setExcerpt(""); setImageUrl(""); setContent(""); setStatus("Dipublikasikan");
  };

  // ================= FUNGSI IMPORT BLOGGER =================
  const handleImportBlogger = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");

        const getNodes = (parent, tag) => {
           const nodes = parent.getElementsByTagName(tag);
           return nodes.length > 0 ? nodes : parent.getElementsByTagNameNS("*", tag);
        };

        const entries = getNodes(xmlDoc, "entry");
        let importedCount = 0;

        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          const categories = getNodes(entry, "category");
          let isPost = false;
          for (let j = 0; j < categories.length; j++) {
            const term = categories[j].getAttribute("term") || "";
            if (term.includes("post")) {
              isPost = true;
              break;
            }
          }
          if (!isPost) continue;

          const titleNodes = getNodes(entry, "title");
          const postTitle = titleNodes[0]?.textContent || "Tanpa Judul";
          
          const contentNodes = getNodes(entry, "content");
          const postContent = contentNodes[0]?.textContent || "";

          if (!postContent.trim()) continue;

          const imgMatch = postContent.match(/<img[^>]+src="([^">]+)"/i);
          const extractedImageUrl = imgMatch ? imgMatch[1] : "";

          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = postContent;
          const plainText = tempDiv.textContent || tempDiv.innerText || "";
          const generatedExcerpt = plainText.substring(0, 150).trim() + "...";

          await addDoc(collection(db, "berita"), {
            title: postTitle,
            kategori: "Berita Utama",
            excerpt: generatedExcerpt,
            imageUrl: extractedImageUrl,
            content: postContent,
            status: "Dipublikasikan",
            views: 0,
            commentsCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          importedCount++;
        }

        if (importedCount === 0) {
            alert("Sistem tidak menemukan format artikel. Apakah file XML ini kosong?");
        } else {
            alert(`Berhasil mengimpor ${importedCount} artikel dari Blogger!`);
            fetchData(); 
        }
      } catch (error) {
        console.error("Error parsing Blogger file:", error);
        alert("Gagal membaca file. Pastikan file berformat .xml dari Blogger.");
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm";
  const labelClass = "text-xs font-bold text-slate-600 block mb-1.5 uppercase tracking-wider";

  // Perhitungan Metrik Global
  const totalViews = newsList.reduce((acc, curr) => acc + (curr.views || 0), 0);
  const totalComments = newsList.reduce((acc, curr) => acc + (curr.commentsCount || 0), 0);
  const totalPublished = newsList.filter(n => n.status !== "Draf").length;

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="text-blue-600 animate-spin"/></div>;

  return (
    <div className="space-y-6 pb-12 w-full max-w-6xl mx-auto">
      
      {/* ================= MODE: DAFTAR ARTIKEL (DASHBOARD) ================= */}
      {viewMode === "list" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                 Publikasi & Postingan
              </h1>
              <p className="text-sm text-slate-500 mt-1">Kelola artikel, analisis performa konten, dan manajemen portal media.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <input type="file" accept=".xml,.atom" className="hidden" ref={importInputRef} onChange={handleImportBlogger} />
              <button onClick={() => importInputRef.current.click()} disabled={isImporting} className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2 rounded-md flex items-center gap-2 shadow-sm font-medium text-sm transition shrink-0 disabled:opacity-50">
                {isImporting ? <Loader2 size={16} className="animate-spin"/> : <DownloadCloud size={16} />}
                <span className="hidden sm:inline">{isImporting ? "Memproses..." : "Import Blogger (.xml)"}</span>
              </button>
              <button onClick={openEditorForNew} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition flex items-center gap-2 shadow-sm text-sm shrink-0">
                <Plus size={16} /> Tulis Artikel Baru
              </button>
            </div>
          </div>

          {/* Panel Metrik ala WordPress/Blogger Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center">
               <div className="flex items-center gap-2 text-slate-500 mb-1"><FileText size={16}/> <span className="text-xs font-semibold uppercase tracking-wider">Total Tayang</span></div>
               <p className="text-2xl font-black text-slate-800">{totalPublished} <span className="text-sm font-medium text-slate-400">Post</span></p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center">
               <div className="flex items-center gap-2 text-slate-500 mb-1"><Eye size={16}/> <span className="text-xs font-semibold uppercase tracking-wider">Total Dilihat</span></div>
               <p className="text-2xl font-black text-slate-800">{totalViews} <span className="text-sm font-medium text-slate-400">Views</span></p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center">
               <div className="flex items-center gap-2 text-slate-500 mb-1"><MessageSquare size={16}/> <span className="text-xs font-semibold uppercase tracking-wider">Komentar</span></div>
               <p className="text-2xl font-black text-slate-800">{totalComments} <span className="text-sm font-medium text-slate-400">Balasan</span></p>
            </div>
            
            {/* Setting Portal Eksternal Mini */}
            <form onSubmit={handleSaveConfig} className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-inner flex flex-col justify-center relative group">
               <div className="flex items-center justify-between mb-1">
                 <div className="flex items-center gap-2 text-slate-500"><Globe size={16}/> <span className="text-xs font-semibold uppercase tracking-wider">Web Portal</span></div>
                 <button type="submit" className="text-[10px] bg-white border border-slate-300 px-2 py-0.5 rounded shadow-sm hover:bg-slate-100 font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">Simpan</button>
               </div>
               <input type="url" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} className="w-full bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none text-xs font-mono text-slate-700 py-1 placeholder:text-slate-400" placeholder="https://berita..."/>
            </form>
          </div>

          {/* TABEL POSTINGAN */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
             <div className="overflow-x-auto max-h-[60vh] hide-scrollbar relative">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                  <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-12 text-center">No</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Judul Postingan</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-32">Kategori</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24 text-center">Statistik</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-28 text-center">Tanggal</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm bg-white">
                    {newsList.length > 0 ? newsList.map((item, index) => {
                      const date = item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-";
                      const isDraft = item.status === "Draf";
                      
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="py-3 px-4 text-center font-mono font-medium text-slate-400 text-xs">{index + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                               {item.imageUrl ? (
                                 <img src={item.imageUrl} alt="cover" className="w-10 h-10 rounded-md object-cover border border-slate-200 shrink-0 shadow-sm" />
                               ) : (
                                 <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0"><ImageIcon size={16} className="text-slate-400"/></div>
                               )}
                               <div className="flex flex-col">
                                 <span className={`font-semibold truncate max-w-[350px] ${isDraft ? 'text-slate-500' : 'text-slate-800'}`}>
                                   {item.title} {isDraft && <span className="font-bold text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded ml-2 uppercase tracking-wide">Draf</span>}
                                 </span>
                                 <span className="text-[10px] text-slate-400 font-mono mt-0.5 line-clamp-1">{item.excerpt}</span>
                               </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-600 text-xs font-medium">{item.kategori}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-3 text-xs font-mono font-medium text-slate-500">
                               <span className="flex items-center gap-1" title="Dilihat"><Eye size={14} className="text-slate-400"/> {item.views || 0}</span>
                               <span className="flex items-center gap-1" title="Komentar"><MessageSquare size={14} className="text-slate-400"/> {item.commentsCount || 0}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500 text-xs font-medium">{date}</td>
                          <td className="py-3 px-4 text-center">
                             <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => handleEditClick(item)} className="bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 p-1.5 rounded-md shadow-sm transition" title="Edit Artikel"><Edit size={14}/></button>
                               <button onClick={() => handleDeleteArticle(item.id)} className="bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-300 p-1.5 rounded-md shadow-sm transition" title="Hapus Artikel"><Trash2 size={14}/></button>
                             </div>
                          </td>
                        </tr>
                      )
                    }) : (
                      <tr>
                        <td colSpan="6" className="py-16 text-center">
                           <div className="flex flex-col items-center justify-center text-slate-400">
                             <Newspaper size={48} className="mb-4 opacity-20" />
                             <p className="font-medium text-slate-600 text-base">Belum ada pos.</p>
                             <p className="text-sm mt-1">Gunakan tombol "Tulis Artikel Baru" atau import dari Blogger.</p>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {/* ================= MODE: WORKSPACE EDITOR ================= */}
      {viewMode === "editor" && (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          
          <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
             <button onClick={() => setViewMode("list")} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition">
               <ChevronLeft size={18}/> Kembali ke Daftar Pos
             </button>
             <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
               {isEditing ? <><Edit size={16}/> Edit Pos</> : <><Plus size={16}/> Pos Baru</>}
             </h2>
          </div>

          <form onSubmit={handleSaveArticle} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
             
             {/* KIRI: AREA PENGETIKAN UTAMA */}
             <div className="lg:col-span-8 space-y-6">
                <div>
                  <input 
                    type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 border-b-2 border-transparent hover:border-slate-200 focus:border-blue-600 bg-transparent text-2xl md:text-3xl font-black text-slate-900 placeholder:text-slate-300 outline-none transition-colors"
                    placeholder="Tambahkan judul utama..."
                  />
                </div>

                <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all [&_.quill]:flex [&_.quill]:flex-col [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200 [&_.ql-toolbar]:bg-slate-50 [&_.ql-container]:border-none [&_.ql-container]:min-h-[500px] [&_.ql-container]:text-base [&_.ql-container]:text-slate-800 [&_.ql-editor]:min-h-[500px] [&_.ql-editor]:break-words [&_.ql-editor]:p-6">
                  <ReactQuill 
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={quillModules}
                    placeholder="Mulai menulis di sini..."
                  />
                </div>
             </div>

             {/* KANAN: PANEL SETTING (Kategori, Gambar, Status) */}
             <div className="lg:col-span-4 space-y-6">
                
                {/* Panel Publish */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                   <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                     <h3 className="text-sm font-bold text-slate-800">Status & Visibilitas</h3>
                   </div>
                   <div className="p-4 space-y-4">
                     <div>
                       <label className={labelClass}>Status Pos</label>
                       <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} bg-slate-50 cursor-pointer`}>
                         <option value="Dipublikasikan">✅ Terbit (Publik)</option>
                         <option value="Draf">📝 Draf (Sembunyikan)</option>
                       </select>
                     </div>
                     <div className="pt-2">
                       <button type="submit" disabled={isUploading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 px-4 rounded-md transition flex items-center justify-center gap-2 shadow-sm text-sm">
                         {isUploading ? <Loader2 size={16} className="animate-spin"/> : <Send size={16} />}
                         {isEditing ? "Perbarui Pos" : "Simpan & Terapkan"}
                       </button>
                     </div>
                   </div>
                </div>

                {/* Panel Kategori */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                   <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                     <h3 className="text-sm font-bold text-slate-800">Kategori</h3>
                   </div>
                   <div className="p-4">
                     <select value={kategori} onChange={(e) => setKategori(e.target.value)} className={`${inputClass} cursor-pointer`}>
                        <option value="Berita Utama">Berita Utama</option>
                        <option value="Opini Kader">Opini Kader</option>
                        <option value="Kajian & Artikel">Kajian & Artikel</option>
                        <option value="Pengumuman">Pengumuman</option>
                      </select>
                   </div>
                </div>

                {/* Panel Gambar Unggulan */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                   <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                     <h3 className="text-sm font-bold text-slate-800">Gambar Unggulan</h3>
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
                           <ImageIcon size={32} className="mb-2 opacity-50"/>
                           <p className="text-xs font-medium">Belum ada gambar</p>
                        </div>
                     )}
                     
                     <label className={`w-full cursor-pointer flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-colors border ${isUploading ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm'}`}>
                       {isUploading ? <><Loader2 size={14} className="animate-spin" /> Mengunggah...</> : <><UploadCloud size={14} /> Pilih / Ganti Gambar</>}
                       <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                     </label>
                     <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={`${inputClass} font-mono text-[10px]`} placeholder="Atau paste URL gambar..." readOnly={isUploading} />
                   </div>
                </div>

                {/* Panel Kutipan */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                   <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                     <h3 className="text-sm font-bold text-slate-800">Kutipan (Excerpt)</h3>
                   </div>
                   <div className="p-4">
                     <textarea rows="3" required value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className={`${inputClass} resize-none`} placeholder="Ringkasan singkat untuk ditayangkan di kartu halaman depan..."/>
                   </div>
                </div>

             </div>
          </form>

        </div>
      )}

    </div>
  );
}