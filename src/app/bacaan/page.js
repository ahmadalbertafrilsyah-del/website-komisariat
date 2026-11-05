"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  ZoomIn,
  ZoomOut,
  Columns,
  FileText,
  BookMarked,
  User,
  Calendar,
  Layers,
  Loader2,
  ExternalLink,
  Sun,
  Moon,
} from "lucide-react";

const STARTER_BOOKS = [
  {
    id: "starter-buku-kader-1",
    judul: "Risalah Intelektual & Pedoman Kader PMII Sunan Ampel",
    penulis: "Biro Kaderisasi & Pengembangan Wacana",
    kategori: "Aswaja & Ke-PMII-an",
    tahun: "2026",
    tebalHalaman: "6 Halaman",
    deskripsi:
      "Pengantar nilai dasar pergerakan, paradigma kritis-transformatif, dan kompas intelektual kader PK. PMII Sunan Ampel Malang.",
    coverUrl: "",
    fileUrl: "",
    babList: [
      {
        id: "b1",
        judulBab: "Bab I — Muqaddimah & Khittah Pergerakan",
        isi: "Pergerakan Mahasiswa Islam Indonesia (PMII) lahir dari rahim kesadaran sejarah untuk menjaga tradisi keislaman yang inklusif sekaligus menjawab tantangan modernitas.\n\nDi lingkungan Komisariat Sunan Ampel Malang, setiap kader ditempa tidak hanya untuk memahami teks secara normatif, melainkan mampu melakukan pembacaan sosial (social analysis) dan rekayasa peradaban yang berpihak pada kaum mustadh'afin.\n\nNilai Dasar Pergerakan (NDP) menempatkan Tauhid sebagai poros pembebasan manusia dari segala bentuk belenggu ketidakadilan struktur maupun kultur.",
      },
      {
        id: "b2",
        judulBab: "Bab II — Ahlussunnah wal Jama'ah sebagai Manhajul Fikr",
        isi: "Bagi kader PMII, Ahlussunnah wal Jama'ah (Aswaja) bukan sekadar klaim identitas mazhab, melainkan metode berpikir (Manhajul Fikr) dan metode bergerak (Manhajul Harakah).\n\nEmpat pilar etika sosial Aswaja yang wajib dihidupi setiap kader:\n1. Tawassuth (Moderat & Berkeadilan)\n2. Tawazun (Seimbang dalam dimensi spiritual & intelektual)\n3. Tasamuh (Toleran dalam keberagaman wacana)\n4. I'tidal (Tegak lurus membela kebenaran dan kemanusiaan).",
      },
      {
        id: "b3",
        judulBab: "Bab III — Paradigma Kritis Transformatif",
        isi: "Paradigma Kritis Transformatif menuntut kader PMII untuk memiliki ketajaman analisis teori kritis sekaligus keberanian praksis di lapangan.\n\nIntelektualitas kader diukur dari sejauh mana ilmu pengetahuan yang dipelajari di bangku kuliah mampu diterjemahkan menjadi solusi nyata bagi persoalan masyarakat, kampus, dan bangsa.",
      },
      {
        id: "b4",
        judulBab: "Bab IV — Panca Norma & Etos Literasi Kader",
        isi: "Tradisi membaca, berdiskusi, dan menulis adalah napas utama kaderisasi di Rayon dan Komisariat.\n\nMelalui perpustakaan digital 'Bacaan Kader' ini, seluruh modul MAPABA, PKD, SIG, SKP, serta naskah kajian kader didokumentasikan agar dapat dibaca kapan saja melalui ponsel maupun laptop.",
      },
    ],
  },
];

// Helper deteksi Google Drive URL
function getGoogleDriveEmbedUrl(url = "") {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return null;
}

// Helper load PDF.js dari CDN untuk merender halaman PDF menjadi lembaran buku
let pdfjsLibPromise = null;
function loadPdfJs() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfjsLibPromise) return pdfjsLibPromise;

  pdfjsLibPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      } else {
        reject(new Error("PDF.js gagal dimuat"));
      }
    };
    script.onerror = () => reject(new Error("Gagal mengambil script PDF.js"));
    document.head.appendChild(script);
  });

  return pdfjsLibPromise;
}

