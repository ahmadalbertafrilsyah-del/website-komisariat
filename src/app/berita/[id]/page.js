"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { ArrowLeft, Calendar, User, Clock, Share2, AlertCircle, Newspaper, ImageIcon, Sparkles, TrendingUp, ChevronRight } from "lucide-react";

import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";

// IMPORT CSS ASLI DARI REACT QUILL AGAR FORMAT SAMA PERSIS DENGAN ADMIN
import "react-quill-new/dist/quill.snow.css";

const createSlug = (title) => {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

export default function DetailBerita() {
  const params = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState(null);
  const [sidebarNews, setSidebarNews] = useState([]);

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

        if (foundArticle) {
          setArticle(foundArticle);
          
          const q = query(collection(db, "berita"), orderBy("createdAt", "desc"), limit(6));
          const sidebarSnap = await getDocs(q);
          const sidebarData = [];
          
          sidebarSnap.forEach((docItem) => {
            if (docItem.id !== foundArticle.id) { 
              sidebarData.push({ id: docItem.id, ...docItem.data() });
            }
          });
          
          setSidebarNews(sidebarData.slice(0, 5)); 
        } else {
          setArticle(null); 
        }

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

      <div className="pt-24 md:pt-32 pb-20 px-5 max-w-7xl mx-auto w-full">
        
        {/* Breadcrumb */}
        <div className="flex justify-between items-center mb-6 md:mb-8 border-b border-slate-100 pb-4">
            <Link href="/berita" className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-lg">
              <ArrowLeft size={16} /> Indeks Berita
            </Link>
            <button onClick={handleShare} className="text-slate-500 hover:text-blue-600 transition flex items-center gap-1.5 text-xs md:text-sm font-bold bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-lg" title="Bagikan Artikel">
               <Share2 size={16} /> <span className="hidden sm:inline">Bagikan Link</span>
            </button>
        </div>

        {/* GRID UTAMA (KIRI: ARTIKEL, KANAN: SIDEBAR) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">
          
          {/* ================= KOLOM KIRI (ARTIKEL) ================= */}
          <div className="lg:col-span-8 w-full min-w-0">
            
            <header className="mb-8">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-wider mb-4 border ${getCategoryColor(article.kategori)}`}>
                <Sparkles size={12} className="shrink-0" /> {article.kategori || "Berita Utama"}
              </div>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-extrabold text-slate-900 leading-[1.3] md:leading-[1.25] mb-5 tracking-tight">
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

            {/* Gambar Cover */}
            <div className="w-full aspect-[4/3] sm:aspect-video lg:aspect-[16/9] bg-slate-100 rounded-2xl md:rounded-3xl mb-10 overflow-hidden shadow-sm border border-slate-200 flex items-center justify-center relative group">
               {article.imageUrl ? (
                 <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
               ) : (
                 <div className="flex flex-col items-center text-slate-400 w-full h-full justify-center">
                   <Newspaper size={40} className="mb-2 opacity-30 md:w-12 md:h-12" />
                   <span className="font-semibold text-xs md:text-sm opacity-50">Tanpa Gambar Sampul</span>
                 </div>
               )}
            </div>

            {/* ================= AREA ISI (100% MENGIKUTI ADMIN) ================= */}
            {/* Class ql-snow dan ql-editor memastikan CSS Quill berkerja sempurna tanpa error Tailwind */}
            <div className="ql-snow">
              <div 
                className="ql-editor custom-reader" 
                dangerouslySetInnerHTML={{ __html: article.content }} 
              />
            </div>

            {/* Penyesuaian akhir agar font nyaman dibaca */}
            <style jsx global>{`
              .custom-reader {
                padding: 0 !important;
                font-family: inherit !important;
                font-size: 1.125rem !important;
                line-height: 1.8 !important;
                color: #334155 !important;
                overflow-wrap: break-word !important; 
                word-wrap: break-word !important;
              }
              /* Menghapus batasan tinggi dari editor asli */
              .custom-reader.ql-editor {
                min-height: auto !important;
                height: auto !important;
              }
              .custom-reader p {
                margin-bottom: 1em !important;
              }
              .custom-reader img {
                border-radius: 0.75rem;
                margin: 1.5em auto;
              }
              .custom-reader iframe, .custom-reader .ql-video {
                width: 100%;
                aspect-ratio: 16 / 9;
                border-radius: 0.75rem;
              }
            `}</style>
          </div>

          {/* ================= KOLOM KANAN (SIDEBAR TERKINI) ================= */}
          <aside className="lg:col-span-4 w-full mt-10 lg:mt-0 relative">
            <div className="sticky top-28 space-y-8">
              
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Bagikan Tulisan Ini</h3>
                 <div className="flex gap-2">
                    <button onClick={handleShare} className="flex-1 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                      <Share2 size={14} /> Salin Link Artikel
                    </button>
                 </div>
              </div>

              <div className="bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 rounded-2xl">
                <h3 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                  <TrendingUp size={20} className="text-blue-600" /> Berita Terkini
                </h3>
                
                {sidebarNews.length > 0 ? (
                  <div className="space-y-5">
                    {sidebarNews.map((news) => {
                      const slugTitle = createSlug(news.title);
                      const newsDate = news.createdAt?.toDate ? news.createdAt.toDate().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "";
                      
                      return (
                        <Link href={`/berita/${slugTitle}`} key={news.id} className="group flex gap-4 items-start">
                          <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 relative border border-slate-100">
                             {news.imageUrl ? (
                               <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50"><ImageIcon size={16}/></div>
                             )}
                          </div>
                          <div className="flex flex-col flex-grow">
                             <h4 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                               {news.title}
                             </h4>
                             <div className="flex items-center justify-between mt-auto pt-1">
                               <span className="text-[10px] font-semibold text-slate-400">{newsDate}</span>
                             </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">Belum ada berita lainnya.</p>
                )}
                
                <Link href="/berita" className="mt-6 flex items-center justify-center gap-1 w-full bg-slate-50 hover:bg-blue-50 text-blue-600 py-3 rounded-xl text-xs font-bold transition-colors">
                  Lihat Semua Berita <ChevronRight size={14} />
                </Link>
              </div>

            </div>
          </aside>

        </div>
      </div>
      <Footer />
    </main>
  );
}