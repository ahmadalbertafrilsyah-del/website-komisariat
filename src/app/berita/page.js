"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, Calendar, ChevronRight, BookOpen, Sparkles, ExternalLink, Image as ImageIcon, User, Clock } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";

// Fungsi untuk mengubah Judul menjadi URL (Slug)
const createSlug = (title) => {
  if (!title) return "";
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

// Fungsi untuk mengambil cuplikan isi berita (Menghapus HTML & Memotong Teks)
const extractSnippet = (htmlContent, maxLength = 150) => {
  if (!htmlContent) return "";
  // Hapus semua tag HTML, ganti &nbsp; dengan spasi, dan hilangkan spasi berlebih
  let plainText = htmlContent.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength).trim() + '...';
};

export default function Berita() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [visibleCount, setVisibleCount] = useState(7); // Tampilkan 7 berita pertama
  
  const [allArticles, setAllArticles] = useState([]);
  const [externalLink, setExternalLink] = useState("");
  const [loading, setLoading] = useState(true);

  // Tarik data Berita dan Link Eksternal dari Firebase
  useEffect(() => {
    async function fetchBerita() {
      try {
        const configRef = doc(db, "website_config", "berita_config");
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          setExternalLink(configSnap.data().externalNewsLink || "");
        }

        const newsRef = collection(db, "berita");
        const q = query(newsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const fetchedNews = snapshot.docs.map(doc => {
          const data = doc.data();
          let formattedDate = "Tanggal Tidak Diketahui";
          if (data.createdAt) {
            const dateObj = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            formattedDate = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
          }

          return {
            id: doc.id,
            title: data.title || "Tanpa Judul",
            category: data.kategori || "Berita Utama",
            date: formattedDate,
            content: data.content || "", // Tarik isi berita asli
            imageUrl: data.imageUrl || "",
            dateline: data.dateline || "",
            penulis: data.penulis || "Redaksi Komisariat",
            tags: data.tags || ""
          };
        });

        // Hanya tampilkan yang BUKAN Draf
        setAllArticles(fetchedNews.filter(news => news.status !== "Draf"));
      } catch (error) {
        console.error("Gagal memuat berita:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBerita();
  }, []);

  const filteredArticles = allArticles.filter((item) => {
    const matchesCategory = selectedCategory === "Semua" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.tags.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ["Semua", "Berita Utama", "Opini Kader", "Kajian & Artikel", "Pengumuman"];

  const getCategoryColor = (cat, isHero = false) => {
    if (isHero) {
      switch (cat) {
        case "Opini Kader": return "bg-emerald-500 text-white";
        case "Kajian & Artikel": return "bg-purple-500 text-white";
        case "Pengumuman": return "bg-amber-500 text-white";
        default: return "bg-blue-600 text-white"; 
      }
    } else {
      switch (cat) {
        case "Opini Kader": return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "Kajian & Artikel": return "bg-purple-50 text-purple-700 border-purple-200";
        case "Pengumuman": return "bg-amber-50 text-amber-700 border-amber-200";
        default: return "bg-blue-50 text-blue-700 border-blue-200"; 
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans text-slate-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
        <p className="font-bold text-slate-500 tracking-widest text-sm animate-pulse">MENARIK DATA ARSIP REDAKSI...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans flex flex-col">
      <Navbar />

      <div className="flex-grow">
        {/* Header Banner */}
        <section className="pt-36 pb-16 px-4 bg-[#1e293b] text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-tight">
              Kabar <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">Pergerakan</span>
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto text-lg font-light leading-relaxed mb-8">
              "Menanam Gagasan, Menuai Perubahan" Ini adalah ruang dialektika kader—tempat gagasan dirawat, suara disuarakan, dan perubahan dirancang.
            </p>
            {externalLink && (
              <a href={externalLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-8 rounded-full transition-all shadow-lg shadow-blue-600/30 hover:-translate-y-1">
                Kunjungi Portal Utama <ExternalLink size={18} />
              </a>
            )}
          </div>
        </section>

        {/* Filter & Search Bar */}
        <section className="py-8 px-4 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setVisibleCount(7); }}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat ? "bg-slate-800 text-white shadow-md" : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-80">
              <input
                type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(7); }}
                placeholder="Cari berita atau tags..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <Search className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
            </div>
          </div>
        </section>

        {/* ================= TATA LETAK JURNALISTIK PROFESIONAL ================= */}
        <section className="py-4 px-4 max-w-7xl mx-auto mb-20">
          {filteredArticles.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-sm">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg font-medium">Belum ada arsip berita untuk saat ini.</p>
              <p className="text-sm text-slate-400 mt-2">Coba sesuaikan kata kunci pencarian atau kategori.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {filteredArticles.slice(0, visibleCount).map((item, idx) => {
                const articleSlug = createSlug(item.title);
                
                // --- TATA LETAK 1: HEADLINE UTAMA (Besar di Atas) ---
                if (idx === 0) {
                  const snippetText = extractSnippet(item.content, 220); // Snippet lebih panjang untuk Headline
                  return (
                    <div key={item.id} className="md:col-span-12 group">
                      <Link href={`/berita/${articleSlug}`} className="flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 h-full">
                        <div className="md:w-3/5 relative h-64 md:h-[400px] overflow-hidden bg-slate-100">
                          {item.imageUrl ? (
                             <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          ) : (
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400"><ImageIcon size={48} className="opacity-20 mb-2"/></div>
                          )}
                          <div className={`absolute top-4 left-4 text-[10px] font-black px-3 py-1.5 rounded uppercase tracking-widest shadow-md ${getCategoryColor(item.category, true)}`}>
                            {item.category}
                          </div>
                        </div>
                        <div className="md:w-2/5 p-6 md:p-10 flex flex-col justify-center">
                          <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                            <span className="flex items-center gap-1.5 text-blue-600"><Clock size={14}/> TERKINI</span>
                            <span>•</span>
                            <span>{item.date}</span>
                          </div>
                          <h2 className="font-extrabold text-slate-900 text-2xl md:text-3xl lg:text-4xl mb-4 leading-[1.2] group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </h2>
                          <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-6">
                            {item.dateline && <strong className="uppercase text-slate-900">{item.dateline} &mdash; </strong>}
                            {snippetText}
                          </p>
                          <div className="mt-auto flex items-center gap-2 text-sm font-bold text-slate-800">
                             <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300"><User size={12} className="text-slate-500"/></div>
                             {item.penulis}
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                }

                // --- TATA LETAK 2: BERITA SEKUNDER (Kotak / Grid 2 Kolom) ---
                if (idx === 1 || idx === 2) {
                  const snippetText = extractSnippet(item.content, 120);
                  return (
                    <div key={item.id} className="md:col-span-6 group">
                      <Link href={`/berita/${articleSlug}`} className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 h-full">
                        <div className="relative h-56 overflow-hidden bg-slate-100">
                          {item.imageUrl ? (
                             <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400"><ImageIcon size={32} className="opacity-20 mb-2"/></div>
                          )}
                          <div className={`absolute top-4 left-4 text-[10px] font-bold px-3 py-1 rounded border ${getCategoryColor(item.category, false)} uppercase tracking-wider`}>
                            {item.category}
                          </div>
                        </div>
                        <div className="p-6 md:p-8 flex flex-col flex-grow">
                          <h3 className="font-extrabold text-slate-900 text-xl md:text-2xl mb-3 leading-snug group-hover:text-blue-600 transition-colors line-clamp-3">
                            {item.title}
                          </h3>
                          <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3">
                            {item.dateline && <strong className="uppercase text-slate-800">{item.dateline} &mdash; </strong>}
                            {snippetText}
                          </p>
                          <div className="mt-auto flex justify-between items-center text-xs text-slate-400 font-semibold border-t border-slate-100 pt-4">
                            <span className="flex items-center gap-1.5"><Calendar size={14}/> {item.date}</span>
                            <span className="text-blue-600 group-hover:translate-x-1 transition-transform">BACA</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                }

                // --- TATA LETAK 3: FEED BERITA TERBARU (List memanjang ke bawah) ---
                if (idx > 2) {
                  const snippetText = extractSnippet(item.content, 180);
                  return (
                    <div key={item.id} className="md:col-span-12 group">
                      <Link href={`/berita/${articleSlug}`} className="flex flex-col sm:flex-row bg-white rounded-xl overflow-hidden hover:bg-slate-50 transition-colors duration-300 border border-slate-200 border-l-4 hover:border-l-blue-600">
                        <div className="sm:w-1/3 md:w-1/4 relative h-48 sm:h-auto overflow-hidden bg-slate-100 shrink-0">
                          {item.imageUrl ? (
                             <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400"><ImageIcon size={24} className="opacity-20 mb-2"/></div>
                          )}
                        </div>
                        <div className="sm:w-2/3 md:w-3/4 p-5 md:p-6 flex flex-col justify-center">
                          <div className="flex items-center gap-3 mb-2">
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCategoryColor(item.category, false)} uppercase tracking-wider`}>
                               {item.category}
                             </span>
                             <span className="text-xs text-slate-400 font-semibold">{item.date}</span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-lg md:text-xl mb-2 leading-snug group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4">
                            {item.dateline && <strong className="uppercase text-slate-800">{item.dateline} &mdash; </strong>}
                            {snippetText}
                          </p>
                          <div className="mt-auto flex items-center gap-2 text-xs font-semibold text-slate-400">
                             <User size={14}/> {item.penulis}
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                }

              })}
            </div>
          )}

          {/* Tombol Muat Lebih Banyak */}
          {filteredArticles.length > visibleCount && (
            <div className="flex justify-center mt-12">
              <button
                onClick={() => setVisibleCount(visibleCount + 5)}
                className="bg-white border-2 border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 font-bold py-3.5 px-8 rounded-full transition-all shadow-sm flex items-center gap-2 group text-sm"
              >
                Muat Berita Lama <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}