// Komponen Render 1 Halaman PDF di atas Canvas Buku
function PdfPageCanvas({ pdfDoc, pageNumber, zoom = 1 }) {
  const canvasRef = useRef(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    let renderTask = null;

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) return;
      setRendering(true);
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const desiredWidth = 680 * zoom;
        const scale = desiredWidth / baseViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        renderTask = page.render({
          canvasContext: context,
          viewport,
        });
        await renderTask.promise;
      } catch {
        // Abaikan jika render dibatalkan saat pindah halaman cepat
      } finally {
        if (!isCancelled) setRendering(false);
      }
    }

    renderPage();
    return () => {
      isCancelled = true;
      if (renderTask && renderTask.cancel) {
        try {
          renderTask.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, pageNumber, zoom]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-auto p-2 sm:p-4">
      {rendering && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-50/40 dark:bg-slate-900/40 backdrop-blur-[1px] z-10">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-1.5" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Membuka Halaman {pageNumber}...
          </span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="max-w-full h-auto rounded shadow-sm bg-white"
      />
    </div>
  );
}

function SafeBookCover({ src, title, kategori }) {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <Image
        src={src}
        alt={title || "Sampul Buku"}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 50vw, 240px"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#020617] p-4 flex flex-col justify-between text-left relative overflow-hidden">
      <div className="absolute inset-2 border border-amber-400/30 rounded pointer-events-none" />
      <div className="relative z-10">
        <span className="text-[8px] font-mono uppercase tracking-widest text-amber-400 block">
          PK. PMII Sunan Ampel
        </span>
        <div className="w-6 h-0.5 bg-amber-400 mt-1" />
      </div>
      <div className="relative z-10 my-auto py-2">
        <h4 className="font-serif font-black text-white text-xs sm:text-sm leading-snug line-clamp-4">
          {title}
        </h4>
      </div>
      <div className="relative z-10 flex items-center justify-between text-[9px] font-mono text-blue-200 border-t border-white/10 pt-1.5">
        <span className="truncate">{kategori || "Modul Kader"}</span>
        <BookOpen size={11} className="text-amber-400 shrink-0" />
      </div>
    </div>
  );
}

