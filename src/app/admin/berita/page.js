"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { Save, Link as LinkIcon, Newspaper, Plus, Trash2, Edit, Image as ImageIcon, Send, X, UploadCloud, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// IMPORT REACT QUILL DINAMIS DENGAN FALLBACK LOADING
const ReactQuill = dynamic(() => import("react-quill-new"), { 
  ssr: false,
  loading: () => <div className="p-10 text-center text-sm text-slate-500 animate-pulse">Memuat Editor Berita...</div>
});
import "react-quill-new/dist/quill.snow.css"; 

// 🔥 PERBAIKAN 1: Pindahkan quillModules ke luar komponen agar tidak re-render
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
  const [externalLink, setExternalLink] = useState("");
  const [newsList, setNewsList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [title, setTitle] = useState("");
  const [kategori, setKategori] = useState("Berita Utama");
  const [excerpt, setExcerpt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [content, setContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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
      alert("Pengaturan Tautan Berita Utama Berhasil Disimpan!");
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
      title, kategori, excerpt, imageUrl,
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
        await addDoc(collection(db, "berita"), payload);
        alert("Artikel baru berhasil dipublikasikan!");
      }
      
      resetForm();
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

  const handleEditClick = (article) => {
    setIsEditing(true);
    setEditId(article.id);
    setTitle(article.title);
    setKategori(article.kategori);
    setExcerpt(article.excerpt);
    setImageUrl(article.imageUrl || "");
    setContent(article.content);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const resetForm = () => {
    setIsEditing(false); setEditId(null); setTitle("");
    setKategori("Berita Utama"); setExcerpt(""); setImageUrl(""); setContent("");
  };

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm";
  const labelClass = "text-sm font-medium text-slate-700 block mb-1.5";

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="text-blue-600 animate-spin"/></div>;

  return (
    <div className="space-y-6 pb-12 w-full max-w-6xl mx-auto">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             Jurnalisme & Berita
          </h1>
          <p className="text-sm text-slate-500 mt-1">Tulis berita, rilis opini, dan kelola tautan portal berita eksternal komisariat.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3 shrink-0">
           <Newspaper size={20} className="text-blue-600" />
           <div>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Artikel</p>
             <p className="text-lg font-bold text-slate-800 leading-none">{newsList.length} <span className="text-sm font-medium text-slate-500">Post</span></p>
           </div>
        </div>
      </div>

      {/* SEKSI 1: PORTAL EKSTERNAL */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden w-full">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
           <LinkIcon size={18} className="text-slate-500" />
           <h2 className="text-base font-semibold text-slate-800">Portal Berita Eksternal</h2>
        </div>
        <form onSubmit={handleSaveConfig} className="p-6 flex flex-col md:flex-row md:items-start gap-4">
          <div className="flex-1 w-full">
            <label className={labelClass}>Tautan Web Berita (Opsional)</label>
            <input 
              type="url" 
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              className={inputClass + " font-mono"}
              placeholder="https://beritapmii.com..."
            />
            <p className="text-xs text-slate-500 mt-2">
              Jika diisi, akan memunculkan tombol pengalih ke web/blog utama berita Anda. Kosongkan jika ingin menyembunyikan fitur tersebut.
            </p>
          </div>
          <button type="submit" className="w-full md:w-auto bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 px-6 rounded-md transition flex items-center justify-center gap-2 shadow-sm text-sm shrink-0 md:mt-6">
             <Save size={16} /> Simpan Tautan
          </button>
        </form>
      </div>

      {/* SEKSI 2: FORM EDITOR ARTIKEL */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden w-full" id="editor-section">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
             {isEditing ? <Edit size={18} className="text-amber-500" /> : <Plus size={18} className="text-blue-600" />}
             <h2 className="text-base font-semibold text-slate-800">{isEditing ? "Mode Edit Artikel" : "Tulis Artikel Baru"}</h2>
          </div>
          {isEditing && (
             <button onClick={resetForm} className="text-slate-500 hover:text-red-600 bg-white border border-slate-300 hover:border-red-200 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition shadow-sm">
               <X size={14}/> Batal Edit
             </button>
          )}
        </div>
        
        <form onSubmit={handleSaveArticle} className="p-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <label className={labelClass}>Judul Artikel</label>
              <input 
                type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                className={`${inputClass} font-semibold text-slate-800`}
                placeholder="Masukkan judul berita yang menarik..."
              />
            </div>
            <div>
              <label className={labelClass}>Kategori Publikasi</label>
              <select 
                value={kategori} onChange={(e) => setKategori(e.target.value)}
                className={`${inputClass} bg-white cursor-pointer appearance-none`}
              >
                <option value="Berita Utama">Berita Utama</option>
                <option value="Opini Kader">Opini Kader</option>
                <option value="Kajian & Artikel">Kajian & Artikel</option>
                <option value="Pengumuman">Pengumuman</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
             <div>
                <label className={labelClass}>Deskripsi Singkat (Excerpt)</label>
                <textarea 
                  rows="3" required value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
                  className={`${inputClass} resize-none`}
                  placeholder="Satu atau dua kalimat pembuka untuk ditampilkan di kartu berita depan..."
                />
             </div>
             
             <div>
                <label className={labelClass}>Cover Gambar Berita (Landscape)</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-1">
                  <label className={`w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors border shrink-0 ${isUploading ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm'}`}>
                    {isUploading ? <><Loader2 size={16} className="animate-spin" /> Mengunggah...</> : <><UploadCloud size={16} /> Pilih File Foto</>}
                    <input 
                      type="file" accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload} 
                      disabled={isUploading} 
                    />
                  </label>
                  <input 
                    type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                    className={`${inputClass} font-mono text-xs bg-slate-50 text-slate-500`}
                    placeholder="URL otomatis terisi..."
                    readOnly={isUploading}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Gunakan gambar rasio 16:9 agar tampilan optimal.</p>
             </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className={labelClass}>Isi Konten Berita</label>
            
            {/* 🔥 PERBAIKAN 2: Mengganti <style jsx> dengan Tailwind Arbitrary Variants yang aman */}
            <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-shadow [&_.quill]:flex [&_.quill]:flex-col [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-300 [&_.ql-toolbar]:bg-slate-50 [&_.ql-container]:border-none [&_.ql-container]:min-h-[400px] [&_.ql-container]:text-sm [&_.ql-container]:text-slate-700 [&_.ql-editor]:min-h-[400px] [&_.ql-editor]:break-words">
              <ReactQuill 
                theme="snow"
                value={content}
                onChange={setContent}
                modules={quillModules}
                placeholder="Tulis isi berita Anda di sini. Anda bisa menebalkan teks, membuat list, atau menyisipkan foto..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
             <button type="submit" disabled={isUploading} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 px-8 rounded-md transition flex items-center justify-center gap-2 shadow-sm text-sm">
               {isEditing ? "Simpan Perubahan Artikel" : "Publikasikan Artikel"} <Send size={16} />
             </button>
          </div>

        </form>
      </div>

      {/* SEKSI 3: TABEL RIWAYAT PUBLIKASI */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
         <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
             <Newspaper size={18} className="text-slate-500" />
             <h2 className="text-base font-semibold text-slate-800">Riwayat Publikasi Artikel</h2>
         </div>
         <div className="overflow-x-auto max-h-[60vh] hide-scrollbar relative">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-12 text-center">No</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Judul & Cover</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-40">Kategori</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-32">Tanggal Tayang</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm bg-white">
                {newsList.length > 0 ? newsList.map((item, index) => {
                  const date = item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-";
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
                           <span className="font-semibold text-slate-800 truncate max-w-[350px]">{item.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded text-[10px] font-medium tracking-wide">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs font-medium">{date}</td>
                      <td className="py-3 px-4 text-center">
                         <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleEditClick(item)} className="bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 p-1.5 rounded-md shadow-sm transition" title="Edit Artikel"><Edit size={14}/></button>
                           <button onClick={() => handleDeleteArticle(item.id)} className="bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 p-1.5 rounded-md shadow-sm transition" title="Hapus Artikel"><Trash2 size={14}/></button>
                         </div>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center">
                       <div className="flex flex-col items-center justify-center text-slate-400">
                         <Newspaper size={32} className="mb-3 opacity-30" />
                         <p className="font-medium text-slate-600 text-sm">Belum ada artikel dipublikasikan.</p>
                         <p className="text-xs mt-1">Mulai tulis karya jurnalistik Anda di form atas.</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
         </div>
      </div>

    </div>
  );
}