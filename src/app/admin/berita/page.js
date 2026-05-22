"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { Save, Link as LinkIcon, Newspaper, Plus, Trash2, Edit, Image as ImageIcon, Send, X, UploadCloud, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// IMPORT REACT QUILL SECARA DINAMIS AGAR TIDAK ERROR DI NEXT.JS (SSR)
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css"; // Style bawaan Quill

export default function AdminBerita() {
  const [loading, setLoading] = useState(true);
  
  // State Konfigurasi Link Eksternal
  const [externalLink, setExternalLink] = useState("");

  // State CRUD Data Berita
  const [newsList, setNewsList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // State Form Editor
  const [title, setTitle] = useState("");
  const [kategori, setKategori] = useState("Berita Utama");
  const [excerpt, setExcerpt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [content, setContent] = useState("");

  // State Status Upload Gambar
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

  // ================= FUNGSI UPLOAD GAMBAR KE CLOUDINARY =================
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi tipe file (harus gambar)
    if (!file.type.startsWith("image/")) {
      alert("Harap pilih file berupa gambar (JPG, PNG, dll)!");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Gagal mengunggah gambar ke server");

      const data = await res.json();
      setImageUrl(data.url); // Otomatis mengisi kolom URL dengan link Cloudinary
      alert("Gambar cover berhasil diunggah!");
    } catch (error) {
      console.error("Error Upload:", error);
      alert("Terjadi kesalahan saat mengunggah gambar. Pastikan API dan Env Cloudinary sudah benar.");
    } finally {
      setIsUploading(false);
      e.target.value = null; // Reset input file
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

    const payload = {
      title,
      kategori,
      excerpt,
      imageUrl,
      content,
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
    window.scrollTo({ top: 300, behavior: 'smooth' }); 
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setTitle("");
    setKategori("Berita Utama");
    setExcerpt("");
    setImageUrl("");
    setContent("");
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image', 'video'],
      [{ 'align': [] }, { 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  };

  if (loading) return <p className="text-slate-500 animate-pulse font-medium">Memuat modul berita...</p>;

  return (
    <div className="space-y-6 pb-12 w-full max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Newspaper size={24} className="text-blue-600" /> Jurnalisme & Publikasi
          </h1>
          <p className="text-sm text-slate-500 mt-1">Tulis berita, opini, dan kelola tautan portal berita eksternal Anda.</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 text-center shrink-0">
           <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Total Artikel</p>
           <p className="text-xl font-black text-blue-700 leading-none mt-0.5">{newsList.length}</p>
        </div>
      </div>

      {/* ================= 1. KOTAK KONFIGURASI WEB UTAMA (DIPINDAH KE ATAS) ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden w-full">
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2 font-bold text-slate-800 text-sm">
           <LinkIcon size={16} className="text-blue-600" /> Portal Berita Eksternal
        </div>
        <form onSubmit={handleSaveConfig} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-slate-700 block mb-1">Tautan Web Berita (Cth: Wordpress, Blogspot, dll)</label>
            <input 
              type="url" 
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
              placeholder="https://beritapmii.com..."
            />
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
              Jika diisi, akan memunculkan tombol pengalih ke web berita utama Anda. Kosongkan jika ingin menyembunyikan tombol tersebut.
            </p>
          </div>
          <button type="submit" className="w-full md:w-auto bg-slate-900 hover:bg-blue-600 text-white font-bold py-3 px-6 md:px-8 rounded-xl transition flex items-center justify-center gap-2 shadow-sm text-xs shrink-0 self-start md:self-center mt-2 md:mt-0">
            Simpan Tautan <Save size={14} />
          </button>
        </form>
      </div>

      {/* ================= 2. EDITOR ARTIKEL PROFESIONAL (LEBAR PENUH) ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden w-full">
        <div className="bg-blue-600 p-4 border-b border-blue-700 flex items-center justify-between text-white">
          <h2 className="font-bold text-sm flex items-center gap-2">
             {isEditing ? <Edit size={16} /> : <Plus size={16} />}
             {isEditing ? "Mode Edit Artikel" : "Tulis Artikel Baru"}
          </h2>
          {isEditing && (
             <button onClick={resetForm} className="text-blue-200 hover:text-white flex items-center gap-1 text-xs bg-blue-700 px-2 py-1 rounded-md">
               <X size={12}/> Batal Edit
             </button>
          )}
        </div>
        
        <form onSubmit={handleSaveArticle} className="p-5 md:p-6 space-y-5">
          {/* Baris 1: Judul & Kategori */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Judul Artikel</label>
              <input 
                type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-slate-800"
                placeholder="Masukkan judul berita yang menarik..."
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Kategori</label>
              <select 
                value={kategori} onChange={(e) => setKategori(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-slate-700 cursor-pointer appearance-none"
              >
                <option value="Berita Utama">Berita Utama</option>
                <option value="Opini Kader">Opini Kader</option>
                <option value="Kajian & Artikel">Kajian & Artikel</option>
                <option value="Pengumuman">Pengumuman</option>
              </select>
            </div>
          </div>

          {/* Baris 2: Excerpt & Upload Cover Modern */}
          <div className="grid md:grid-cols-2 gap-4">
             <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Deskripsi Singkat (Excerpt)</label>
                <textarea 
                  rows="2" required value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs text-slate-600 leading-relaxed"
                  placeholder="Satu atau dua kalimat pembuka untuk ditampilkan di kartu berita..."
                />
             </div>
             
             <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <ImageIcon size={12}/> Cover Gambar Berita
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  {/* Tombol Upload */}
                  <label className={`w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all border shrink-0 ${isUploading ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 shadow-sm'}`}>
                    {isUploading ? <><Loader2 size={14} className="animate-spin" /> Mengunggah...</> : <><UploadCloud size={14} /> Pilih Foto</>}
                    <input 
                      type="file" accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload} 
                      disabled={isUploading} 
                    />
                  </label>
                  {/* Input URL Otomatis/Manual */}
                  <input 
                    type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono bg-slate-50 text-slate-600"
                    placeholder="URL akan terisi otomatis..."
                    readOnly={isUploading}
                  />
                </div>
             </div>
          </div>

          {/* Baris 3: Rich Text Editor (React Quill) */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Isi Konten Berita</label>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <ReactQuill 
                theme="snow"
                value={content}
                onChange={setContent}
                modules={quillModules}
                className="min-h-[300px]"
                placeholder="Tulis isi berita Anda di sini. Anda bisa menebalkan teks, membuat list, atau menyisipkan foto..."
              />
            </div>
            <style jsx global>{`
              .quill { display: flex; flex-direction: column; }
              .ql-toolbar { border: none !important; border-bottom: 1px solid #e2e8f0 !important; background-color: #f8fafc; border-top-left-radius: 0.75rem; border-top-right-radius: 0.75rem; }
              .ql-container { border: none !important; min-height: 300px; font-size: 15px; font-family: inherit; }
              .ql-editor { min-height: 300px; }
            `}</style>
          </div>

          <div className="flex justify-end pt-2">
             <button type="submit" disabled={isUploading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 px-10 rounded-xl transition flex items-center justify-center gap-2 shadow-md">
               {isEditing ? "Simpan Perubahan Artikel" : "Publikasikan Artikel"} <Send size={16} />
             </button>
          </div>

        </form>
      </div>

      {/* ================= 3. TABEL DAFTAR ARTIKEL ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
         <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2 font-bold text-slate-800">
             <Newspaper size={18} className="text-slate-600" /> Riwayat Publikasi Artikel
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
              <thead className="bg-[#1e293b] text-white">
                <tr>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider w-12 text-center">No</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-center">Judul Artikel</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider w-40 text-center">Kategori</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider w-32 text-center">Tanggal</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm bg-white">
                {newsList.length > 0 ? newsList.map((item, index) => {
                  const date = item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-";
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">{index + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                           {item.imageUrl ? (
                             <img src={item.imageUrl} alt="cover" className="w-10 h-10 rounded-md object-cover bg-slate-200 shrink-0" />
                           ) : (
                             <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center shrink-0"><ImageIcon size={16} className="text-slate-400"/></div>
                           )}
                           <span className="font-bold text-slate-800 truncate max-w-[400px]">{item.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4"><span className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider">{item.kategori}</span></td>
                      <td className="py-3 px-4 text-slate-500 font-medium text-xs">{date}</td>
                      <td className="py-3 px-4 text-center">
                         <div className="flex items-center justify-center gap-2">
                           <button onClick={() => handleEditClick(item)} className="bg-amber-100 hover:bg-amber-500 text-amber-600 hover:text-white p-1.5 rounded-lg transition" title="Edit Artikel"><Edit size={16}/></button>
                           <button onClick={() => handleDeleteArticle(item.id)} className="bg-red-100 hover:bg-red-500 text-red-600 hover:text-white p-1.5 rounded-lg transition" title="Hapus Artikel"><Trash2 size={16}/></button>
                         </div>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan="5" className="py-12 text-center text-slate-400">Belum ada artikel yang dipublikasikan. Mulai menulis di atas!</td></tr>
                )}
              </tbody>
            </table>
         </div>
      </div>

    </div>
  );
}