export default function BacaanKaderPage() {
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  // State Active Book in 3D Flipbook Reader
  const [activeBook, setActiveBook] = useState(null);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [flipDirection, setFlipDirection] = useState(1); // 1 = next, -1 = prev
  const [paperTheme, setPaperTheme] = useState("sepia"); // "sepia" | "white" | "dark"
  const [spreadMode, setSpreadMode] = useState("double"); // "double" (2 halaman di desktop) | "single"
  const [zoomLevel, setZoomLevel] = useState(1);

  // PDF Document state
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfNumPages, setPdfNumPages] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  // Touch swipe refs for mobile page flipping
  const touchStartX = useRef(null);

  useEffect(() => {
    async function fetchBooks() {
      let loadedBooks = STARTER_BOOKS;
      try {
        const docRef = doc(db, "website_config", "database_buku");
        const docSnap = await getDoc(docRef);
        if (
          docSnap.exists() &&
          Array.isArray(docSnap.data().listBuku) &&
          docSnap.data().listBuku.length > 0
        ) {
          loadedBooks = docSnap.data().listBuku;
        }
      } catch (err) {
        console.error("Gagal memuat perpustakaan:", err);
      } finally {
        setBooks(loadedBooks);
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const bukuId = params.get("buku");
          if (bukuId) {
            const target = loadedBooks.find(
              (b) => String(b.id) === String(bukuId)
            );
            if (target) {
              const hasDirectPdf = Boolean(
                target?.fileUrl && !getGoogleDriveEmbedUrl(target.fileUrl)
              );
              setPdfLoading(hasDirectPdf);
              setActiveBook(target);
              setCurrentSheetIndex(0);
            }
          }
        }
        setLoading(false);
      }
    }
    fetchBooks();
  }, []);

  // Load PDF document when a book with a direct PDF URL is opened
  useEffect(() => {
    let isCancelled = false;

    if (!activeBook?.fileUrl) return;
    const driveEmbed = getGoogleDriveEmbedUrl(activeBook.fileUrl);
    if (driveEmbed) return; // Google Drive ditangani lewat lembar khusus

    async function initPdf() {
      try {
        const pdfjsLib = await loadPdfJs();
        if (!pdfjsLib || isCancelled) return;
        const loadingTask = pdfjsLib.getDocument({
          url: activeBook.fileUrl,
          withCredentials: false,
        });
        const docInstance = await loadingTask.promise;
        if (isCancelled) return;
        setPdfDoc(docInstance);
        setPdfNumPages(docInstance.numPages || 0);
      } catch (err) {
        console.warn("PDF direct canvas fallback:", err);
        if (!isCancelled) setPdfError(true);
      } finally {
        if (!isCancelled) setPdfLoading(false);
      }
    }

    initPdf();
    return () => {
      isCancelled = true;
    };
  }, [activeBook]);

  // Susun daftar seluruh halaman virtual buku (Cover Depan -> Pengantar -> Halaman PDF / Bab -> Sampul Belakang)
  const virtualPages = useMemo(() => {
    if (!activeBook) return [];
    const pages = [];

    // Halaman 1: Sampul Depan (Front Cover)
    pages.push({
      type: "cover",
      title: activeBook.judul,
    });

    // Halaman 2: Lembar Identitas & Sinopsis
    pages.push({
      type: "intro",
      title: "Pengantar & Identitas Buku",
    });

    // Jika PDF berhasil dimuat oleh PDF.js, masukkan setiap halaman PDF sebagai lembar buku!
    if (pdfDoc && pdfNumPages > 0) {
      for (let i = 1; i <= pdfNumPages; i++) {
        pages.push({
          type: "pdf-page",
          pageNumber: i,
          title: `Halaman PDF ${i}`,
        });
      }
    } else if (activeBook.fileUrl) {
      // Jika link Google Drive atau PDF eksternal
      pages.push({
        type: "embed-doc",
        url: getGoogleDriveEmbedUrl(activeBook.fileUrl) || activeBook.fileUrl,
        title: "Dokumen Digital",
      });
    }

    // Jika ada lembar bab teks tambahan
    if (Array.isArray(activeBook.babList) && activeBook.babList.length > 0) {
      activeBook.babList.forEach((bab, idx) => {
        pages.push({
          type: "chapter",
          bab,
          chapterIndex: idx + 1,
          title: bab.judulBab || `Bagian ${idx + 1}`,
        });
      });
    }

    // Halaman Terakhir: Sampul Belakang (Back Cover)
    pages.push({
      type: "back-cover",
      title: "Sampul Belakang",
    });

    return pages;
  }, [activeBook, pdfDoc, pdfNumPages]);

  const totalPages = virtualPages.length;

  // Navigasi membalik halaman
  const handleTurnPage = useCallback(
    (delta) => {
      setFlipDirection(delta > 0 ? 1 : -1);
      setCurrentSheetIndex((prev) => {
        const next = prev + delta;
        if (next < 0) return 0;
        if (next >= totalPages) return totalPages - 1;
        return next;
      });
    },
    [totalPages]
  );

  // Keyboard arrow navigation when reader modal is open
  useEffect(() => {
    if (!activeBook) return;
    const onKeyDown = (e) => {
      if (e.key === "ArrowRight") handleTurnPage(1);
      else if (e.key === "ArrowLeft") handleTurnPage(-1);
      else if (e.key === "Escape") setActiveBook(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeBook, handleTurnPage]);

  const categories = useMemo(() => {
    return [
      "Semua",
      ...new Set(books.map((b) => b.kategori || "Umum").filter(Boolean)),
    ];
  }, [books]);

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return books.filter((b) => {
      const matchCat =
        selectedCategory === "Semua" ||
        (b.kategori || "Umum") === selectedCategory;
      const matchSearch =
        !q ||
        (b.judul || "").toLowerCase().includes(q) ||
        (b.penulis || "").toLowerCase().includes(q) ||
        (b.deskripsi || "").toLowerCase().includes(q) ||
        (b.kategori || "").toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [books, selectedCategory, searchQuery]);

  const openBookReader = (book) => {
    setActiveBook(book);
    setCurrentSheetIndex(0);
    setFlipDirection(1);
    setZoomLevel(1);
  };

  // Warna kertas bacaan
  const paperThemeClasses = {
    sepia:
      "bg-[#fbf7ee] text-[#2c221e] border-[#e6dcc8] shadow-[inset_0_0_40px_rgba(180,150,100,0.12)]",
    white:
      "bg-white text-slate-900 border-slate-200 shadow-[inset_0_0_30px_rgba(0,0,0,0.03)]",
    dark: "bg-[#0f172a] text-slate-100 border-slate-800 shadow-[inset_0_0_40px_rgba(0,0,0,0.4)]",
  };

  // Render isi 1 lembar halaman buku
  const renderSinglePageContent = (pageObj, pageIndex) => {
    if (!pageObj) return null;

    if (pageObj.type === "cover") {
      return (
        <div className="w-full h-full min-h-[460px] sm:min-h-[560px] bg-gradient-to-br from-[#020617] via-[#1e3a8a] to-[#0f172a] text-white p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden select-none">
          {/* Ornamen Bingkai Buku */}
          <div className="absolute inset-3 sm:inset-5 border-2 border-amber-400/35 rounded-lg pointer-events-none" />
          <div className="absolute top-0 left-0 bottom-0 w-5 bg-gradient-to-r from-black/55 to-transparent pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400 bg-white/10 px-3 py-1 rounded-md border border-white/10">
              {activeBook.kategori || "Pustaka Kader"}
            </span>
            <span className="text-xs font-mono text-slate-300">
              {activeBook.tahun || "2026"}
            </span>
          </div>

          <div className="relative z-10 my-auto py-6 text-center max-w-md mx-auto">
            {activeBook.coverUrl && (
              <div className="relative w-32 h-44 sm:w-40 sm:h-52 mx-auto mb-5 rounded-lg overflow-hidden shadow-2xl border-2 border-amber-400/50">
                <SafeBookCover
                  src={activeBook.coverUrl}
                  title={activeBook.judul}
                  kategori={activeBook.kategori}
                />
              </div>
            )}
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-amber-300 mb-2">
              Khazanah Literasi Pergerakan
            </p>
            <h2 className="text-xl sm:text-3xl font-serif font-black leading-snug text-white">
              {activeBook.judul}
            </h2>
            <div className="w-16 h-1 bg-amber-400 mx-auto my-4 rounded-full" />
            <p className="text-xs sm:text-sm font-medium text-blue-200">
              Disusun oleh: {activeBook.penulis || "Tim Kaderisasi PMII"}
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/15 text-[11px] font-mono text-slate-300">
            <span>PK. PMII SUNAN AMPEL MALANG</span>
            <span className="text-amber-400 font-bold animate-pulse">
              Balik Halaman →
            </span>
          </div>
        </div>
      );
    }

    if (pageObj.type === "intro") {
      return (
        <div className="w-full h-full min-h-[460px] sm:min-h-[560px] p-6 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-6 border-b border-current/10 text-[11px] font-mono opacity-60">
              <span>LEMBAR PENGANTAR</span>
              <span>HALAMAN {pageIndex + 1}</span>
            </div>

            <span className="text-[10px] font-mono uppercase tracking-widest text-blue-600 dark:text-amber-400 font-bold">
              Katalog Pustaka Komisariat
            </span>
            <h3 className="text-lg sm:text-2xl font-serif font-black mt-1 mb-4">
              {activeBook.judul}
            </h3>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-black/5 dark:bg-white/5 mb-6 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase opacity-60 block">
                  Penulis / Penyusun
                </span>
                <strong className="font-semibold">
                  {activeBook.penulis || "Tim Kaderisasi"}
                </strong>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase opacity-60 block">
                  Kategori & Tahun
                </span>
                <strong className="font-semibold">
                  {activeBook.kategori} ({activeBook.tahun || "2026"})
                </strong>
              </div>
            </div>

            <h4 className="text-xs font-mono font-bold uppercase tracking-wider opacity-70 mb-2">
              Sinopsis & Pokok Bahasan
            </h4>
            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line opacity-90">
              {activeBook.deskripsi ||
                "Bahan bacaan dan modul kaderisasi resmi Pergerakan Mahasiswa Islam Indonesia (PMII) Komisariat Sunan Ampel Malang. Geser atau klik tombol panah halaman untuk membuka lembar berikutnya."}
            </p>

            {pdfLoading && (
              <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500 shrink-0" />
                <span>
                  Sedang menyiapkan lembaran halaman PDF agar dapat dibalik
                  seperti buku...
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-current/10 flex items-center justify-between text-[11px] font-mono opacity-60">
            <span>Perpustakaan Digital PMII</span>
            <span>Hal. {pageIndex + 1}</span>
          </div>
        </div>
      );
    }

    if (pageObj.type === "pdf-page") {
      return (
        <div className="w-full h-full min-h-[460px] sm:min-h-[560px] flex flex-col justify-between">
          <div className="px-5 pt-3 pb-2 border-b border-current/10 flex items-center justify-between text-[10px] font-mono opacity-60">
            <span className="truncate max-w-[70%]">{activeBook.judul}</span>
            <span>LEMBAR PDF #{pageObj.pageNumber}</span>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <PdfPageCanvas
              pdfDoc={pdfDoc}
              pageNumber={pageObj.pageNumber}
              zoom={zoomLevel}
            />
          </div>

          <div className="px-5 py-2.5 border-t border-current/10 flex items-center justify-between text-[10px] font-mono opacity-60">
            <span>PK. PMII Sunan Ampel Malang</span>
            <span>
              Halaman {pageIndex + 1} / {totalPages}
            </span>
          </div>
        </div>
      );
    }

    if (pageObj.type === "embed-doc") {
      return (
        <div className="w-full h-full min-h-[480px] sm:min-h-[560px] flex flex-col justify-between">
          <div className="px-5 py-3 border-b border-current/10 flex items-center justify-between text-[11px] font-mono">
            <span>DOKUMEN BACAAN DIGITAL</span>
            <a
              href={activeBook.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-amber-400 font-sans font-bold flex items-center gap-1 hover:underline"
            >
              Buka Tab Penuh <ExternalLink size={12} />
            </a>
          </div>
          <div className="flex-1 w-full bg-slate-100 dark:bg-slate-950 relative min-h-[420px]">
            <iframe
              src={pageObj.url}
              title={activeBook.judul}
              className="w-full h-full min-h-[420px] sm:min-h-[500px] border-0"
              allow="autoplay"
            />
          </div>
          <div className="px-5 py-2.5 border-t border-current/10 flex items-center justify-between text-[10px] font-mono opacity-60">
            <span>Mode Pratinjau Dokumen</span>
            <span>Halaman {pageIndex + 1}</span>
          </div>
        </div>
      );
    }

    if (pageObj.type === "chapter") {
      const { bab, chapterIndex } = pageObj;
      return (
        <div className="w-full h-full min-h-[460px] sm:min-h-[560px] p-6 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-6 border-b border-current/10 text-[10px] font-mono uppercase opacity-60">
              <span className="truncate max-w-[70%]">{activeBook.judul}</span>
              <span>BAGIAN 0{chapterIndex}</span>
            </div>

            <h3 className="text-lg sm:text-2xl font-serif font-black mb-5 leading-snug">
              {bab.judulBab}
            </h3>

            <div
              className="font-serif leading-[1.85] whitespace-pre-line opacity-95"
              style={{
                fontSize:
                  zoomLevel > 1.1
                    ? "1.1rem"
                    : zoomLevel < 0.95
                    ? "0.88rem"
                    : "0.98rem",
              }}
            >
              {bab.isi}
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-current/10 flex items-center justify-between text-[11px] font-mono opacity-60">
            <span>{activeBook.penulis}</span>
            <span>
              Halaman {pageIndex + 1} dari {totalPages}
            </span>
          </div>
        </div>
      );
    }

    // Back Cover
    return (
      <div className="w-full h-full min-h-[460px] sm:min-h-[560px] bg-gradient-to-br from-[#020617] via-slate-900 to-[#1e3a8a] text-white p-6 sm:p-10 flex flex-col items-center justify-center text-center relative select-none">
        <div className="absolute inset-4 border border-amber-400/30 rounded-lg pointer-events-none" />
        <BookOpen size={42} className="text-amber-400 mb-3" />
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-400">
          Akhir Lembar Bacaan
        </span>
        <h3 className="text-lg sm:text-2xl font-serif font-black mt-1 mb-2 max-w-md">
          {activeBook.judul}
        </h3>
        <p className="text-xs text-slate-300 max-w-sm leading-relaxed mb-6">
          &ldquo;Dzikir, Fikir, dan Amal Shaleh.&rdquo; Teruslah membaca,
          mendiskusikan, dan mengamalkan ilmu pengetahuan demi kemaslahatan umat
          dan bangsa.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5 relative z-10">
          <button
            type="button"
            onClick={() => {
              setFlipDirection(-1);
              setCurrentSheetIndex(0);
            }}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition"
          >
            ↺ Kembali ke Sampul Depan
          </button>
          {activeBook.fileUrl && (
            <a
              href={activeBook.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Download size={14} /> Unduh Berkas PDF Asli
            </a>
          )}
        </div>
      </div>
    );
  };

  // Variants animasi 3D membalik lembaran buku (Page Flipping 3D)
  const pageFlipVariants = {
    enter: (dir) => ({
      rotateY: dir > 0 ? 88 : -88,
      opacity: 0,
      scale: 0.98,
      transformOrigin: dir > 0 ? "left center" : "right center",
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
      transformOrigin: "center center",
      transition: {
        duration: 0.48,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: (dir) => ({
      rotateY: dir > 0 ? -88 : 88,
      opacity: 0,
      scale: 0.98,
      transformOrigin: dir > 0 ? "left center" : "right center",
      transition: {
        duration: 0.38,
        ease: [0.4, 0, 0.2, 1],
      },
    }),
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] font-sans text-slate-900 dark:text-slate-100 flex flex-col pb-16 xl:pb-0">
      <Navbar />

      {/* ARCHITECTURAL HEADER */}
      <section className="relative pt-28 md:pt-32 pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 bg-[#020617] text-white border-b border-slate-800/80 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-amber-400 to-blue-600" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-950/80 border border-blue-800/70 text-amber-400 text-[11px] font-mono uppercase tracking-widest mb-4">
                <Sparkles size={13} />
                Pustaka Digital & Modul Kaderisasi
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] text-white">
                Pustaka Kader</h1>
              <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                Koleksi modul kaderisasi, buku saku Aswaja, filsafat gerakan,
                dan bahan suplemen intelektual yang dilengkapi{" "}
                <strong className="text-amber-300">
                  Mode Membuka Buku Interaktif (3D Flipbook)
                </strong>
                .
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Koleksi Pustaka
                </p>
                <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                  {books.length}
                </p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Bidang Kajian
                </p>
                <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-0.5">
                  {Math.max(1, categories.length - 1)}
                </p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 col-span-2 sm:col-span-1">
                <p className="text-[10px] font-mono uppercase tracking-wider text-blue-400">
                  Mode Baca
                </p>
                <p className="text-base sm:text-lg font-black text-blue-400 mt-1">
                  3D Flipbook
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH & CATEGORY FILTER BAR */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full -mt-7 relative z-20 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0 hide-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-80 shrink-0">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul buku, penulis, atau materi..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-100"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3D BOOKSHELF GRID */}
      <section className="py-4 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-grow">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 size={32} className="text-blue-600 animate-spin" />
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-lg mx-auto">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Bahan Bacaan Tidak Ditemukan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Coba kata kunci lain atau pilih kategori bacaan yang berbeda.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("Semua");
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {filteredBooks.map((book, idx) => (
              <motion.div
                key={`${book.id || "bk"}-${idx}`}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25 }}
                onClick={() => openBookReader(book)}
                className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/60 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 items-center sm:items-start text-center sm:text-left">
                  {/* 3D Physical Book Cover Representation */}
                  <div
                    className="relative w-20 sm:w-28 md:w-32 aspect-[3/4.2] shrink-0 rounded-r-lg rounded-l-sm shadow-md sm:shadow-lg group-hover:-translate-y-1 transition-transform duration-300 overflow-hidden border border-slate-300 dark:border-slate-700 mx-auto sm:mx-0"
                    style={{
                      boxShadow:
                        "-3px 0 0 #1e293b, -4px 3px 10px rgba(0,0,0,0.2)",
                    }}
                  >
                    {/* Spine crease highlight */}
                    <div className="absolute top-0 bottom-0 left-0 w-2 sm:w-2.5 bg-gradient-to-r from-black/45 via-white/15 to-transparent z-20 pointer-events-none" />
                    <SafeBookCover
                      src={book.coverUrl}
                      title={book.judul}
                      kategori={book.kategori}
                    />
                  </div>

                  {/* Book Metadata */}
                  <div className="flex-1 min-w-0 w-full">
                    <span className="inline-block text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-amber-400 border border-blue-200 dark:border-blue-800 mb-1 sm:mb-2 truncate max-w-full">
                      {book.kategori || "Modul Kader"}
                    </span>

                    <h3 className="font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-amber-400 transition-colors text-xs sm:text-base md:text-lg leading-tight sm:leading-snug line-clamp-2">
                      {book.judul}
                    </h3>

                    <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 sm:mt-1.5 flex items-center justify-center sm:justify-start gap-1 truncate">
                      <User size={11} className="text-blue-500 shrink-0" />
                      <span className="truncate">
                        {book.penulis || "Tim Kaderisasi PMII"}
                      </span>
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 mt-1 sm:mt-2 text-[10px] sm:text-[11px] font-mono text-slate-400">
                      {book.tahun && (
                        <span className="flex items-center gap-1">
                          <Calendar size={10} /> {book.tahun}
                        </span>
                      )}
                      {book.tebalHalaman && (
                        <span>• {book.tebalHalaman}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openBookReader(book);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 sm:py-2.5 px-2 sm:px-4 rounded-lg sm:rounded-xl text-[10px] sm:text-xs flex items-center justify-center gap-1.5 shadow-sm transition truncate"
                  >
                    <BookOpen size={13} className="shrink-0" />
                    <span className="truncate">Baca Flipbook</span>
                  </button>

                  {book.fileUrl && (
                    <a
                      href={book.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shrink-0"
                      title="Unduh File PDF"
                    >
                      <Download size={13} />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ==================== INTERACTIVE 3D BOOK READER MODAL (FLIPBOOK) ==================== */}
      <AnimatePresence>
        {activeBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between overflow-hidden"
          >
            {/* 1. READER TOP CONTROL BAR */}
            <div className="bg-[#020617] border-b border-slate-800 px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-white z-20 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-amber-300 flex items-center justify-center shrink-0">
                  <BookMarked size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-white truncate max-w-[180px] sm:max-w-md">
                    {activeBook.judul}
                  </h3>
                  <p className="text-[10px] font-mono text-amber-400">
                    Lembar {currentSheetIndex + 1} dari {totalPages}
                  </p>
                </div>
              </div>

              {/* Reader Controls (Paper Theme, Zoom, 1/2 Page Spread, Download, Close) */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Paper Theme Selector */}
                <div className="hidden sm:inline-flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setPaperTheme("sepia")}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                      paperTheme === "sepia"
                        ? "bg-[#fbf7ee] text-slate-900"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title="Kertas Klasik (Krem)"
                  >
                    Klasik
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperTheme("white")}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                      paperTheme === "white"
                        ? "bg-white text-slate-900"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title="Kertas Putih"
                  >
                    Putih
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperTheme("dark")}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                      paperTheme === "dark"
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title="Mode Malam"
                  >
                    Malam
                  </button>
                </div>

                {/* Mobile Paper Theme Cycle Button */}
                <button
                  type="button"
                  onClick={() =>
                    setPaperTheme((prev) =>
                      prev === "sepia"
                        ? "white"
                        : prev === "white"
                        ? "dark"
                        : "sepia"
                    )
                  }
                  className="sm:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-amber-400"
                  title="Ganti Warna Kertas"
                >
                  {paperTheme === "dark" ? (
                    <Moon size={15} />
                  ) : (
                    <Sun size={15} />
                  )}
                </button>

                {/* Zoom Controls */}
                <div className="inline-flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      setZoomLevel((z) => Math.max(0.85, +(z - 0.15).toFixed(2)))
                    }
                    className="p-1.5 text-slate-300 hover:text-white"
                    title="Perkecil"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="text-[10px] font-mono px-1.5 text-slate-300 hidden md:inline">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setZoomLevel((z) => Math.min(1.6, +(z + 0.15).toFixed(2)))
                    }
                    className="p-1.5 text-slate-300 hover:text-white"
                    title="Perbesar"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>

                {/* Desktop 2-Page Spread Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    setSpreadMode((m) => (m === "double" ? "single" : "double"))
                  }
                  className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition ${
                    spreadMode === "double"
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                  title="Mode Buku Terbuka 2 Halaman / 1 Halaman"
                >
                  <Columns size={14} />
                  <span>{spreadMode === "double" ? "2 Hal" : "1 Hal"}</span>
                </button>

                {activeBook.fileUrl && (
                  <a
                    href={activeBook.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-900 hover:bg-blue-600 border border-slate-800 text-slate-200 hover:text-white transition"
                    title="Unduh / Buka PDF Asli"
                  >
                    <Download size={15} />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setActiveBook(null)}
                  className="p-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition"
                  title="Tutup Buku (Esc)"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* 2. 3D BOOK STAGE (TENGAH) */}
            <div
              className="flex-1 relative flex items-center justify-center p-2 sm:p-6 overflow-y-auto"
              style={{ perspective: "2200px" }}
              onTouchStart={(e) => {
                touchStartX.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null) return;
                const deltaX = e.changedTouches[0].clientX - touchStartX.current;
                if (deltaX < -50 && currentSheetIndex < totalPages - 1) {
                  handleTurnPage(1);
                } else if (deltaX > 50 && currentSheetIndex > 0) {
                  handleTurnPage(-1);
                }
                touchStartX.current = null;
              }}
            >
              {/* Previous Page Floating Button (Desktop/Tablet) */}
              <button
                type="button"
                disabled={currentSheetIndex === 0}
                onClick={() => handleTurnPage(-1)}
                className="hidden sm:flex fixed left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-2xl bg-slate-900/90 hover:bg-blue-600 disabled:opacity-25 text-white border border-slate-700 items-center justify-center shadow-2xl transition"
                title="Halaman Sebelumnya (Panah Kiri)"
              >
                <ChevronLeft size={24} />
              </button>

              {/* THE 3D PHYSICAL BOOK CONTAINER */}
              <div
                className={`relative w-full ${
                  spreadMode === "double" &&
                  currentSheetIndex > 0 &&
                  currentSheetIndex < totalPages - 1
                    ? "max-w-5xl"
                    : "max-w-2xl"
                } my-auto transition-all duration-300`}
              >
                {/* Efek Tumpukan Lembar Kertas Buku di Sisi Luar */}
                <div className="relative rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.65)] border-4 border-[#1e293b] bg-[#1e293b] p-1 sm:p-2">
                  <AnimatePresence initial={false} custom={flipDirection} mode="wait">
                    <motion.div
                      key={`${currentSheetIndex}-${spreadMode}`}
                      custom={flipDirection}
                      variants={pageFlipVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      style={{ transformStyle: "preserve-3d" }}
                      className={`w-full rounded-xl overflow-hidden border ${paperThemeClasses[paperTheme]} relative`}
                    >
                      {/* Bayangan Lipatan Buku (Book Spine Shadow) */}
                      <div
                        className="pointer-events-none absolute inset-y-0 left-0 w-8 z-20"
                        style={{
                          background:
                            "linear-gradient(to right, rgba(0,0,0,0.18), rgba(0,0,0,0.04) 60%, transparent)",
                        }}
                      />

                      {/* Jika di Desktop, mode 2 halaman aktif, dan bukan di sampul depan: tampilkan 2 halaman berdampingan */}
                      {spreadMode === "double" &&
                      currentSheetIndex > 0 &&
                      currentSheetIndex + 1 < totalPages ? (
                        <div className="grid grid-cols-1 xl:grid-cols-2 relative">
                          {/* Garis Lipatan Tengah Buku (Center Spine Crease) */}
                          <div
                            className="hidden xl:block pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-10 z-20"
                            style={{
                              background:
                                "linear-gradient(to right, transparent, rgba(0,0,0,0.16) 45%, rgba(0,0,0,0.28) 50%, rgba(255,255,255,0.12) 55%, transparent)",
                            }}
                          />
                          <div className="border-b xl:border-b-0 xl:border-r border-current/10">
                            {renderSinglePageContent(
                              virtualPages[currentSheetIndex],
                              currentSheetIndex
                            )}
                          </div>
                          <div className="hidden xl:block">
                            {renderSinglePageContent(
                              virtualPages[currentSheetIndex + 1],
                              currentSheetIndex + 1
                            )}
                          </div>
                        </div>
                      ) : (
                        renderSinglePageContent(
                          virtualPages[currentSheetIndex],
                          currentSheetIndex
                        )
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Next Page Floating Button (Desktop/Tablet) */}
              <button
                type="button"
                disabled={currentSheetIndex >= totalPages - 1}
                onClick={() => handleTurnPage(1)}
                className="hidden sm:flex fixed right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-2xl bg-slate-900/90 hover:bg-blue-600 disabled:opacity-25 text-white border border-slate-700 items-center justify-center shadow-2xl transition"
                title="Halaman Selanjutnya (Panah Kanan)"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* 3. BOTTOM PAGE FLIPPING BAR (NYAMAN DI JEMPOL HP & LAPTOP) */}
            <div className="bg-[#020617] border-t border-slate-800 px-4 py-3 flex items-center justify-between gap-3 text-white z-20 shrink-0">
              <button
                type="button"
                disabled={currentSheetIndex === 0}
                onClick={() => handleTurnPage(-1)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 disabled:opacity-30 border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition shrink-0"
              >
                <ChevronLeft size={15} /> Sebelumnya
              </button>

              {/* Page Slider */}
              <div className="flex-1 max-w-md mx-auto flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, totalPages - 1)}
                  value={currentSheetIndex}
                  onChange={(e) => {
                    const target = Number(e.target.value);
                    setFlipDirection(target >= currentSheetIndex ? 1 : -1);
                    setCurrentSheetIndex(target);
                  }}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[11px] font-mono text-amber-400 whitespace-nowrap">
                  {currentSheetIndex + 1}/{totalPages}
                </span>
              </div>

              <button
                type="button"
                disabled={currentSheetIndex >= totalPages - 1}
                onClick={() => handleTurnPage(1)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white text-xs font-bold flex items-center gap-1.5 transition shrink-0 shadow-sm"
              >
                Selanjutnya <ChevronRight size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
