"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { ArrowLeft, Calendar, User, Clock, Share2, Tag, AlertCircle, Newspaper, ImageIcon, Sparkles } from "lucide-react";

// IMPORT FIREBASE
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";

export default function DetailBerita() {
  const params = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);

  useEffect(() => {
    async function fetchBeritaDetail() {
      try {
        if (!params.id) return;

        // 1. Tarik Data Artikel Berdasarkan ID di URL
        const docRef = doc(db, "berita", params.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setArticle({ id: docSnap.id, ...docSnap.data() });
        } else {
          setArticle(null); 
        }

        // 2. Tarik Data Artikel Terkait (3 Artikel Terbaru selain artikel ini)
        const q = query(collection(db, "berita"), orderBy("createdAt", "desc"), limit(4));
        const relatedSnap = await getDocs(q);
        const relatedData = [];
        relatedSnap.forEach((docItem) => {
          if (docItem.id !== params.id) { 
            relatedData.push({ id: docItem.id, ...docItem.data() });
          }
        });
        setRelatedNews(relatedData.slice(0, 2)); 

      } catch (error) {
        console.error("Gagal memuat detail berita:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBeritaDetail();
  }, [params.id]);

  // Fungsi Copy Link untuk Tombol Share
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Tautan artikel berhasil disalin ke clipboard!");
  };

  if (loading) return <LoadingScreen text="Memuat Artikel..." />;

  // Jika Artikel Tidak Ditemukan
  if (!article) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-5">
        <Navbar />
        <div className="text-center mt-20">
          <AlertCircle className="w-20 h-20 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Artikel Tidak Ditemukan</h1>
          <p className="text-slate-500 mb-6">Mungkin artikel ini telah dihapus atau tautannya salah.</p>
          <button onClick={() => router.push('/berita')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold transition flex items-center gap-2 mx-auto">
            <ArrowLeft size={18} /> Kembali ke Indeks Berita
          </button>
        </div>
      </main>
    );
  }

  // Format Tanggal Firebase ke Teks Indonesia
  const publishDate = article.createdAt?.toDate 
    ? article.createdAt.toDate().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) 
    : "Tanggal tidak diketahui";

  // Perkiraan Waktu Baca (Asumsi 200 kata per menit)
  const wordCount = article.content ? article.content.replace(/<[^>]*>?/gm, '').split(/\s+/).length : 0;
  const readTime = Math.ceil(wordCount / 200) || 1;

  // Warna Kategori (Sesuai dengan Admin)
  const getCategoryColor = (cat) => {
    switch (cat) {
      case "Opini Kader": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Kajian & Artikel": return "bg-purple-100 text-purple-700 border-purple-200";
      case "Pengumuman": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-blue-100 text-blue-700 border-blue-200"; // Berita Utama
    }
  };

  return (
    <main className="min-h-screen bg-white font-sans text-slate-900 w-full overflow-x-hidden">
      <Navbar />

      {/* Kontainer Utama Artikel */}
      <div className="pt-32 pb-24 px-5 max-w-4xl mx-auto">
        
        {/* Breadcrumb & Navigation */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
            <Link href="/berita" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
              <ArrowLeft size={16} /> Kembali ke Berita
            </Link>
            <div className="flex gap-4 text-slate-400">
                <button onClick={handleShare} className="hover:text-blue-600 transition flex items-center gap-1.5 text-sm font-semibold bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-200" title="Bagikan Artikel">
                  <Share2 size={16} /> <span className="hidden sm:inline">Salin Tautan</span>
                </button>
            </div>
        </div>

        {/* Hero Section: Judul & Meta */}
        <header className="mb-10 text-center md:text-left">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest mb-5 border ${getCategoryColor(article.kategori)}`}>
            <Sparkles size={12} /> {article.kategori || "Berita"}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-[1.25] mb-6 tracking-tight">
            {article.title}
          </h1>
          
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 md:gap-6 text-xs md:text-sm text-slate-500 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100 w-max mx-auto md:mx-0">
             <div className="flex items-center gap-1.5"><User size={16} className="text-blue-600"/> <span className="font-bold text-slate-700">Tim Redaksi</span></div>
             <div className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full"></div>
             <div className="flex items-center gap-1.5"><Calendar size={16} className="text-blue-600"/> {publishDate}</div>
             <div className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full"></div>
             <div className="flex items-center gap-1.5"><Clock size={16} className="text-blue-600"/> {readTime} Menit Baca</div>
          </div>
        </header>

        {/* Featured Image (Cover Artikel Cloudinary) */}
        <div className="w-full h-64 md:h-[450px] bg-slate-100 rounded-3xl mb-12 overflow-hidden shadow-lg border border-slate-200 flex items-center justify-center relative group">
           {article.imageUrl ? (
             <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
           ) : (
             <div className="flex flex-col items-center text-slate-400 bg-slate-50 w-full h-full justify-center">
               <Newspaper size={48} className="mb-2 opacity-30" />
               <span className="font-medium italic text-sm opacity-50">Tanpa Gambar Sampul</span>
             </div>
           )}
        </div>

        {/* ================= AREA KONTEN RICH TEXT (REACT QUILL ENGINE) ================= */}
        <article className="html-content-container max-w-none text-slate-700 leading-loose text-[17px] md:text-lg">
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </article>

        {/* ================= CUSTOM CSS UNTUK RENDER RICH TEXT HTML ================= */}
        <style jsx global>{`
          .html-content-container {
            font-family: inherit;
          }
          
          /* Paragraf & Teks Dasar */
          .html-content-container p {
            margin-bottom: 1.5em;
            color: #334155; /* slate-700 */
          }
          
          /* Heading (H1, H2, H3) */
          .html-content-container h1, 
          .html-content-container h2, 
          .html-content-container h3 {
            font-weight: 800;
            color: #0f172a; /* slate-900 */
            margin-top: 2em;
            margin-bottom: 0.75em;
            line-height: 1.3;
            letter-spacing: -0.025em;
          }
          .html-content-container h1 { font-size: 2.25rem; }
          .html-content-container h2 { font-size: 1.875rem; }
          .html-content-container h3 { font-size: 1.5rem; }
          
          /* List (Bullet & Number) */
          .html-content-container ul, 
          .html-content-container ol {
            margin-bottom: 1.5em;
            padding-left: 1.5em;
          }
          .html-content-container ul { list-style-type: disc; }
          .html-content-container ol { list-style-type: decimal; }
          .html-content-container li { margin-bottom: 0.5em; padding-left: 0.5em; }
          
          /* Tautan (Link) */
          .html-content-container a {
            color: #2563eb; /* blue-600 */
            text-decoration: underline;
            text-underline-offset: 4px;
            font-weight: 600;
            transition: color 0.2s ease;
          }
          .html-content-container a:hover { color: #1d4ed8; }
          
          /* Kutipan (Blockquote) */
          .html-content-container blockquote {
            margin: 2.5em 0;
            padding: 1.5em 2em;
            background-color: #f8fafc; /* slate-50 */
            border-left: 4px solid #2563eb; /* blue-600 */
            border-radius: 0 1rem 1rem 0;
            font-style: italic;
            font-weight: 500;
            color: #1e293b; /* slate-800 */
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }
          
          /* Gambar di dalam artikel */
          .html-content-container img {
            max-width: 100%;
            height: auto;
            border-radius: 1rem;
            margin: 2em auto;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            display: block;
          }
          
          /* Video Embed (YouTube, dll) */
          .html-content-container iframe,
          .html-content-container .ql-video {
            width: 100%;
            aspect-ratio: 16 / 9;
            border-radius: 1rem;
            margin: 2em 0;
            border: none;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          }
          
          /* KELAS ALIGNMENT KHUSUS DARI REACT QUILL */
          .html-content-container .ql-align-center { text-align: center; }
          .html-content-container .ql-align-right { text-align: right; }
          .html-content-container .ql-align-justify { text-align: justify; }
          
          /* KELAS INDENTASI KHUSUS DARI REACT QUILL */
          .html-content-container .ql-indent-1 { padding-left: 3em; }
          .html-content-container .ql-indent-2 { padding-left: 6em; }
          .html-content-container .ql-indent-3 { padding-left: 9em; }
        `}</style>
        {/* =========================================================================== */}

        {/* Separator */}
        <hr className="my-16 border-slate-100 border-2 rounded-full" />

        {/* ================= RELATED ARTICLES SECTION ================= */}
        <section>
          <h3 className="text-2xl font-extrabold text-slate-900 mb-8 flex items-center gap-2">
            <Tag size={24} className="text-blue-600" /> Bacaan Terkait
          </h3>
          
          {relatedNews.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {relatedNews.map((news) => (
                <Link href={`/berita/${news.id}`} key={news.id} className="group flex flex-col p-5 border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-xl transition-all duration-300 bg-white">
                    <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4 bg-slate-100 shrink-0">
                      {news.imageUrl ? (
                        <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 text-xs italic bg-slate-50">
                           <ImageIcon size={24} className="mb-2 opacity-50"/> Tanpa Gambar
                        </div>
                      )}
                      <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider shadow-sm ${getCategoryColor(news.kategori)}`}>
                        {news.kategori || "Berita"}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">{news.title}</h4>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 p-8 rounded-2xl text-center border border-slate-100">
               <p className="text-slate-500 font-medium">Belum ada bacaan terkait lainnya.</p>
            </div>
          )}
        </section>

      </div>
      <Footer />
    </main>
  );
}