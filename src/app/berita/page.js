"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, Calendar, ChevronRight, BookOpen, Sparkles, ExternalLink, Image as ImageIcon } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";

// Fungsi untuk mengubah Judul menjadi URL (Slug)
const createSlug = (title) => {
  if (!title) return "";
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

export default function Berita() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [visibleCount, setVisibleCount] = useState(6); 
  
  // State untuk data nyata
  const [allArticles, setAllArticles] = useState([]);
  const [externalLink, setExternalLink] = useState("");
  const [loading, setLoading] = useState(true);

  // Tarik data Berita dan Link Eksternal dari Firebase
  useEffect(() => {
    async function fetchBerita() {
      try {
        // 1. Ambil Link Portal Eksternal dari Pengaturan Admin
        const configRef = doc(db, "website_config", "berita_config");
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          setExternalLink(configSnap.data().externalNewsLink || "");
        }

        // 2. Ambil Data Berita Real
        const newsRef = collection(db, "berita");
        const q = query(newsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const fetchedNews = snapshot.docs.map(doc => {
          const data = doc.data();
          // Format tanggal
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
            excerpt: data.excerpt || "Tidak ada deskripsi singkat...",
            imageUrl: data.imageUrl || "" 
          };
        });

        setAllArticles(fetchedNews);
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
                          item.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // DISINKRONKAN DENGAN ADMIN BERITA
  const categories = ["Semua", "Berita Utama", "Opini Kader", "Kajian & Artikel", "Pengumuman"];

  // Fungsi Warna Kategori Cerdas
  const getCategoryColor = (cat, isFeatured = false) => {
    if (isFeatured) {
      // Khusus layout featured di atas gambar gelap, pakai warna cerah
      switch (cat) {
        case "Opini Kader": return "bg-emerald-400 text-emerald-950";
        case "Kajian & Artikel": return "bg-purple-400 text-purple-950";
        case "Pengumuman": return "bg-amber-400 text-amber-950";
        default: return "bg-yellow-400 text-slate-900"; // Berita Utama
      }
    } else {
      // Layout standard (putih)
      switch (cat) {
        case "Opini Kader": return "bg-emerald-100 text-emerald-700";
        case "Kajian & Artikel": return "bg-purple-100 text-purple-700";
        case "Pengumuman": return "bg-amber-100 text-amber-700";
        default: return "bg-blue-100 text-blue-700"; // Berita Utama
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans text-slate-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
        <p className="font-bold text-slate-500 tracking-widest text-sm animate-pulse">MENARIK DATA ARSIP...</p>
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
              Berita & <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">Artikel</span>
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto text-lg font-light leading-relaxed mb-8">
              "Menanam Gagasan, Menuai Perubahan" Ini adalah ruang dialektika kader—tempat gagasan dirawat, suara disuarakan, dan perubahan dirancang. Kami menulis bukan hanya untuk mengabarkan, tetapi untuk menggerakkan. Sebab perubahan tidak lahir dari diam, melainkan dari kesadaran yang diorganisir dalam semangat hablumminannas, hablumminalalam, dan hablumminallah.
            </p>

            {/* TOMBOL LINK PORTAL BERITA UTAMA (MUNCUL JIKA DIISI DI ADMIN) */}
            {externalLink && (
              <a 
                href={externalLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-8 rounded-full transition-all shadow-lg shadow-blue-600/30 hover:-translate-y-1"
              >
                Kunjungi Portal Berita Utama Kami <ExternalLink size={18} />
              </a>
            )}

          </div>
        </section>

        {/* Filter & Search Bar */}
        <section className="py-8 px-4 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            
            {/* Kategori */}
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setVisibleCount(6);
                  }}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Input Pencarian */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(6);
                }}
                placeholder="Cari berita atau tulisan..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Search className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
            </div>
          </div>
        </section>

        {/* Grid Artikel Dinamis */}
        <section className="py-4 px-4 max-w-7xl mx-auto mb-20">
          {filteredArticles.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-16 text-center border border-slate-100 shadow-sm">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg font-medium">Belum ada arsip berita untuk saat ini.</p>
              <p className="text-sm text-slate-400 mt-2">Data ditarik langsung dari database server.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8">
              {filteredArticles.slice(0, visibleCount).map((item, idx) => {
                
                const pattern = idx % 6;
                let gridClass = "";
                let layoutType = "";

                if (pattern === 0) {
                  gridClass = "col-span-1 md:col-span-2 lg:col-span-8";
                  layoutType = "featured";
                } else if (pattern === 5) {
                  gridClass = "col-span-1 md:col-span-2 lg:col-span-12";
                  layoutType = "list";
                } else {
                  gridClass = "col-span-1 md:col-span-1 lg:col-span-4";
                  layoutType = "square";
                }

                // =========================================================================
                // PERBAIKAN: Menggunakan createSlug(item.title) agar link berupa Judul
                // =========================================================================
                const articleSlug = createSlug(item.title);

                return (
                  <Link href={`/berita/${articleSlug}`} key={item.id} className={`${gridClass} block group h-full`}>
                    
                    {/* LAYOUT FEATURED */}
                    {layoutType === "featured" && (
                      <div className="bg-[#1e293b] rounded-3xl overflow-hidden shadow-xl border border-slate-800 flex flex-col md:flex-row h-full hover:shadow-2xl hover:shadow-blue-900/20 hover:-translate-y-1 transition-all duration-300">
                        <div className="md:w-1/2 relative h-64 md:h-full bg-slate-800 overflow-hidden flex-shrink-0">
                          {item.imageUrl ? (
                             <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          ) : (
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 font-medium z-10 bg-slate-900">
                                <ImageIcon size={32} className="mb-2 opacity-50"/>
                                <span className="text-xs">Tanpa Gambar</span>
                             </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] via-transparent to-transparent z-20 md:bg-gradient-to-r"></div>
                          <span className={`absolute top-6 left-6 shadow-lg text-xs font-bold px-4 py-2 rounded-full z-30 uppercase tracking-wider flex items-center gap-1.5 ${getCategoryColor(item.category, true)}`}>
                            <Sparkles size={14}/> {item.category}
                          </span>
                        </div>
                        <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center flex-grow">
                          <div className="flex items-center gap-2 text-sm text-slate-400 font-medium mb-4">
                            <Calendar size={16} className="text-yellow-400" /> {item.date}
                          </div>
                          <h3 className="font-extrabold text-white text-2xl md:text-3xl mb-4 leading-tight group-hover:text-yellow-400 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-slate-400 text-base line-clamp-3 mb-8 leading-relaxed">
                            {item.excerpt}
                          </p>
                          <div className="mt-auto inline-flex items-center gap-2 font-bold text-yellow-400 w-max group-hover:translate-x-2 transition-transform">
                            Baca Selengkapnya <ChevronRight size={18} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LAYOUT SQUARE */}
                    {layoutType === "square" && (
                      <div className="bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="relative h-52 bg-slate-200 overflow-hidden flex-shrink-0">
                          {item.imageUrl ? (
                             <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-sm font-medium z-10 bg-slate-100">
                                <ImageIcon size={24} className="mb-2 opacity-30"/>
                                <span className="text-xs italic">Tanpa Gambar</span>
                             </div>
                          )}
                          <span className={`absolute top-4 left-4 shadow-sm text-[10px] font-bold px-3 py-1.5 rounded-md z-20 uppercase tracking-wider ${getCategoryColor(item.category, false)}`}>
                            {item.category}
                          </span>
                        </div>
                        <div className="p-6 md:p-8 flex flex-col flex-grow">
                          <h3 className="font-bold text-slate-900 text-xl mb-3 leading-snug group-hover:text-blue-600 transition-colors line-clamp-3">
                            {item.title}
                          </h3>
                          <p className="text-slate-500 text-sm line-clamp-3 mb-6 leading-relaxed">
                            {item.excerpt}
                          </p>
                          <div className="mt-auto pt-5 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {item.date}</span>
                            <span className="text-blue-600 font-bold group-hover:translate-x-1 transition-transform">Baca <ChevronRight size={14}/></span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LAYOUT LIST */}
                    {layoutType === "list" && (
                      <div className="bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="md:w-1/3 lg:w-1/4 relative h-48 md:h-auto bg-slate-200 overflow-hidden flex-shrink-0">
                           {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                           ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-sm font-medium z-10 bg-slate-100">
                                <ImageIcon size={24} className="mb-2 opacity-30"/>
                                <span className="text-xs italic">Tanpa Gambar</span>
                              </div>
                           )}
                           <span className={`absolute top-4 left-4 md:hidden text-[10px] font-bold px-3 py-1.5 rounded-md z-20 uppercase tracking-wider ${getCategoryColor(item.category, false)}`}>
                             {item.category}
                           </span>
                        </div>
                        <div className="md:w-2/3 lg:w-3/4 p-6 md:p-8 flex flex-col justify-center flex-grow relative">
                          <div className="hidden md:flex items-center gap-3 mb-3">
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-wider ${getCategoryColor(item.category, false)}`}>
                              {item.category}
                            </span>
                            <span className="text-sm text-slate-400 font-medium flex items-center gap-1.5"><Calendar size={14} /> {item.date}</span>
                          </div>
                          
                          <h3 className="font-extrabold text-slate-900 text-xl md:text-2xl mb-3 leading-snug group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-slate-500 text-sm md:text-base line-clamp-2 md:line-clamp-3 mb-6 max-w-4xl leading-relaxed">
                            {item.excerpt}
                          </p>
                          
                          <div className="mt-auto md:absolute md:bottom-8 md:right-8 flex md:hidden items-center text-xs text-slate-500 font-medium border-t border-slate-100 pt-4">
                             <span className="flex items-center gap-1.5"><Calendar size={14} /> {item.date}</span>
                          </div>
                          
                          <div className="hidden md:flex items-center gap-1 text-blue-600 font-bold absolute bottom-8 right-8 group-hover:translate-x-1 transition-transform">
                            Lanjut Membaca <ChevronRight size={18}/>
                          </div>
                        </div>
                      </div>
                    )}

                  </Link>
                );
              })}
            </div>
          )}

          {/* Tombol Muat Lebih Banyak */}
          {filteredArticles.length > visibleCount && (
            <div className="flex justify-center mt-16">
              <button
                onClick={() => setVisibleCount(visibleCount + 4)}
                className="bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 font-bold py-3.5 px-10 rounded-full transition-all shadow-sm flex items-center gap-2 group"
              >
                Tampilkan Lebih Banyak <ChevronRight size={18} className="group-hover:rotate-90 transition-transform" />
              </button>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}