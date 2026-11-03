"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  AlertCircle,
  Newspaper,
  Sparkles,
  MessageCircle,
  Link2,
  Users,
  Tag,
  Edit3,
  Camera,
  Globe,
  Eye,
  Send,
  Loader2,
  Check,
  Share2,
  Type,
  ArrowUpRight,
} from "lucide-react";

import { db } from "@/lib/firebase";
import {
  doc,
  collection,
  updateDoc,
  increment,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";

import "react-quill-new/dist/quill.snow.css";

const SITE_URL = "https://pmii-uinmalang.or.id";

const FacebookIcon = ({ size = 18 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TwitterIcon = ({ size = 18 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const createSlug = (title) => {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

const cleanCorruptedHTML = (htmlString) => {
  if (!htmlString) return "";
  return htmlString
    .replace(/word-break:\s*[^;"]+;?/gi, "")
    .replace(/overflow-wrap:\s*[^;"]+;?/gi, "")
    .replace(/white-space:\s*[^;"]+;?/gi, "")
    .replace(/hyphens:\s*[^;"]+;?/gi, "")
    .replace(/&shy;/gi, "")
    .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, "")
    .replace(/-\s*<br\s*\/?>/gi, "-")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/&nbsp;/gi, " ");
};

function SafeSmallAvatar({ src, alt, fallbackIcon }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center relative text-slate-500 dark:text-slate-400">
      {src && !imgError ? (
        <Image
          src={src}
          alt={alt || "Redaksi"}
          fill
          className="object-cover"
          sizes="36px"
          onError={() => setImgError(true)}
        />
      ) : (
        fallbackIcon
      )}
    </div>
  );
}

function SafeCoverImage({ src, alt }) {
  const [imgError, setImgError] = useState(false);
  if (src && !imgError) {
    return (
      <Image
        src={src}
        alt={alt || "Gambar Sampul Berita"}
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 900px"
        priority
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div className="flex flex-col items-center text-slate-400 dark:text-slate-500 w-full h-full justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <Newspaper size={40} className="mb-2 text-amber-400/70" />
      <span className="font-mono text-xs uppercase tracking-widest text-slate-400">
        Dokumentasi Redaksi PMII
      </span>
    </div>
  );
}

export default function BeritaClient({ initialArticle }) {
  const params = useParams();
  const router = useRouter();

  const article = initialArticle;
  const [scrollProgress, setScrollProgress] = useState(0);

  // Reader Comfort State ("sm" | "md" | "lg")
  const [fontScale, setFontScale] = useState("md");
  const [copiedLink, setCopiedLink] = useState(false);

  // Related Articles State
  const [relatedArticles, setRelatedArticles] = useState([]);

  // STATE KOMENTAR
  const [comments, setComments] = useState([]);
  const [newCommentName, setNewCommentName] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Efek Scroll Progress Bar
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scroll = windowHeight > 0 ? (totalScroll / windowHeight) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, scroll)));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Artikel dari server + increment views + ambil 3 berita terkait
  useEffect(() => {
    if (!initialArticle?.id) return;

    updateDoc(doc(db, "berita", initialArticle.id), {
      views: increment(1),
    }).catch((error) =>
      console.error("Gagal memperbarui jumlah kunjungan:", error)
    );

    async function fetchRelated() {
      try {
        const q = query(
          collection(db, "berita"),
          orderBy("createdAt", "desc"),
          limit(6)
        );
        const snap = await getDocs(q);
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((item) => item.id !== initialArticle.id && item.status !== "Draf")
          .slice(0, 3);
        setRelatedArticles(list);
      } catch (err) {
        console.error("Gagal memuat berita terkait:", err);
      }
    }
    fetchRelated();
  }, [initialArticle]);

  // LOAD KOMENTAR REAL-TIME
  useEffect(() => {
    if (!article?.id) return;

    const commentsRef = collection(db, "berita_comments");
    const q = query(commentsRef, where("articleId", "==", article.id));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedComments = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        loadedComments.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });

        setComments(loadedComments);
      },
      (error) => {
        console.error("Error meload komentar:", error);
      }
    );

    return () => unsubscribe();
  }, [article?.id]);

  // SUBMIT KOMENTAR
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newCommentName.trim() || !newCommentText.trim()) return;
    if (!article?.id) return;

    setIsSubmittingComment(true);
    try {
      await addDoc(collection(db, "berita_comments"), {
        articleId: article.id,
        name: newCommentName.trim(),
        text: newCommentText.trim(),
        createdAt: serverTimestamp(),
      });

      const articleRef = doc(db, "berita", article.id);
      await updateDoc(articleRef, { commentsCount: increment(1) });

      setNewCommentName("");
      setNewCommentText("");
    } catch (error) {
      console.error("Error submit comment:", error);
      alert("Gagal mengirim komentar. Pastikan koneksi stabil.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const articleSlug =
    createSlug(article?.title || "") || article?.id || params.id;
  const articleUrl = `${SITE_URL}/berita/${encodeURIComponent(
    articleSlug || ""
  )}`;

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${article?.title || ""} - ${articleUrl}`
    )}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      article?.title || ""
    )}&url=${encodeURIComponent(articleUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      articleUrl
    )}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      alert(`Salin tautan ini: ${articleUrl}`);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title || "Kabar Pergerakan PMII",
          url: articleUrl,
        });
      } catch {
        // dibatalkan
      }
    } else {
      handleCopyLink();
    }
  };

  if (!article) {
    return (
      <main className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex flex-col items-center justify-center p-5 font-sans pb-16 xl:pb-0">
        <Navbar />
        <div className="text-center mt-20 bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Artikel Tidak Ditemukan
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            Maaf, artikel yang Anda cari mungkin telah dihapus atau tautannya
            berubah.
          </p>
          <button
            onClick={() => router.push("/berita")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 w-full shadow-md"
          >
            <ArrowLeft size={16} /> Kembali ke Indeks Berita
          </button>
        </div>
      </main>
    );
  }

  const articleDate = article.createdAt ? new Date(article.createdAt) : null;
  const publishDate =
    articleDate && Number.isFinite(articleDate.getTime())
      ? articleDate.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "Asia/Jakarta",
        })
      : "Tanggal tidak diketahui";

  const wordCount = article.content
    ? article.content
        .replace(/<[^>]*>?/gm, "")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    : 0;
  const readTime = Math.ceil(wordCount / 200) || 1;

  const getCategoryColor = (cat) => {
    switch (cat) {
      case "Opini Kader":
        return "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "Kajian & Artikel":
        return "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800";
      case "Pengumuman":
        return "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      default:
        return "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    }
  };

  const tagsArray = article.tags
    ? article.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "")
    : [];

  const hasRedaksi =
    article.penulis ||
    article.editorName ||
    article.fotografer ||
    article.sumber;

  let finalHtmlContent = cleanCorruptedHTML(article.content);
  if (article.dateline) {
    const datelineHTML = `<strong class="text-slate-900 dark:text-slate-100 uppercase font-mono tracking-wide">${article.dateline} &mdash; </strong>`;
    const pMatch = finalHtmlContent.match(/<p\b[^>]*>(.*?)<\/p>/i);

    if (pMatch && pMatch[0]) {
      const updatedP = pMatch[0].replace(/<p\b[^>]*>/i, `$&${datelineHTML}`);
      finalHtmlContent = finalHtmlContent.replace(pMatch[0], updatedP);
    } else {
      finalHtmlContent = `<p>${datelineHTML}${finalHtmlContent}</p>`;
    }
  }

  const fontSizeDesktop =
    fontScale === "sm" ? "1.02rem" : fontScale === "lg" ? "1.25rem" : "1.125rem";
  const fontSizeMobile =
    fontScale === "sm" ? "0.96rem" : fontScale === "lg" ? "1.16rem" : "1.05rem";

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] font-sans text-slate-900 dark:text-slate-100 w-full overflow-x-hidden selection:bg-blue-200 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100 pb-20 xl:pb-0">
      <Navbar />

      {/* READING PROGRESS BAR */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-600 via-amber-400 to-blue-600 z-[60] transition-all duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="pt-24 md:pt-28 pb-16 px-4 sm:px-6 max-w-4xl mx-auto w-full relative">
        {/* FLOATING SHARE SIDEBAR (Desktop) */}
        <div className="hidden xl:flex flex-col gap-2.5 fixed left-[max(1.5rem,calc(50%-34rem))] top-36 z-20">
          <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mb-0.5">
            Bagikan
          </p>
          <a
            href={shareLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-white dark:bg-slate-900 hover:bg-[#25D366] dark:hover:bg-[#25D366] hover:text-white border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center transition-colors shadow-sm"
            title="Bagikan ke WhatsApp"
          >
            <MessageCircle size={17} />
          </a>
          <a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-white dark:bg-slate-900 hover:bg-[#1DA1F2] dark:hover:bg-[#1DA1F2] hover:text-white border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center transition-colors shadow-sm"
            title="Bagikan ke X/Twitter"
          >
            <TwitterIcon size={17} />
          </a>
          <a
            href={shareLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-white dark:bg-slate-900 hover:bg-[#1877F2] dark:hover:bg-[#1877F2] hover:text-white border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center transition-colors shadow-sm"
            title="Bagikan ke Facebook"
          >
            <FacebookIcon size={17} />
          </a>
          <button
            onClick={handleCopyLink}
            className="w-10 h-10 bg-white dark:bg-slate-900 hover:bg-blue-600 hover:text-white border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center transition-colors shadow-sm"
            title="Salin Tautan"
          >
            {copiedLink ? <Check size={17} className="text-emerald-500" /> : <Link2 size={17} />}
          </button>
        </div>

        {/* ARTICLE CARD CONTAINER */}
        <article className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 shadow-sm">
          {/* Top Navigation & Category */}
          <header className="mb-6 sm:mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <Link
                href="/berita"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-amber-400 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl transition-colors"
              >
                <ArrowLeft size={14} /> Indeks Berita
              </Link>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider border ${getCategoryColor(
                  article.kategori
                )}`}
              >
                <Sparkles size={11} className="shrink-0" />
                {article.kategori || "Berita Utama"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-black text-slate-900 dark:text-white leading-[1.22] md:leading-[1.16] mb-6 tracking-tight">
              {article.title}
            </h1>

            {/* Author & Article Telemetry */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <SafeSmallAvatar
                  src={article.fotoPenulis}
                  alt={article.penulis}
                  fallbackIcon={<User size={16} />}
                />
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {article.penulis || "Tim Redaksi PMII"}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    Penulis Redaksi
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-blue-500" /> {publishDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-500" /> {readTime} mnt
                  baca
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye size={14} className="text-emerald-500" />{" "}
                  {(article.views || 0) + 1}x
                </span>
              </div>
            </div>
          </header>

          {/* COVER IMAGE */}
          <div className="w-full aspect-[16/10] sm:aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl sm:rounded-2xl mb-6 overflow-hidden border border-slate-200/80 dark:border-slate-800 relative">
            <SafeCoverImage src={article.imageUrl} alt={article.title} />
          </div>

          {/* READER COMFORT BAR (KENYAMANAN BACA DI HP & LAPTOP) */}
          <div className="mb-7 p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Type size={14} className="text-blue-600 dark:text-amber-400" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                Ukuran Teks:
              </span>
              <div className="inline-flex rounded-lg bg-white dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setFontScale("sm")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                    fontScale === "sm"
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontScale("md")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                    fontScale === "md"
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setFontScale("lg")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                    fontScale === "lg"
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  A+
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-blue-500 flex items-center gap-1.5 transition"
              >
                {copiedLink ? (
                  <>
                    <Check size={13} className="text-emerald-500" /> Tersalin
                  </>
                ) : (
                  <>
                    <Link2 size={13} /> Salin Link
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleNativeShare}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Share2 size={13} /> Bagikan
              </button>
            </div>
          </div>

          {/* ISI ARTIKEL (HTML) */}
          <div className="ql-snow w-full max-w-[68ch] mx-auto overflow-hidden">
            <div
              id="super-clean-article"
              className="ql-editor w-full text-slate-800 dark:text-slate-200"
              dangerouslySetInnerHTML={{ __html: finalHtmlContent }}
            />
          </div>

          {/* CSS EDITORIAL UNTUK ARTIKEL */}
          <style
            dangerouslySetInnerHTML={{
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
                font-family: var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, sans-serif !important;
                font-size: ${fontSizeDesktop} !important;
                line-height: 1.85 !important;
                color: inherit !important;
              }

              #super-clean-article p { margin-bottom: 1.35rem !important; }

              html.dark #super-clean-article blockquote {
                background-color: #0f172a !important;
                color: #e2e8f0 !important;
                border-left-color: #f59e0b !important;
              }
              html.dark #super-clean-article h2, 
              html.dark #super-clean-article h3 {
                color: #f8fafc !important;
              }
              html.dark #super-clean-article a {
                color: #60a5fa !important;
              }

              #super-clean-article blockquote {
                border-left: 4px solid #2563eb !important;
                background-color: #f8fafc !important;
                padding: 1.1rem 1.4rem !important;
                margin: 2rem 0 !important;
                font-style: italic !important;
                color: #334155 !important;
                border-radius: 0 0.75rem 0.75rem 0;
              }

              #super-clean-article h2, 
              #super-clean-article h3 {
                font-family: inherit !important;
                font-weight: 800 !important;
                color: #0f172a !important;
                margin-top: 2.2rem !important;
                margin-bottom: 0.9rem !important;
                line-height: 1.3 !important;
              }
              #super-clean-article h2 { font-size: 1.45em !important; }
              #super-clean-article h3 { font-size: 1.2em !important; }

              #super-clean-article a {
                color: #2563eb !important;
                text-decoration: underline !important;
                text-underline-offset: 4px;
              }

              #super-clean-article ul, #super-clean-article ol {
                margin-bottom: 1.35rem !important;
                padding-left: 1.5rem !important;
              }
              #super-clean-article li { margin-bottom: 0.5rem !important; }

              #super-clean-article img {
                max-width: 100% !important;
                height: auto !important;
                border-radius: 0.75rem;
                margin: 1.75rem auto;
              }

              @media (max-width: 640px) {
                #super-clean-article {
                  font-size: ${fontSizeMobile} !important;
                  line-height: 1.78 !important;
                  text-align: left !important;
                }
                #super-clean-article p { margin-bottom: 1.15rem !important; }
                #super-clean-article blockquote {
                  padding: 0.85rem 1.1rem !important;
                  margin: 1.5rem 0 !important;
                }
              }
            `,
            }}
          />

          {/* TAGS & SUSUNAN REDAKSI */}
          <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-6">
            {tagsArray.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mr-1">
                  <Tag size={14} className="text-amber-500" /> Topik:
                </span>
                {tagsArray.map((tag, idx) => (
                  <Link
                    key={idx}
                    href={`/berita?search=${encodeURIComponent(tag)}`}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors px-3 py-1 rounded-lg text-xs font-bold"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {hasRedaksi && (
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6">
                <h3 className="font-mono font-bold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-widest text-xs">
                  <Users size={15} className="text-blue-600 dark:text-amber-400" />{" "}
                  Susunan Redaksi Terbitan
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {article.penulis && (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
                      <SafeSmallAvatar
                        src={article.fotoPenulis}
                        alt={article.penulis}
                        fallbackIcon={<User size={15} />}
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          Penulis
                        </p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {article.penulis}
                        </p>
                      </div>
                    </div>
                  )}

                  {article.editorName && (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
                      <SafeSmallAvatar
                        src={article.fotoEditor}
                        alt={article.editorName}
                        fallbackIcon={<Edit3 size={15} />}
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          Editor
                        </p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {article.editorName}
                        </p>
                      </div>
                    </div>
                  )}

                  {article.fotografer && (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
                      <SafeSmallAvatar
                        src={article.fotoFotografer}
                        alt={article.fotografer}
                        fallbackIcon={<Camera size={15} />}
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          Fotografer
                        </p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {article.fotografer}
                        </p>
                      </div>
                    </div>
                  )}

                  {article.sumber && (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
                      <SafeSmallAvatar
                        src={article.logoSumber}
                        alt={article.sumber}
                        fallbackIcon={<Globe size={15} />}
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          Sumber
                        </p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {article.sumber}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Share Bar for Mobile & Tablet */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 text-white">
              <span className="text-xs font-bold tracking-wide">
                Sebarkan wacana ini ke sahabat/i lainnya:
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={shareLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-[#25D366] hover:opacity-90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <MessageCircle size={15} /> WhatsApp
                </a>
                <a
                  href={shareLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-[#1DA1F2] hover:opacity-90 text-white rounded-xl"
                  title="Bagikan ke X"
                >
                  <TwitterIcon size={15} />
                </a>
                <a
                  href={shareLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-[#1877F2] hover:opacity-90 text-white rounded-xl"
                  title="Bagikan ke Facebook"
                >
                  <FacebookIcon size={15} />
                </a>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  {copiedLink ? <Check size={14} /> : <Link2 size={14} />}
                  <span>{copiedLink ? "Tersalin" : "Salin"}</span>
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* RELATED ARTICLES ("BACA JUGA") */}
        {relatedArticles.length > 0 && (
          <section className="mt-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                <Newspaper size={18} className="text-blue-600 dark:text-amber-400" />
                Baca Juga Kabar Lainnya
              </h3>
              <Link
                href="/berita"
                className="text-xs font-bold text-blue-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                Semua Berita <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedArticles.map((rel) => {
                const relSlug = createSlug(rel.title) || rel.id;
                return (
                  <Link
                    key={rel.id}
                    href={`/berita/${relSlug}`}
                    className="group p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 hover:border-blue-500/50 transition flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-amber-400">
                        {rel.kategori || "Berita"}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 text-xs sm:text-sm leading-snug line-clamp-2 mt-1">
                        {rel.title}
                      </h4>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="truncate">{rel.penulis || "Redaksi"}</span>
                      <span className="text-blue-600 dark:text-amber-400 font-sans font-bold">
                        Baca →
                      </span>
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* REAL-TIME COMMENTS SECTION */}
        <section className="mt-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white mb-5 flex items-center gap-2 text-base sm:text-lg">
            <MessageCircle
              size={18}
              className="text-blue-600 dark:text-amber-400"
            />
            Ruang Diskusi & Tanggapan ({comments.length})
          </h3>

          <form
            onSubmit={handleSubmitComment}
            className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 space-y-3"
          >
            <input
              type="text"
              required
              value={newCommentName}
              onChange={(e) => setNewCommentName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none text-xs sm:text-sm font-semibold"
              placeholder="Nama Lengkap / Rayon Anda..."
            />
            <textarea
              required
              rows="3"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none text-xs sm:text-sm resize-none"
              placeholder="Tuliskan gagasan, kritik, atau tanggapan Anda..."
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingComment}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white font-bold py-2.5 px-6 rounded-xl transition flex items-center justify-center gap-2 text-xs sm:text-sm shadow-sm"
              >
                {isSubmittingComment ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                {isSubmittingComment ? "Mengirim..." : "Kirim Tanggapan"}
              </button>
            </div>
          </form>

          {comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment) => {
                const dateStr = comment.createdAt?.toDate
                  ? comment.createdAt.toDate().toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Baru saja";

                return (
                  <div
                    key={comment.id}
                    className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 flex gap-3.5 border border-slate-200/70 dark:border-slate-800"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-blue-950 flex items-center justify-center shrink-0 text-amber-400 font-black text-xs uppercase">
                      {(comment.name || "K").charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {comment.name}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          • {dateStr}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-xs sm:text-sm text-slate-400 py-8 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              Belum ada tanggapan. Jadilah yang pertama memulai dialektika!
            </p>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}
