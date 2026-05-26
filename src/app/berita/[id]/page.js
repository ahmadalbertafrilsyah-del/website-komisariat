"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { ArrowLeft, Calendar, User, Clock, Share2, AlertCircle, Newspaper, Sparkles } from "lucide-react";

import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

import "react-quill-new/dist/quill.snow.css";

const createSlug = (title) => {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

// ================= FUNGSI SAPU BERSIH (THE NUKE V3 - FINAL) =================
const cleanCorruptedHTML = (htmlString) => {
  if (!htmlString) return "";
  return htmlString
    // 1. Menghapus semua paksaan style dari Word/PDF
    .replace(/word-break:\s*[^;"]+;?/gi, '')
    .replace(/overflow-wrap:\s*[^;"]+;?/gi, '')
    .replace(/white-space:\s*[^;"]+;?/gi, '')
    .replace(/hyphens:\s*[^;"]+;?/gi, '')
    // 2. Menghapus karakter siluman (Soft Hyphen, dll)
    .replace(/&shy;/gi, '')
    .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, '')
    // 3. Mengubah tanda hubung yang diikuti Enter menjadi tidak ada enter
    .replace(/-\s*<br\s*\/?>/gi, '-') 
    // 4. Menghapus <br> siluman dari PDF yang memotong baris di tengah kalimat
    .replace(/<br\s*\/?>/gi, ' ')
    // 5. INI DIA PEMBUNUH UTAMANYA: Mengubah Non-Breaking Space menjadi spasi biasa!
    .replace(/&nbsp;/gi, ' '); 
};

export default function DetailBerita() {
  const params = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState(null);

  useEffect(() => {
    async function fetchBeritaDetail() {
      try {
        if (!params.id) return;
        const decodedId = decodeURIComponent(params.id);

        let foundArticle = null;

        const docRef = doc(db, "berita", decodedId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          foundArticle = { id: docSnap.id, ...docSnap.data() };
        } else {
          const allNewsSnap = await getDocs(collection(db, "berita"));
          const match = allNewsSnap.docs.find(d => createSlug(d.data().title || "") === decodedId);
          if (match) {
            foundArticle = { id: match.id, ...match.data() };
          }
        }

        setArticle(foundArticle || null);

      } catch (error) {
        console.error("Gagal memuat detail berita:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBeritaDetail();
  }, [params.id]);

  const handleShare = () => {
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
            <ArrowLeft size={16} /> Kembali ke Daftar Berita
          </button>
        </div>
      </main>
    );
  }

  const publishDate = article.createdAt?.toDate 
    ? article.createdAt.toDate().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) 
    : "Tanggal tidak diketahui";

  const wordCount = article.content ? article.content.replace(/<[^>]*>?/gm, '').split(/\s+/).length : 0;
  const readTime = Math.ceil(wordCount / 200) || 1;

  const getCategoryColor = (cat) => {
    switch (cat) {
      case "Opini Kader": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Kajian & Artikel": return "bg-purple-100 text-purple-700 border-purple-200";
      case "Pengumuman": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  return (
    <main className="min-h-screen bg-white font-sans text-slate-900 w-full overflow-x-hidden selection:bg-blue-200 selection:text-blue-900">
      <Navbar />

      <div className="pt-24 md:pt-32 pb-20 px-5 max-w-4xl mx-auto w-full">
        
        <div className="flex justify-between items-center mb-6 md:mb-8 border-b border-slate-100 pb-4">
            <Link href="/berita" className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-lg">
              <ArrowLeft size={16} /> Indeks Berita
            </Link>
            <button onClick={handleShare} className="text-slate-500 hover:text-blue-600 transition flex items-center gap-1.5 text-xs md:text-sm font-bold bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-lg">
               <Share2 size={16} /> <span className="hidden sm:inline">Bagikan Link</span>
            </button>
        </div>

        <div className="w-full">
          
          <header className="mb-8">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-wider mb-4 border ${getCategoryColor(article.kategori)}`}>
              <Sparkles size={12} className="shrink-0" /> {article.kategori || "Berita Utama"}
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.3] md:leading-[1.25] mb-5 tracking-tight">
              {article.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[11px] md:text-sm text-slate-500 font-medium bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5"><User size={14} className="text-blue-600 shrink-0"/> <span className="font-bold text-slate-700">Tim Redaksi PMII</span></div>
                <div className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full shrink-0"></div>
                <div className="flex items-center gap-1.5"><Calendar size={14} className="text-blue-600 shrink-0"/> {publishDate}</div>
                <div className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full shrink-0"></div>
                <div className="flex items-center gap-1.5"><Clock size={14} className="text-blue-600 shrink-0"/> {readTime} Min Baca</div>
            </div>
          </header>

          <div className="w-full aspect-[4/3] sm:aspect-video bg-slate-100 rounded-2xl md:rounded-3xl mb-10 overflow-hidden shadow-sm border border-slate-200 flex items-center justify-center relative group">
              {article.imageUrl ? (
                <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="flex flex-col items-center text-slate-400 w-full h-full justify-center">
                  <Newspaper size={40} className="mb-2 opacity-30 md:w-12 md:h-12" />
                  <span className="font-semibold text-xs md:text-sm opacity-50">Tanpa Gambar Sampul</span>
                </div>
              )}
          </div>

          <div className="ql-snow w-full max-w-full overflow-hidden">
            <div 
              id="super-clean-article"
              className="ql-editor w-full text-slate-700" 
              dangerouslySetInnerHTML={{ __html: cleanCorruptedHTML(article.content) }} 
            />
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
              #super-clean-article,
              #super-clean-article * {
                word-break: normal !important;
                overflow-wrap: break-word !important;
                white-space: normal !important;
                hyphens: none !important;
                
                /* KEMBALI KE JUSTIFY karena masalah spasi kaku sudah diatasi */
                text-align: justify !important; 
              }

              #super-clean-article {
                padding: 0 !important;
                font-family: inherit !important;
                font-size: 1.125rem !important;
                line-height: 1.85 !important;
                color: #334155 !important;
              }

              #super-clean-article p {
                margin-bottom: 1.5rem !important;
              }

              #super-clean-article img {
                max-width: 100% !important;
                height: auto !important;
                border-radius: 0.75rem;
                margin: 1.5rem auto;
              }

              @media (max-width: 768px) {
                #super-clean-article {
                  font-size: 1.05rem !important;
                  line-height: 1.75 !important;
                  /* Di HP lebih nyaman dibaca jika rata kiri (opsional) */
                  text-align: left !important;
                }
                #super-clean-article p {
                  margin-bottom: 1.25rem !important;
                }
              }
            `
          }} />
        </div>

      </div>
      <Footer />
    </main>
  );
}