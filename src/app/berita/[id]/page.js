"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { 
  ArrowLeft, Calendar, User, Clock, AlertCircle, 
  Newspaper, Sparkles, MessageCircle, Link2, Users, Tag, 
  Edit3, Camera, Globe, Eye, Send
} from "lucide-react";

import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, updateDoc, increment } from "firebase/firestore";

import "react-quill-new/dist/quill.snow.css";

// ================= KOMPONEN ICON CUSTOM =================
const FacebookIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);

const TwitterIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
);

const createSlug = (title) => {
  if (!title) return "";
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

const cleanCorruptedHTML = (htmlString) => {
  if (!htmlString) return "";
  return htmlString
    .replace(/word-break:\s*[^;"]+;?/gi, '')
    .replace(/overflow-wrap:\s*[^;"]+;?/gi, '')
    .replace(/white-space:\s*[^;"]+;?/gi, '')
    .replace(/hyphens:\s*[^;"]+;?/gi, '')
    .replace(/&shy;/gi, '')
    .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, '')
    .replace(/-\s*<br\s*\/?>/gi, '-') 
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/&nbsp;/gi, ' '); 
};

export default function DetailBerita() {
  const params = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Efek Scroll Progress Bar
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${totalScroll / windowHeight}`;
      setScrollProgress(scroll * 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function fetchBeritaDetail() {
      try {
        if (!params.id) return;
        const decodedId = decodeURIComponent(params.id);

        let foundArticle = null;
        let docRefToUpdate = null;

        // Coba cari berdasarkan ID langsung
        const docRef = doc(db, "berita", decodedId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          foundArticle = { id: docSnap.id, ...docSnap.data() };
          docRefToUpdate = docRef;
        } else {
          // Cari berdasarkan Slug (Kesesuaian Judul URL)
          const allNewsSnap = await getDocs(collection(db, "berita"));
          const match = allNewsSnap.docs.find(d => createSlug(d.data().title || "") === decodedId);
          if (match) {
            foundArticle = { id: match.id, ...match.data() };
            docRefToUpdate = doc(db, "berita", match.id);
          }
        }

        if (foundArticle && docRefToUpdate) {
          setArticle(foundArticle);
          // Tambah otomatis jumlah "Views" setiap kali artikel dibuka
          updateDoc(docRefToUpdate, { views: increment(1) }).catch(e => console.error(e));
        }

      } catch (error) {
        console.error("Gagal memuat detail berita:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBeritaDetail();
  }, [params.id]);

  // Fungsi Bagikan ke Sosmed
  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(article?.title + " - Baca selengkapnya di: " + (typeof window !== "undefined" ? window.location.href : ""))}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(article?.title)}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Tautan artikel berhasil disalin ke clipboard!");
  };

  if (loading) return <LoadingScreen text="Menyiapkan Artikel..." />;

  if (!article) {
    return (
      <main className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-5 font-sans">
        <Navbar />
        <div className="text-center mt-20 bg-white p-10 rounded-3xl border border-slate-100 shadow-sm max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">Artikel Tidak Ditemukan</h1>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">Maaf, artikel yang Anda cari mungkin telah dihapus atau tautannya salah.</p>
          <button onClick={() => router.push('/berita')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 w-full shadow-md">
            <ArrowLeft size={16} /> Kembali ke Indeks Berita
          </button>
        </div>
      </main>
    );
  }

  const publishDate = article.createdAt?.toDate 
    ? article.createdAt.toDate().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) 
    : "Tanggal tidak diketahui";

  const wordCount = article.content ? article.content.replace(/<[^>]*>?/gm, '').split(/\s+/).length : 0;
  const readTime = Math.ceil(wordCount / 200) || 1;

  const getCategoryColor = (cat) => {
    switch (cat) {
      case "Opini Kader": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Kajian & Artikel": return "bg-purple-50 text-purple-700 border-purple-200";
      case "Pengumuman": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const tagsArray = article.tags ? article.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== "") : [];
  
  // Validasi apakah ada susunan redaksi yang diisi
  const hasRedaksi = article.penulis || article.editorName || article.fotografer || article.sumber;

  // GANTI BAGIAN LOGIKA DATELINE DENGAN INI:
  let finalHtmlContent = cleanCorruptedHTML(article.content);

  if (article.dateline) {
    const datelineHTML = `<strong style="color: #0f172a; text-transform: uppercase;">${article.dateline} &mdash; </strong>`;
    
    // Cek apakah konten diawali dengan <p>
    if (finalHtmlContent.trim().startsWith('<p>')) {
      // Kita masukkan dateline tepat setelah tag <p> pembuka
      finalHtmlContent = finalHtmlContent.replace('<p>', `<p>${datelineHTML}`);
    } else {
      // Jika tidak ada <p>, kita buatkan paragraf baru
      finalHtmlContent = `<p>${datelineHTML}${finalHtmlContent}</p>`;
    }
  }

  return (
    <main className="min-h-screen bg-white font-sans text-slate-900 w-full overflow-x-hidden selection:bg-blue-200 selection:text-blue-900">
      <Navbar />

      {/* READING PROGRESS BAR */}
      <div className="fixed top-0 left-0 h-1.5 bg-blue-600 z-[60] transition-all duration-150 ease-out" style={{ width: `${scrollProgress}%` }}></div>

      <div className="pt-24 md:pt-32 pb-20 px-5 max-w-4xl mx-auto w-full relative">
        
        {/* FLOATING SHARE SIDEBAR (Desktop) */}
        <div className="hidden lg:flex flex-col gap-3 absolute -left-12 top-64 z-10">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-1 w-10">Share</p>
           <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-50 hover:bg-[#25D366] hover:text-white border border-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors tooltip" title="Bagikan ke WhatsApp">
             <MessageCircle size={18} />
           </a>
           <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-50 hover:bg-[#1DA1F2] hover:text-white border border-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors tooltip" title="Bagikan ke X/Twitter">
             <TwitterIcon size={18} />
           </a>
           <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-50 hover:bg-[#1877F2] hover:text-white border border-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors tooltip" title="Bagikan ke Facebook">
             <FacebookIcon size={18} />
           </a>
           <button onClick={handleCopyLink} className="w-10 h-10 bg-slate-50 hover:bg-slate-800 hover:text-white border border-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors tooltip" title="Salin Tautan">
             <Link2 size={18} />
           </button>
        </div>

        <div className="w-full">
          {/* HEADER ARTIKEL */}
          <header className="mb-8 md:mb-10 text-center md:text-left">
            <Link href="/berita" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors mb-6 group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Indeks Berita
            </Link>
            
            <div className="block mb-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getCategoryColor(article.kategori)}`}>
                <Sparkles size={12} className="shrink-0" /> {article.kategori || "Berita Utama"}
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 leading-[1.25] md:leading-[1.15] mb-6 tracking-tight">
              {article.title}
            </h1>
            
            {article.excerpt && (
              <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed mb-6">
                {article.excerpt}
              </p>
            )}
            
            {/* METADATA PENULIS & STATISTIK */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200 text-slate-400 shrink-0">
                     {article.fotoPenulis ? (
                        <img src={article.fotoPenulis} alt={article.penulis} className="w-full h-full object-cover" />
                     ) : (
                        <User size={20} />
                     )}
                   </div>
                   <div className="text-left">
                     <p className="text-sm font-bold text-slate-800">{article.penulis || "Tim Redaksi PMII"}</p>
                     <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">Penulis Artikel</p>
                   </div>
                </div>
                
                <div className="hidden md:block w-px h-8 bg-slate-200"></div>
                
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 font-medium w-full md:w-auto justify-center md:justify-start">
                   <div className="flex items-center gap-1.5"><Calendar size={15} className="text-slate-400"/> {publishDate}</div>
                   <div className="flex items-center gap-1.5"><Clock size={15} className="text-slate-400"/> {readTime} min baca</div>
                   <div className="flex items-center gap-1.5"><Eye size={15} className="text-blue-400"/> {article.views || 0} Dilihat</div>
                   <div className="flex items-center gap-1.5"><MessageCircle size={15} className="text-pink-400"/> {article.commentsCount || 0} Komentar</div>
                </div>
            </div>
          </header>

          {/* GAMBAR SAMPUL */}
          <div className="w-full aspect-[4/3] sm:aspect-video bg-slate-100 rounded-2xl mb-12 overflow-hidden shadow-sm border border-slate-200 flex items-center justify-center relative group">
              {article.imageUrl ? (
                <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="flex flex-col items-center text-slate-400 w-full h-full justify-center">
                  <Newspaper size={48} className="mb-3 opacity-30" />
                  <span className="font-semibold text-sm opacity-50">Tanpa Gambar Sampul</span>
                </div>
              )}
          </div>

          {/* ISI ARTIKEL (HTML) - SUDAH TERMASUK DATELINE */}
          <div className="ql-snow w-full max-w-full overflow-hidden">
            <div 
              id="super-clean-article"
              className="ql-editor w-full text-slate-800" 
              dangerouslySetInnerHTML={{ __html: finalHtmlContent }} 
            />
          </div>

          {/* CSS EDITORIAL UNTUK ARTIKEL (DIKEMBALIKAN KE STANDAR ADMIN QUILL) */}
          <style dangerouslySetInnerHTML={{
            __html: `
              #super-clean-article,
              #super-clean-article * {
                word-break: normal !important;
                overflow-wrap: break-word !important;
                white-space: normal !important;
                hyphens: none !important;
              }

              #super-clean-article {
                padding: 0 !important;
                font-family: ui-sans-serif, system-ui, -apple-system, sans-serif !important;
                font-size: 1.05rem !important;
                line-height: 1.8 !important;
                color: #334155 !important;
              }

              #super-clean-article p { margin-bottom: 1.25rem !important; }

              #super-clean-article blockquote {
                border-left: 4px solid #2563eb !important;
                background-color: #f8fafc !important;
                padding: 1rem 1.5rem !important;
                margin: 2rem 0 !important;
                font-style: italic !important;
                color: #475569 !important;
                border-radius: 0 0.5rem 0.5rem 0;
              }

              #super-clean-article h2, 
              #super-clean-article h3 {
                font-family: inherit !important;
                font-weight: 800 !important;
                color: #0f172a !important;
                margin-top: 2rem !important;
                margin-bottom: 1rem !important;
                line-height: 1.3 !important;
              }
              #super-clean-article h2 { font-size: 1.5rem !important; }
              #super-clean-article h3 { font-size: 1.25rem !important; }

              #super-clean-article a {
                color: #2563eb !important;
                text-decoration: underline !important;
                text-underline-offset: 4px;
              }
              #super-clean-article a:hover { color: #1e40af !important; }

              #super-clean-article ul, #super-clean-article ol {
                margin-bottom: 1.25rem !important;
                padding-left: 1.5rem !important;
              }
              #super-clean-article li { margin-bottom: 0.5rem !important; }

              #super-clean-article img {
                max-width: 100% !important;
                height: auto !important;
                border-radius: 0.5rem;
                margin: 2rem auto;
              }
            `
          }} />

          {/* AREA BAWAH: TAGS & REDAKSI */}
          <div className="mt-12 space-y-8 border-t border-slate-200 pt-10">
             
             {/* KATA KUNCI (TAGS) - KLIKABLE */}
             {tagsArray.length > 0 && (
               <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                 <div className="flex items-center gap-2 text-sm font-bold text-slate-800 shrink-0">
                    <Tag size={16} className="text-amber-500"/> Tags:
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {tagsArray.map((tag, idx) => (
                      <Link 
                        key={idx} 
                        href={`/berita?search=${encodeURIComponent(tag)}`}
                        className="bg-slate-50 border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        {tag}
                      </Link>
                    ))}
                 </div>
               </div>
             )}

             {/* SUSUNAN REDAKSI (KREDIT) - HANYA MUNCUL JIKA ADA DATA */}
             {hasRedaksi && (
               <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 md:p-8">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest text-[13px]">
                    <Users size={16} className="text-blue-600"/> Susunan Redaksi
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                     {article.penulis && (
                       <div className="flex flex-col gap-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Penulis</p>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                              {article.fotoPenulis ? <img src={article.fotoPenulis} className="w-full h-full object-cover"/> : <User size={16} className="m-2 text-slate-400"/>}
                            </div>
                            <p className="text-[13px] font-bold text-slate-800 leading-tight">{article.penulis}</p>
                          </div>
                       </div>
                     )}

                     {article.editorName && (
                       <div className="flex flex-col gap-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Editor</p>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                              {article.fotoEditor ? <img src={article.fotoEditor} className="w-full h-full object-cover"/> : <Edit3 size={14} className="m-2 text-slate-400"/>}
                            </div>
                            <p className="text-[13px] font-bold text-slate-800 leading-tight">{article.editorName}</p>
                          </div>
                       </div>
                     )}

                     {article.fotografer && (
                       <div className="flex flex-col gap-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fotografer</p>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                              {article.fotoFotografer ? <img src={article.fotoFotografer} className="w-full h-full object-cover"/> : <Camera size={14} className="m-2 text-slate-400"/>}
                            </div>
                            <p className="text-[13px] font-bold text-slate-800 leading-tight">{article.fotografer}</p>
                          </div>
                       </div>
                     )}

                     {article.sumber && (
                       <div className="flex flex-col gap-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sumber</p>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md bg-slate-200 overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center">
                              {article.logoSumber ? <img src={article.logoSumber} className="w-full h-full object-contain bg-white p-1"/> : <Globe size={14} className="text-slate-400"/>}
                            </div>
                            <p className="text-[13px] font-bold text-slate-800 leading-tight line-clamp-2">{article.sumber}</p>
                          </div>
                       </div>
                     )}
                  </div>
               </div>
             )}

             {/* UI KOLOM KOMENTAR (PLACEHOLDER) */}
             <div className="pt-10">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest text-[13px]">
                  <MessageCircle size={16} className="text-pink-500"/> Komentar Pembaca ({article.commentsCount || 0})
                </h3>
                
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-8">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200"><User size={18} className="text-slate-400"/></div>
                    <div className="w-full">
                       <textarea 
                         rows="3" 
                         className="w-full px-3 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow text-sm resize-none" 
                         placeholder="Tulis pendapat atau tanggapan Anda di sini..."
                       />
                       <div className="flex justify-end mt-3">
                         <button className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-6 rounded-md transition flex items-center gap-2 text-[13px]">
                           <Send size={14} /> Kirim Komentar
                         </button>
                       </div>
                    </div>
                  </div>
                </div>

                {(!article.commentsCount || article.commentsCount === 0) && (
                   <p className="text-center text-sm text-slate-400 py-8 bg-slate-50 rounded-xl border border-slate-100 border-dashed">Belum ada komentar. Jadilah yang pertama memberikan tanggapan!</p>
                )}
             </div>

             {/* Mobile Share Buttons */}
             <div className="flex items-center justify-center gap-4 pt-6 border-t border-slate-100 lg:hidden">
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bagikan:</span>
                 <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-md">
                   <MessageCircle size={18} />
                 </a>
                 <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#1DA1F2] text-white rounded-full flex items-center justify-center shadow-md">
                   <TwitterIcon size={18} />
                 </a>
                 <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#1877F2] text-white rounded-full flex items-center justify-center shadow-md">
                   <FacebookIcon size={18} />
                 </a>
                 <button onClick={handleCopyLink} className="w-10 h-10 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-md">
                   <Link2 size={18} />
                 </button>
             </div>

          </div>

        </div>
      </div>
      <Footer />
    </main>
  );
}