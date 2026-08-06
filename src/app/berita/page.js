"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, ChevronRight, BookOpen, ExternalLink, Image as ImageIcon, User, Clock } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";

const createSlug = (title) => {
  if (!title) return "";
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

const extractSnippet = (htmlContent, maxLength = 150) => {
  if (!htmlContent) return "";
  let plainText = htmlContent.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength).trim() + '...';
};

export default function Berita() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [visibleCount, setVisibleCount] = useState(7);
  
  const [allArticles, setAllArticles] = useState([]);
  const [externalLink, setExternalLink] = useState("");
  const [loading, setLoading] = useState(true);

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
            content: data.content || "",
            imageUrl: data.imageUrl || "",
            dateline: data.dateline || "",
            penulis: data.penulis || "Redaksi",
            tags: data.tags || ""
          };
        });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans text-slate-800">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-4"></div>
        <p className="font-bold text-slate-500 tracking-widest text-xs animate-pulse uppercase">Memuat Redaksi...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans flex flex-col">
      <Navbar />

      <div className="flex-grow">
        {/* BANNER HERO (CLEAN & EDITORIAL) */}
        <section className="pt-32 pb-24 px-5 bg-slate-900 text-center relative border-b border-slate-800">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
              Kabar <span className="text-blue-400">Pergerakan</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base font-medium max-w-2xl mx-auto leading-relaxed mb-8">
              "Menanam Gagasan, Menuai Perubahan." Ruang dialektika kader—tempat wacana dirawat, suara disuarakan, dan perubahan dirancang.
            </p>
            {externalLink && (
              <a href={externalLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-sm text-sm">
                Buka Portal Berita Terluar <ExternalLink size={16} />
              </a>
            )}
          </div>
        </section>

        {/* FILTER BAR (CLEAN) */}
        <section className="px-5 max-w-6xl mx-auto w-full -mt-7 relative z-20">
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2 items-center">
            <div className="flex gap-1 overflow-x-auto w-full md:w-auto p-1 hide-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setVisibleCount(7); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat ? "bg-slate-900 text-white" : "bg-transparent hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="hidden md:block w-px h-8 bg-slate-200 mx-2"></div>
            <div className="relative w-full flex-1">
              <input
                type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(7); }}
                placeholder="Cari berita atau wacana..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors border border-transparent"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>
        </section>

        {/* GRID BERITA */}
        <section className="py-12 px-5 max-w-6xl mx-auto mb-16">
          {filteredArticles.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-sm">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-800 font-bold text-lg">Belum ada arsip berita.</p>
              <p className="text-sm text-slate-500 mt-1">Coba sesuaikan kata kunci atau pilih kategori lain.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {filteredArticles.slice(0, visibleCount).map((item, idx) => {
                const articleSlug = createSlug(item.title);
                
                // HEADLINE UTAMA (Besar di Atas)
                if (idx === 0) {
                  const snippetText = extractSnippet(item.content, 200);
                  return (
                    <div key={item.id} className="md:col-span-12 group">
                      <Link href={`/berita/${articleSlug}`} className="flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-300 transition-colors h-full">
                        <div className="md:w-3/5 relative h-64 md:h-[420px] bg-slate-100 overflow-hidden">
                          {item.imageUrl ? (
                             <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          ) : (
                             <div className="absolute inset-0 flex items-center justify-center text-slate-300"><ImageIcon size={48}/></div>
                          )}
                        </div>
                        <div className="md:w-2/5 p-6 md:p-10 flex flex-col justify-center">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                            <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">{item.category}</span>
                            <span>•</span>
                            <span>{item.date}</span>
                          </div>
                          <h2 className="font-extrabold text-slate-900 text-2xl md:text-4xl mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </h2>
                          <p className="text-slate-500 text-sm leading-relaxed mb-6">
                            {item.dateline && <strong className="uppercase text-slate-800">{item.dateline} — </strong>}
                            {snippetText}
                          </p>
                          <div className="mt-auto flex items-center gap-2 text-xs font-bold text-slate-700">
                             <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200"><User size={12} className="text-slate-400"/></div>
                             Oleh {item.penulis}
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                }

                // GRID BERITA SEKUNDER (2 Kolom)
                if (idx === 1 || idx === 2) {
                  const snippetText = extractSnippet(item.content, 120);
                  return (
                    <div key={item.id} className="md:col-span-6 group">
                      <Link href={`/berita/${articleSlug}`} className="flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-300 transition-colors h-full">
                        <div className="relative h-56 bg-slate-100 overflow-hidden">
                          {item.imageUrl ? (
                             <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                             <div className="absolute inset-0 flex items-center justify-center text-slate-300"><ImageIcon size={32}/></div>
                          )}
                        </div>
                        <div className="p-6 flex flex-col flex-grow">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                             <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">{item.category}</span>
                             <span className="flex items-center gap-1"><Clock size={10}/> {item.date}</span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-xl mb-3 leading-snug group-hover:text-blue-600 transition-colors line-clamp-3">
                            {item.title}
                          </h3>
                          <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2 flex-grow">
                            {snippetText}
                          </p>
                        </div>
                      </Link>
                    </div>
                  );
                }

                // LIST BERITA TERBARU (Baris Memanjang)
                if (idx > 2) {
                  return (
                    <div key={item.id} className="md:col-span-12 group">
                      <Link href={`/berita/${articleSlug}`} className="flex flex-col sm:flex-row bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-300 transition-colors">
                        <div className="sm:w-1/4 relative h-48 sm:h-auto bg-slate-100 overflow-hidden shrink-0">
                          {item.imageUrl ? (
                             <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                             <div className="absolute inset-0 flex items-center justify-center text-slate-300"><ImageIcon size={24}/></div>
                          )}
                        </div>
                        <div className="sm:w-3/4 p-5 md:p-6 flex flex-col justify-center">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                             <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">{item.category}</span>
                             <span>{item.date}</span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-lg mb-2 leading-snug group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4">
                            {extractSnippet(item.content, 150)}
                          </p>
                        </div>
                      </Link>
                    </div>
                  );
                }
              })}
            </div>
          )}

          {filteredArticles.length > visibleCount && (
            <div className="flex justify-center mt-10">
              <button onClick={() => setVisibleCount(visibleCount + 5)} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-bold py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2 text-sm">
                Tampilkan Lebih Banyak <ChevronRight size={16} />
              </button>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}