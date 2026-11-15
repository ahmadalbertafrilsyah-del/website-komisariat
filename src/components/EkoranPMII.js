"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Globe,
  Mail,
  MapPin,
  BookOpen,
  Calendar,
  Clock,
  User,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

const SITE_URL = "https://pmii-uinmalang.or.id";

const FONT_SERIF_FORMAL = "'Georgia', 'Times New Roman', Times, serif";
const FONT_SANS_FORMAL = "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";

const InstagramIcon = ({ size = 12 }) => (
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
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

// Helper membuat slug URL artikel
export const createArticleSlug = (title) => {
  if (!title) return "";
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

// Helper memecah HTML artikel menjadi blok paragraf & subjudul yang bersih
export function parseArticleBlocksForNewspaper(htmlContent = "") {
  if (!htmlContent) return [];

  const cleaned = String(htmlContent)
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, "");

  const blockRegex = /<(h1|h2|h3|h4|blockquote|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const blocks = [];
  let match;

  while ((match = blockRegex.exec(cleaned)) !== null) {
    const tag = match[1].toLowerCase();
    const rawInner = match[2]
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!rawInner) continue;

    if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4") {
      blocks.push({ type: "heading", text: rawInner });
    } else if (tag === "blockquote") {
      blocks.push({ type: "quote", text: rawInner });
    } else if (tag === "li") {
      blocks.push({ type: "bullet", text: rawInner });
    } else {
      blocks.push({ type: "paragraph", text: rawInner });
    }
  }

  if (blocks.length === 0) {
    const plain = cleaned
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();
    plain
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((p) => blocks.push({ type: "paragraph", text: p }));
  }

  return blocks;
}

// Format tanggal lengkap formal (Contoh: Selasa, 21 Juli 2026)
export function formatNewspaperFullDate(dateInput) {
  if (!dateInput) return "Edisi Terbaru";
  const d = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput);
  if (!Number.isFinite(d.getTime())) return String(dateInput);
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Format tanggal ringkas di dateline (Contoh: 21 Juli 2026)
export function formatDatelineDate(dateInput) {
  if (!dateInput) return "";
  const d = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput);
  if (!Number.isFinite(d.getTime())) return String(dateInput);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Warna tema rubrik khas PMII
export function getRubrikTheme(kategori = "Berita Utama") {
  switch (kategori) {
    case "Opini Kader":
      return {
        badgeBg: "#065f46",
        accentColor: "#047857",
        lightBg: "#f0fdf4",
        borderColor: "#bbf7d0",
        label: "OPINI & GAGASAN KADER",
      };
    case "Kajian & Artikel":
      return {
        badgeBg: "#3730a3",
        accentColor: "#4338ca",
        lightBg: "#eef2ff",
        borderColor: "#c7d2fe",
        label: "KAJIAN & INTELEKTUAL",
      };
    case "Pengumuman":
      return {
        badgeBg: "#92400e",
        accentColor: "#b45309",
        lightBg: "#fffbeb",
        borderColor: "#fde68a",
        label: "MAKLUMAT KOMISARIAT",
      };
    default:
      return {
        badgeBg: "#0b2559",
        accentColor: "#1e3a8a",
        lightBg: "#f0f5ff",
        borderColor: "#bfdbfe",
        label: "LAPORAN & BERITA UTAMA",
      };
  }
}

/**
 * ============================================================================
 * 1. KOMPONEN LEMBAR E-KORAN PMII (MODE DOKUMEN PDF — TATA LETAK TETAP)
 * ============================================================================
 * Menggunakan ukuran lembar koran cetak tetap (920px, 3 Kolom) di dalam
 * penampil bergaya PDF (PDF Viewer Mode) yang otomatis menyesuaikan skala layar
 * (auto-scale fit-to-page) di HP maupun Laptop sehingga tata letak E-Koran
 * TIDAK PERNAH BERUBAH atau rusak di ukuran layar mana pun.
 */
export function EkoranSheet({
  article,
  editionLabel = "LEMBAR E-KORAN RESMI",
  pageNumber = null,
  totalPages = null,
  sheetRef = null,
}) {
  const viewerContainerRef = useRef(null);
  const internalSheetRef = useRef(null);
  const [baseScale, setBaseScale] = useState(1);
  const [zoomMultiplier, setZoomMultiplier] = useState(1);
  const [sheetHeight, setSheetHeight] = useState(1280);

  const FIXED_PAGE_WIDTH = 920;

  useEffect(() => {
    const updateScaleAndHeight = () => {
      if (viewerContainerRef.current) {
        const availableW = viewerContainerRef.current.clientWidth - 24;
        const nextScale =
          availableW < FIXED_PAGE_WIDTH
            ? Math.max(0.3, availableW / FIXED_PAGE_WIDTH)
            : 1;
        setBaseScale(nextScale);
      }
      const targetEl = sheetRef?.current || internalSheetRef.current;
      if (targetEl) {
        setSheetHeight(targetEl.offsetHeight || 1280);
      }
    };

    updateScaleAndHeight();
    const timer = setTimeout(updateScaleAndHeight, 250);

    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(updateScaleAndHeight);
      if (viewerContainerRef.current) ro.observe(viewerContainerRef.current);
      const targetEl = sheetRef?.current || internalSheetRef.current;
      if (targetEl) ro.observe(targetEl);
    }

    window.addEventListener("resize", updateScaleAndHeight);
    return () => {
      clearTimeout(timer);
      if (ro) ro.disconnect();
      window.removeEventListener("resize", updateScaleAndHeight);
    };
  }, [article, sheetRef]);

  if (!article) return null;

  const kategori = article.category || article.kategori || "Berita Utama";
  const rubrik = getRubrikTheme(kategori);
  const blocks = parseArticleBlocksForNewspaper(article.content || "");

  const wordCount = (article.content || "")
    .replace(/<[^>]*>?/gm, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const readTime = article.readTime || Math.max(1, Math.ceil(wordCount / 200));

  const rawDate = article.rawDate || article.createdAt || article.date;
  const fullFormalDate = formatNewspaperFullDate(rawDate);
  const datelineDate = formatDatelineDate(rawDate) || article.date || "";

  const slug = createArticleSlug(article.title) || article.id || "";
  const articleUrl = `${SITE_URL}/berita/${encodeURIComponent(slug)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=4&data=${encodeURIComponent(
    articleUrl
  )}`;

  const datelinePrefix = article.dateline
    ? article.dateline.toUpperCase()
    : "MALANG";

  const tagsList = article.tags
    ? String(article.tags)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const effectiveScale = +(baseScale * zoomMultiplier).toFixed(3);
  const scaledWidth = Math.round(FIXED_PAGE_WIDTH * effectiveScale);
  const scaledHeight = Math.round(sheetHeight * effectiveScale);
  const activeSheetRef = sheetRef || internalSheetRef;

  return (
    <div className="w-full max-w-[980px] mx-auto rounded-2xl bg-[#1e293b] border border-slate-700 shadow-2xl overflow-hidden">
      {/* TOOLBAR PENAMPIL DOKUMEN PDF E-KORAN */}
      <div
        className="bg-[#0f172a] text-white px-3.5 sm:px-5 py-2.5 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2 print:hidden"
        style={{ fontFamily: FONT_SANS_FORMAL }}
      >
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
            <FileText size={14} />
          </span>
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-white block leading-tight">
              Pratinjau Lembar Cetak PDF E-Koran
            </span>
            <span className="text-[10px] text-slate-400 block">
              Tata letak koran 3 kolom dikunci tetap (tidak berubah di HP maupun Laptop)
            </span>
          </div>
        </div>

        {/* Kontrol Zoom seperti Pembaca PDF */}
        <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() =>
              setZoomMultiplier((z) => Math.max(0.75, +(z - 0.2).toFixed(2)))
            }
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Perkecil Tampilan"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-[11px] font-mono font-bold text-[#facc15] px-1.5 min-w-[48px] text-center">
            {Math.round(effectiveScale * 100)}%
          </span>
          <button
            type="button"
            onClick={() =>
              setZoomMultiplier((z) => Math.min(2.2, +(z + 0.2).toFixed(2)))
            }
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Perbesar Tampilan"
          >
            <ZoomIn size={14} />
          </button>
          {zoomMultiplier !== 1 && (
            <button
              type="button"
              onClick={() => setZoomMultiplier(1)}
              className="ml-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 flex items-center gap-1"
              title="Sesuaikan Lebar Layar"
            >
              <RotateCcw size={11} /> Pas Layar
            </button>
          )}
        </div>
      </div>

      {/* KANVAS VIEWPORT PENAMPIL PDF */}
      <div
        ref={viewerContainerRef}
        className="w-full overflow-x-auto py-4 sm:py-7 px-3 flex justify-center bg-[#334155]"
      >
        <div
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
            position: "relative",
          }}
        >
          {/* LEMBAR CETAK E-KORAN UKURAN TETAP (920PX — TIDAK BERUBAH DI HP/LAPTOP) */}
          <div
            ref={activeSheetRef}
            className="ekoran-printable-sheet bg-[#fcfbf8] text-slate-900 shadow-[0_14px_45px_rgba(0,0,0,0.45)] border border-slate-300 overflow-hidden"
            style={{
              width: `${FIXED_PAGE_WIDTH}px`,
              transform: `scale(${effectiveScale})`,
              transformOrigin: "top left",
              fontFamily: FONT_SERIF_FORMAL,
            }}
          >
            {/* HEADER BANNER IDENTITAS PMII (BIRU PERGERAKAN & EMAS — UKURAN TETAP) */}
            <div className="bg-[#07193f] text-white px-8 py-6 border-b-4 border-[#facc15] relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 85% 20%, #facc15 0%, transparent 55%)",
                }}
              />
              <div className="relative z-10 flex flex-row items-center justify-between gap-4">
                {/* Kiri: Logo & Nama Terbitan PMII */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-16 rounded-xl bg-white/10 border border-[#facc15]/50 p-1.5 flex items-center justify-center shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/logo.png"
                      alt="Logo PMII"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <div
                      className="flex items-center gap-2 mb-1"
                      style={{ fontFamily: FONT_SANS_FORMAL }}
                    >
                      <span className="px-2 py-0.5 rounded bg-[#facc15] text-[#07193f] text-[10px] font-extrabold uppercase tracking-wider">
                        {editionLabel}
                      </span>
                      <span className="text-[10px] text-amber-200/90 font-semibold uppercase tracking-widest">
                        • PK. PMII Sunan Ampel Malang
                      </span>
                    </div>
                    <h2
                      className="text-[32px] font-bold tracking-tight text-white leading-none"
                      style={{ fontFamily: FONT_SERIF_FORMAL }}
                    >
                      WARA PERGERAKAN
                    </h2>
                    <p
                      className="text-xs text-blue-200 mt-1 font-medium"
                      style={{ fontFamily: FONT_SANS_FORMAL }}
                    >
                      Buletin &amp; Lembar Koran Digital Pergerakan Mahasiswa Islam Indonesia — UIN Malang
                    </p>
                  </div>
                </div>

                {/* Kanan: Kotak Informasi Edisi & Tanggal */}
                <div
                  className="bg-white/8 border border-white/15 rounded-xl px-4 py-2.5 flex flex-col items-end justify-between gap-1.5 shrink-0"
                  style={{ fontFamily: FONT_SANS_FORMAL }}
                >
                  <span
                    className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: rubrik.accentColor }}
                  >
                    {rubrik.label}
                  </span>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#facc15]">
                      {fullFormalDate}
                    </p>
                    <p className="text-[10px] text-slate-300">
                      Estimasi Baca {readTime} Menit
                      {pageNumber
                        ? ` • Lembar ${pageNumber}${totalPages ? `/${totalPages}` : ""}`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* PITA MOTTO TRILOGI PMII */}
            <div
              className="bg-[#f3f0e6] border-b border-slate-300 px-8 py-2 flex items-center justify-between gap-2 text-[11px] text-slate-700 font-semibold"
              style={{ fontFamily: FONT_SANS_FORMAL }}
            >
              <span className="text-[#0b2559] font-bold uppercase tracking-wider">
                Dzikir, Fikir, dan Amal Shaleh
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-600">
                Koran Digital &amp; Dokumentasi Karya Kader
              </span>
              <span className="text-slate-500">•</span>
              <span className="font-mono text-[10px] text-slate-600">
                pmii-uinmalang.or.id
              </span>
            </div>

            {/* KONTEN UTAMA LEMBAR E-KORAN */}
            <div className="p-9">
              {/* Bagian Atas: Judul Formal + Baris Penulis + Foto */}
              <div className="mb-6 pb-5 border-b-2 border-slate-800">
                <div
                  className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: rubrik.badgeBg, fontFamily: FONT_SANS_FORMAL }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: rubrik.badgeBg }}
                  />
                  <span>Rubrik {kategori}</span>
                </div>

                <h1
                  className="text-[30px] font-bold text-slate-950 leading-[1.26] tracking-tight mb-4"
                  style={{ fontFamily: FONT_SERIF_FORMAL }}
                >
                  {article.title}
                </h1>

                {/* Baris Informasi Penulis, Penyunting & Tanggal Terbit */}
                <div
                  className="bg-white rounded-xl border border-slate-200 px-4 py-3 mb-4 flex flex-row items-center justify-between gap-3 shadow-2xs"
                  style={{ fontFamily: FONT_SANS_FORMAL }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#0b2559] text-[#facc15] font-bold text-sm flex items-center justify-center shrink-0 uppercase">
                      {(article.penulis || "R").charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        PENULIS / KONTRIBUTOR
                      </span>
                      <p className="text-sm font-bold text-slate-900">
                        {article.penulis || "Tim Redaksi PMII"}
                      </p>
                    </div>
                    {article.editorName && (
                      <div className="pl-3 border-l border-slate-200 text-xs text-slate-600">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          PENYUNTING
                        </span>
                        <span className="font-semibold text-slate-800">
                          {article.editorName}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end justify-between text-[11px] text-slate-500">
                    <span>Diterbitkan: {datelineDate || fullFormalDate}</span>
                    <span className="font-semibold text-[#0b2559]">
                      Arsip Terverifikasi
                    </span>
                  </div>
                </div>

                {/* Foto Dokumentasi Artikel */}
                {article.imageUrl ? (
                  <div className="flex flex-col">
                    <div className="w-full h-[350px] bg-slate-900 rounded-xl overflow-hidden border border-slate-300 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div
                      className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-slate-600 font-medium"
                      style={{ fontFamily: FONT_SANS_FORMAL }}
                    >
                      <span>Dokumentasi Kegiatan &amp; Wacana PMII</span>
                      <span className="font-semibold text-slate-700">
                        Foto:{" "}
                        {article.fotografer ||
                          article.sumber ||
                          "Dokumentasi PK. PMII Sunan Ampel Malang"}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* ISI NASKAH E-KORAN TETAP 3 KOLOM (SAMA PERSIS SEPERTI CETAK PDF) */}
              <div
                className="columns-3 gap-7 text-[13.6px] leading-[1.7] text-slate-800 text-justify [column-rule:1px_solid_#cbd5e1]"
                style={{ fontFamily: FONT_SERIF_FORMAL }}
              >
                {blocks.map((block, idx) => {
                  if (idx === 0 && block.type === "paragraph") {
                    const firstChar = block.text.charAt(0);
                    const restText = block.text.slice(1);
                    return (
                      <p key={idx} className="mb-4 break-inside-avoid-column">
                        <span
                          className="float-left text-[40px] font-bold leading-[0.85] mr-2.5 mt-1 px-2 py-1 rounded bg-[#0b2559] text-[#facc15]"
                          style={{ fontFamily: FONT_SERIF_FORMAL }}
                        >
                          {firstChar}
                        </span>
                        <strong
                          className="font-bold uppercase tracking-wide text-[#0b2559] text-[12px]"
                          style={{ fontFamily: FONT_SANS_FORMAL }}
                        >
                          {datelinePrefix}
                          {datelineDate ? ` (${datelineDate})` : ""} —{" "}
                        </strong>
                        {firstChar}
                        {restText}
                      </p>
                    );
                  }

                  if (block.type === "heading") {
                    return (
                      <h3
                        key={idx}
                        className="font-bold text-[15px] text-[#07193f] mt-4 mb-2 pb-1 border-b border-slate-300 leading-snug break-after-avoid text-left"
                        style={{ fontFamily: FONT_SERIF_FORMAL }}
                      >
                        {block.text}
                      </h3>
                    );
                  }

                  if (block.type === "quote") {
                    return (
                      <blockquote
                        key={idx}
                        className="my-4 p-3.5 rounded-lg border-l-4 italic text-[13.5px] font-medium text-slate-900 break-inside-avoid text-left"
                        style={{
                          backgroundColor: rubrik.lightBg,
                          borderLeftColor: rubrik.badgeBg,
                        }}
                      >
                        &ldquo;{block.text}&rdquo;
                      </blockquote>
                    );
                  }

                  if (block.type === "bullet") {
                    return (
                      <p
                        key={idx}
                        className="mb-2.5 pl-4 relative break-inside-avoid text-left"
                      >
                        <span className="absolute left-0 font-bold text-[#0b2559]">
                          •
                        </span>
                        {block.text}
                      </p>
                    );
                  }

                  return (
                    <p key={idx} className="mb-3.5">
                      {block.text}
                    </p>
                  );
                })}

                {/* Tagar Artikel */}
                {tagsList.length > 0 && (
                  <div
                    className="mt-4 mb-3 pt-3 border-t border-dashed border-slate-300 flex flex-wrap gap-1.5 break-inside-avoid text-left"
                    style={{ fontFamily: FONT_SANS_FORMAL }}
                  >
                    {tagsList.map((t, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-200/70 text-slate-700"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* KOLOFON REDAKSI & KOTAK QR CODE TETAP */}
              <div
                className="mt-7 pt-5 border-t-2 border-[#07193f] flex flex-row items-stretch justify-between gap-4"
                style={{ fontFamily: FONT_SANS_FORMAL }}
              >
                <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#0b2559] text-[#facc15] flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={13} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        SEKRETARIAT REDAKSI
                      </span>
                      <p className="font-bold text-slate-800 leading-snug">
                        Jl. Sunan Kalijaga Dalam III B-17, Dinoyo, Kota Malang
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Mail size={13} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        SURAT ELEKTRONIK &amp; MEDIA
                      </span>
                      <p className="font-bold text-slate-800 break-all">
                        pmiikomsunanampel@gmail.com
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <InstagramIcon size={11} /> @pmiisunanampelmalang
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-[310px] bg-[#07193f] text-white rounded-xl p-3.5 flex items-center gap-3.5 border border-[#facc15]/40 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt="QR Code Artikel"
                    className="w-16 h-16 object-contain bg-white p-1 rounded-lg shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="inline-block text-[9px] font-extrabold uppercase tracking-widest text-[#facc15] mb-0.5">
                      TAUTAN ARSIP DIGITAL
                    </span>
                    <p className="text-xs font-bold text-white leading-snug">
                      Pindai QR untuk Membaca Artikel di Portal Web
                    </p>
                    <p className="text-[10px] text-blue-200 truncate mt-1 flex items-center gap-1">
                      <Globe size={11} className="shrink-0" /> pmii-uinmalang.or.id
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * 2. KOMPONEN MAJALAH BULANAN YANG DIBUKUKAN (BOOK-BOUND MAGAZINE LAYOUT)
 * ============================================================================
 * Menampilkan kompilasi bulanan seperti buku/majalah cetak yang dijilid rapi,
 * lengkap dengan efek punggung buku (book spine), nomor halaman formal,
 * dan tipografi buku yang formal serta nyaman dibaca di HP maupun Laptop.
 */
export function MonthlyMagazineCover({ edition, onSelectArticleIndex }) {
  if (!edition) return null;
  const { monthLabel, articles = [] } = edition;
  const mainArticle = articles[0] || {};
  const secondaryHighlights = articles.slice(1, 4);

  const countByCat = {
    berita: articles.filter(
      (a) => (a.category || a.kategori) === "Berita Utama"
    ).length,
    opini: articles.filter(
      (a) => (a.category || a.kategori) === "Opini Kader"
    ).length,
    kajian: articles.filter(
      (a) => (a.category || a.kategori) === "Kajian & Artikel"
    ).length,
    pengumuman: articles.filter(
      (a) => (a.category || a.kategori) === "Pengumuman"
    ).length,
  };

  const uniqueAuthors = Array.from(
    new Set(articles.map((a) => a.penulis || "Tim Redaksi"))
  );

  return (
    <div className="space-y-8">
      {/* BAGIAN 1: SAMPUL BUKU MAJALAH BERJILID (HARDCOVER BOOK LOOK) */}
      <div className="ekoran-printable-sheet max-w-[900px] mx-auto relative rounded-r-2xl rounded-l-md shadow-[0_20px_50px_rgba(2,6,23,0.35)] overflow-hidden border border-slate-700 bg-[#07193f] text-white">
        {/* Efek Punggung Jilid Buku (Book Spine) di Sisi Kiri */}
        <div
          className="absolute top-0 bottom-0 left-0 w-4 sm:w-7 z-20 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, #020617 0%, #1e293b 35%, #facc15 55%, #051029 75%, rgba(7,25,63,0) 100%)",
          }}
        />

        {/* Lipatan Dalam Buku */}
        <div className="pl-5 sm:pl-10 pr-4 sm:pr-9 py-6 sm:py-10 relative z-10">
          {/* Kop Atas Sampul Majalah */}
          <div
            className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-[#facc15]/40 text-[10px] sm:text-xs"
            style={{ fontFamily: FONT_SANS_FORMAL }}
          >
            <span className="font-bold uppercase tracking-[0.18em] text-[#facc15]">
              TERBITAN BERKALA BULANAN • PK. PMII SUNAN AMPEL MALANG
            </span>
            <span className="px-2.5 py-0.5 rounded bg-white/10 text-amber-200 font-semibold">
              Edisi {monthLabel}
            </span>
          </div>

          {/* Judul Besar Majalah Formal */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b-2 border-white/15">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-14 h-16 sm:w-18 sm:h-22 rounded-xl bg-white/10 border border-[#facc15]/60 p-2 flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Logo PMII"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p
                  className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em] text-amber-300 mb-1"
                  style={{ fontFamily: FONT_SANS_FORMAL }}
                >
                  JURNAL &amp; MAJALAH KOMISARIAT
                </p>
                <h1
                  className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-none"
                  style={{ fontFamily: FONT_SERIF_FORMAL }}
                >
                  CAKRAWALA <span className="text-[#facc15]">PERGERAKAN</span>
                </h1>
                <p
                  className="text-xs sm:text-sm text-blue-100/90 mt-2 italic"
                  style={{ fontFamily: FONT_SERIF_FORMAL }}
                >
                  Bundel Dokumentasi Berita, Opini Kader, dan Karya Intelektual Bulanan
                </p>
              </div>
            </div>

            <div
              className="bg-slate-950/55 border border-[#facc15]/40 rounded-xl px-4 py-3 text-left sm:text-right shrink-0"
              style={{ fontFamily: FONT_SANS_FORMAL }}
            >
              <span className="block text-[9px] font-bold uppercase tracking-widest text-[#facc15]">
                VOLUME BUKU BULANAN
              </span>
              <p className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                {monthLabel}
              </p>
              <p className="text-[11px] text-slate-300">
                {articles.length} Naskah Terbit
              </p>
            </div>
          </div>

          {/* Sorotan Utama Sampul Buku */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div
              onClick={() => onSelectArticleIndex && onSelectArticleIndex(0)}
              className="lg:col-span-7 group cursor-pointer rounded-xl overflow-hidden border border-white/20 bg-slate-950/60 flex flex-col justify-between relative min-h-[260px] sm:min-h-[320px]"
            >
              {mainArticle.imageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={mainArticle.imageUrl}
                  alt={mainArticle.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/65 to-transparent" />

              <div
                className="relative z-10 p-4 sm:p-5 flex items-center justify-between"
                style={{ fontFamily: FONT_SANS_FORMAL }}
              >
                <span className="px-2.5 py-1 rounded bg-[#facc15] text-slate-950 text-[10px] font-extrabold uppercase tracking-wider">
                  Sorotan Utama Edisi Ini
                </span>
                <span className="text-xs font-mono text-amber-200 bg-slate-950/75 px-2.5 py-1 rounded">
                  Halaman 01
                </span>
              </div>

              <div className="relative z-10 p-4 sm:p-6">
                <p
                  className="text-[11px] font-semibold uppercase tracking-wider text-amber-300 mb-1.5"
                  style={{ fontFamily: FONT_SANS_FORMAL }}
                >
                  {mainArticle.category ||
                    mainArticle.kategori ||
                    "Berita Utama"}{" "}
                  • {mainArticle.date}
                </p>
                <h2
                  className="text-lg sm:text-2xl font-bold text-white leading-snug group-hover:text-[#facc15] transition-colors"
                  style={{ fontFamily: FONT_SERIF_FORMAL }}
                >
                  {mainArticle.title}
                </h2>
                <p
                  className="text-xs text-slate-300 mt-2"
                  style={{ fontFamily: FONT_SANS_FORMAL }}
                >
                  Penulis: <strong>{mainArticle.penulis || "Tim Redaksi"}</strong>
                </p>
              </div>
            </div>

            {/* Daftar Judul Pilihan di Sampul */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-white/8 rounded-xl p-4 sm:p-5 border border-white/15 space-y-4">
              <div>
                <h3
                  className="text-xs font-bold uppercase tracking-widest text-[#facc15] pb-2.5 border-b border-white/15"
                  style={{ fontFamily: FONT_SANS_FORMAL }}
                >
                  ISI DALAM BUKU EDISI INI
                </h3>

                <div className="mt-3 space-y-3">
                  {secondaryHighlights.length > 0 ? (
                    secondaryHighlights.map((item, idx) => (
                      <button
                        key={item.id || idx}
                        type="button"
                        onClick={() =>
                          onSelectArticleIndex && onSelectArticleIndex(idx + 1)
                        }
                        className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/12 border border-white/10 transition group"
                      >
                        <div
                          className="flex items-center justify-between text-[10px] text-amber-300 font-semibold mb-0.5"
                          style={{ fontFamily: FONT_SANS_FORMAL }}
                        >
                          <span>{item.category || item.kategori || "Rubrik"}</span>
                          <span>Hal. 0{idx + 2}</span>
                        </div>
                        <p
                          className="text-xs sm:text-sm font-bold text-white group-hover:text-[#facc15] line-clamp-2 leading-snug"
                          style={{ fontFamily: FONT_SERIF_FORMAL }}
                        >
                          {item.title}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-slate-300 italic py-2">
                      Klik tombol di bawah untuk mulai membuka lembar bacaan majalah.
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectArticleIndex && onSelectArticleIndex(0)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#facc15] hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition shadow"
                style={{ fontFamily: FONT_SANS_FORMAL }}
              >
                <BookOpen size={15} /> Buka Lembar Pertama Majalah →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BAGIAN 2: HALAMAN PEMBUKA BUKU (PENGANTAR REDAKSI & DAFTAR ISI BUKU) */}
      <div className="ekoran-printable-sheet max-w-[900px] mx-auto bg-[#fcfbf7] text-slate-900 rounded-r-2xl rounded-l-md shadow-xl border border-slate-300 relative overflow-hidden">
        {/* Efek Lipatan Jilid Buku di Sisi Kiri */}
        <div
          className="absolute top-0 bottom-0 left-0 w-3 sm:w-5 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(15,23,42,0.22) 0%, rgba(15,23,42,0.06) 55%, transparent 100%)",
          }}
        />

        <div className="pl-5 sm:pl-9 pr-4 sm:pr-8 py-6 sm:py-9">
          {/* Header Halaman Buku */}
          <div
            className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-6 border-b border-slate-300 text-[10px] sm:text-[11px] text-slate-500 font-semibold uppercase tracking-wider"
            style={{ fontFamily: FONT_SANS_FORMAL }}
          >
            <span>CAKRAWALA PERGERAKAN • PK. PMII SUNAN AMPEL MALANG</span>
            <span>PENGANTAR &amp; DAFTAR ISI — EDISI {monthLabel.toUpperCase()}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
            {/* Kolom Kiri Buku: Dewan Redaksi & Statistik Karya */}
            <div className="lg:col-span-4 space-y-4 lg:border-r lg:border-slate-300 lg:pr-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span
                  className="text-[10px] font-extrabold uppercase tracking-widest text-[#0b2559] block mb-1"
                  style={{ fontFamily: FONT_SANS_FORMAL }}
                >
                  CATATAN REDAKSI
                </span>
                <h3
                  className="text-base sm:text-lg font-bold text-slate-900 mb-2"
                  style={{ fontFamily: FONT_SERIF_FORMAL }}
                >
                  Merawat Ingatan &amp; Dialektika Intelektual Kader
                </h3>
                <p
                  className="text-xs sm:text-[13px] text-slate-700 leading-relaxed"
                  style={{ fontFamily: FONT_SERIF_FORMAL }}
                >
                  Setiap karya tulis, laporan kegiatan, serta opini kader yang
                  terbit sepanjang bulan <strong>{monthLabel}</strong> dihimpun
                  dalam bundel majalah ini sebagai arsip literasi resmi
                  Komisariat PMII Sunan Ampel Malang.
                </p>
              </div>

              <div
                className="bg-[#07193f] text-white p-4 rounded-xl space-y-2.5"
                style={{ fontFamily: FONT_SANS_FORMAL }}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#facc15] block">
                  KOMPOSISI NASKAH BULAN INI
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/10 p-2.5 rounded-lg">
                    <span className="text-lg font-extrabold text-white block">
                      {countByCat.berita}
                    </span>
                    <span className="text-[10px] text-blue-200">
                      Berita Utama
                    </span>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-lg">
                    <span className="text-lg font-extrabold text-emerald-300 block">
                      {countByCat.opini}
                    </span>
                    <span className="text-[10px] text-blue-200">
                      Opini Kader
                    </span>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-lg">
                    <span className="text-lg font-extrabold text-indigo-300 block">
                      {countByCat.kajian}
                    </span>
                    <span className="text-[10px] text-blue-200">
                      Kajian Ilmiah
                    </span>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-lg">
                    <span className="text-lg font-extrabold text-amber-300 block">
                      {uniqueAuthors.length}
                    </span>
                    <span className="text-[10px] text-blue-200">
                      Penulis Aktif
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom Kanan Buku: Daftar Isi Formal seperti Buku/Majalah Cetak */}
            <div className="lg:col-span-8">
              <div className="pb-3 mb-4 border-b-2 border-slate-900 flex items-baseline justify-between">
                <h3
                  className="text-xl sm:text-2xl font-bold text-slate-950"
                  style={{ fontFamily: FONT_SERIF_FORMAL }}
                >
                  Daftar Isi Majalah
                </h3>
                <span
                  className="text-xs font-semibold text-slate-600"
                  style={{ fontFamily: FONT_SANS_FORMAL }}
                >
                  {articles.length} Halaman Bacaan
                </span>
              </div>

              <div className="divide-y divide-slate-200">
                {articles.map((art, idx) => {
                  const cat = art.category || art.kategori || "Berita Utama";
                  const theme = getRubrikTheme(cat);
                  return (
                    <button
                      key={art.id || idx}
                      type="button"
                      onClick={() =>
                        onSelectArticleIndex && onSelectArticleIndex(idx)
                      }
                      className="w-full text-left py-3.5 px-2 hover:bg-amber-50/70 rounded-lg transition group flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span
                          className="w-7 h-7 rounded-md bg-[#0b2559] text-[#facc15] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5"
                          style={{ fontFamily: FONT_SERIF_FORMAL }}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <div
                            className="flex flex-wrap items-center gap-2 mb-1"
                            style={{ fontFamily: FONT_SANS_FORMAL }}
                          >
                            <span
                              className="text-[9.5px] font-bold uppercase px-2 py-0.5 rounded text-white"
                              style={{ backgroundColor: theme.badgeBg }}
                            >
                              {cat}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {art.date}
                            </span>
                          </div>
                          <h4
                            className="font-bold text-slate-900 group-hover:text-[#0b2559] text-sm sm:text-base leading-snug"
                            style={{ fontFamily: FONT_SERIF_FORMAL }}
                          >
                            {art.title}
                          </h4>
                          <p
                            className="text-xs text-slate-600 mt-0.5"
                            style={{ fontFamily: FONT_SANS_FORMAL }}
                          >
                            Oleh: <strong>{art.penulis}</strong>
                          </p>
                        </div>
                      </div>

                      <span
                        className="text-xs font-bold text-[#0b2559] bg-slate-100 group-hover:bg-[#facc15] group-hover:text-slate-950 px-2.5 py-1 rounded-md shrink-0 transition"
                        style={{ fontFamily: FONT_SANS_FORMAL }}
                      >
                        Hal. {String(idx + 1).padStart(2, "0")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Nomor Halaman Bawah Buku */}
          <div
            className="mt-8 pt-3 border-t border-slate-300 text-center text-xs text-slate-500 italic"
            style={{ fontFamily: FONT_SERIF_FORMAL }}
          >
            — Halaman Daftar Isi • Majalah Cakrawala Pergerakan ({monthLabel}) —
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * 3. KOMPONEN HALAMAN ISI MAJALAH YANG DIBUKUKAN (MAGAZINE BOOK PAGE)
 * ============================================================================
 * Menampilkan setiap artikel di dalam Majalah Bulanan dengan tata letak
 * halaman buku/majalah yang dijilid (ada lipatan buku di samping, header
 * halaman buku, 2 kolom formal yang enak dibaca di layar lebar & 1 kolom di HP,
 * serta nomor halaman buku di bagian bawah).
 */
export function MagazineBookPage({
  article,
  monthLabel = "Edisi Bulanan",
  pageNumber = 1,
  totalPages = 1,
  sheetRef = null,
}) {
  if (!article) return null;

  const kategori = article.category || article.kategori || "Berita Utama";
  const rubrik = getRubrikTheme(kategori);
  const blocks = parseArticleBlocksForNewspaper(article.content || "");
  const rawDate = article.rawDate || article.createdAt || article.date;
  const datelineDate = formatDatelineDate(rawDate) || article.date || "";

  const slug = createArticleSlug(article.title) || article.id || "";
  const articleUrl = `${SITE_URL}/berita/${encodeURIComponent(slug)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=4&data=${encodeURIComponent(
    articleUrl
  )}`;

  return (
    <div
      ref={sheetRef}
      className="ekoran-printable-sheet max-w-[900px] mx-auto bg-[#fcfbf7] text-slate-900 rounded-r-2xl rounded-l-md shadow-[0_12px_36px_rgba(15,23,42,0.16)] border border-slate-300 relative overflow-hidden"
      style={{ fontFamily: FONT_SERIF_FORMAL }}
    >
      {/* Efek Lipatan Jilid Buku (Book Spine Shadow) di Sisi Kiri */}
      <div
        className="absolute top-0 bottom-0 left-0 w-3.5 sm:w-6 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(15,23,42,0.24) 0%, rgba(15,23,42,0.07) 55%, rgba(255,255,255,0.5) 80%, transparent 100%)",
        }}
      />
      {/* Efek Tumpukan Kertas Buku di Sisi Kanan */}
      <div className="hidden sm:block absolute top-2 bottom-2 right-0 w-1.5 bg-gradient-to-l from-slate-300 via-slate-100 to-transparent pointer-events-none" />

      <div className="pl-5 sm:pl-10 pr-4 sm:pr-9 py-6 sm:py-9">
        {/* KOP ATAS HALAMAN BUKU MAJALAH (RUNNING HEADER) */}
        <div
          className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-6 border-b-2 border-slate-800 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-600"
          style={{ fontFamily: FONT_SANS_FORMAL }}
        >
          <span className="text-[#0b2559] font-extrabold">
            MAJALAH CAKRAWALA PERGERAKAN • {monthLabel.toUpperCase()}
          </span>
          <span
            className="px-2.5 py-0.5 rounded text-white text-[10px] font-bold"
            style={{ backgroundColor: rubrik.badgeBg }}
          >
            Rubrik: {kategori}
          </span>
        </div>

        {/* JUDUL & PENULIS GAYA JURNAL/MAJALAH BUKU */}
        <header className="mb-6">
          <h1
            className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-950 leading-[1.3] mb-3"
            style={{ fontFamily: FONT_SERIF_FORMAL }}
          >
            {article.title}
          </h1>

          <div
            className="flex flex-wrap items-center gap-x-5 gap-y-2 py-2.5 px-3.5 rounded-lg bg-[#f3f0e6] border border-slate-300/80 text-xs text-slate-700"
            style={{ fontFamily: FONT_SANS_FORMAL }}
          >
            <span className="flex items-center gap-1.5 font-bold text-[#0b2559]">
              <User size={13} /> {article.penulis || "Tim Redaksi PMII"}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-500" /> {datelineDate}
            </span>
            {article.readTime && (
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-slate-500" /> {article.readTime} Menit Baca
              </span>
            )}
          </div>
        </header>

        {/* FOTO ARTIKEL DALAM BINGKAI BUKU */}
        {article.imageUrl && (
          <figure className="mb-6 bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="w-full aspect-[16/9] max-h-[340px] bg-slate-900 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
            <figcaption
              className="pt-2 px-1 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-600 italic"
              style={{ fontFamily: FONT_SERIF_FORMAL }}
            >
              <span>Ilustrasi &amp; Dokumentasi Naskah: {article.title}</span>
              <span className="not-italic font-semibold text-slate-700">
                Sumber:{" "}
                {article.fotografer ||
                  article.sumber ||
                  "Dokumentasi PK. PMII Sunan Ampel Malang"}
              </span>
            </figcaption>
          </figure>
        )}

        {/* ISI NASKAH BUKU MAJALAH (1 Kolom di HP, 2 Kolom Buku Formal di Layar Lebar) */}
        <div
          className="columns-1 md:columns-2 gap-8 text-[15px] sm:text-[14.5px] leading-[1.82] text-slate-800 text-left sm:text-justify [column-rule:1px_solid_#e2e8f0]"
          style={{ fontFamily: FONT_SERIF_FORMAL }}
        >
          {blocks.map((block, idx) => {
            if (idx === 0 && block.type === "paragraph") {
              const firstChar = block.text.charAt(0);
              const restText = block.text.slice(1);
              return (
                <p key={idx} className="mb-4 break-inside-avoid-column">
                  <span className="float-left text-4xl font-bold leading-[0.85] mr-2.5 mt-1 px-2 py-1 rounded bg-[#0b2559] text-[#facc15]">
                    {firstChar}
                  </span>
                  {firstChar}
                  {restText}
                </p>
              );
            }

            if (block.type === "heading") {
              return (
                <h3
                  key={idx}
                  className="font-bold text-base text-[#07193f] mt-4 mb-2 leading-snug break-after-avoid text-left"
                >
                  {block.text}
                </h3>
              );
            }

            if (block.type === "quote") {
              return (
                <blockquote
                  key={idx}
                  className="my-4 p-3.5 rounded-lg border-l-4 italic text-[14px] text-slate-900 break-inside-avoid text-left"
                  style={{
                    backgroundColor: rubrik.lightBg,
                    borderLeftColor: rubrik.badgeBg,
                  }}
                >
                  &ldquo;{block.text}&rdquo;
                </blockquote>
              );
            }

            if (block.type === "bullet") {
              return (
                <p
                  key={idx}
                  className="mb-2.5 pl-4 relative break-inside-avoid text-left"
                >
                  <span className="absolute left-0 font-bold text-[#0b2559]">
                    •
                  </span>
                  {block.text}
                </p>
              );
            }

            return (
              <p key={idx} className="mb-4">
                {block.text}
              </p>
            );
          })}
        </div>

        {/* CATATAN KAKI BUKU & NOMOR HALAMAN FORMAL */}
        <footer className="mt-8 pt-4 border-t-2 border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div
            className="flex items-center gap-3"
            style={{ fontFamily: FONT_SANS_FORMAL }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCodeUrl}
              alt="QR Artikel"
              className="w-12 h-12 rounded border border-slate-300 bg-white p-0.5 shrink-0"
            />
            <div className="text-[11px] text-slate-600 leading-snug">
              <p className="font-bold text-slate-900">
                Arsip Digital PK. PMII Sunan Ampel Malang
              </p>
              <p>Pindai QR untuk membaca versi web interaktif</p>
            </div>
          </div>

          <div
            className="w-full sm:w-auto text-center sm:text-right"
            style={{ fontFamily: FONT_SERIF_FORMAL }}
          >
            <span className="inline-block px-3.5 py-1 rounded-full bg-[#0b2559] text-[#facc15] font-bold text-xs">
              Halaman {String(pageNumber).padStart(2, "0")} dari{" "}
              {String(totalPages).padStart(2, "0")}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ============================================================================
// 4. GENERATOR E-KORAN PNG RESOLUSI TINGGI (MURNI HTML5 CANVAS 2D — ANTI ERROR)
// Menggambar desain orisinal "WARA PERGERAKAN" PMII Sunan Ampel Malang
// ============================================================================

function loadImageSafe(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const isExternal =
      /^https?:\/\//i.test(url) && !url.startsWith(window.location.origin);
    const finalSrc = isExternal
      ? `/api/image-proxy?url=${encodeURIComponent(url)}`
      : url;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = finalSrc;
  });
}

function wrapCanvasText(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawJustifiedLine(ctx, line, x, y, maxWidth, isLastLine) {
  const words = line.trim().split(/\s+/);
  if (isLastLine || words.length <= 1) {
    ctx.fillText(line, x, y);
    return;
  }
  const totalWordsWidth = words.reduce(
    (sum, w) => sum + ctx.measureText(w).width,
    0
  );
  const extraSpace = maxWidth - totalWordsWidth;
  if (extraSpace <= 0 || extraSpace > maxWidth * 0.35) {
    ctx.fillText(line, x, y);
    return;
  }
  const gap = extraSpace / (words.length - 1);
  let cursorX = x;
  for (let i = 0; i < words.length; i++) {
    ctx.fillText(words[i], cursorX, y);
    cursorX += ctx.measureText(words[i]).width + gap;
  }
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export async function downloadArticleAsEkoranPng(
  article,
  filename = "E-Koran-PMII.png",
  editionLabel = "LEMBAR E-KORAN RESMI"
) {
  if (!article) return;

  const kategori = article.category || article.kategori || "Berita Utama";
  const rubrik = getRubrikTheme(kategori);
  const blocks = parseArticleBlocksForNewspaper(article.content || "");

  const wordCount = (article.content || "")
    .replace(/<[^>]*>?/gm, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const readTime = article.readTime || Math.max(1, Math.ceil(wordCount / 200));

  const rawDate = article.rawDate || article.createdAt || article.date;
  const fullFormalDate = formatNewspaperFullDate(rawDate);
  const datelineDate = formatDatelineDate(rawDate) || article.date || "";
  const datelinePrefix = article.dateline
    ? article.dateline.toUpperCase()
    : "MALANG";

  const slug = createArticleSlug(article.title) || article.id || "";
  const articleUrl = `${SITE_URL}/berita/${encodeURIComponent(slug)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=4&data=${encodeURIComponent(
    articleUrl
  )}`;

  const [logoImg, coverImg, qrImg] = await Promise.all([
    loadImageSafe("/logo.png"),
    article.imageUrl ? loadImageSafe(article.imageUrl) : Promise.resolve(null),
    loadImageSafe(qrCodeUrl),
  ]);

  const W = 1600;
  const PAD = 68;
  const CONTENT_W = W - PAD * 2;
  const COL_GAP = 38;
  const COL_W = Math.floor((CONTENT_W - COL_GAP * 2) / 3);

  const measureCanvas = document.createElement("canvas");
  const mCtx = measureCanvas.getContext("2d");

  mCtx.font = "700 42px Georgia, 'Times New Roman', serif";
  const titleLines = wrapCanvasText(
    mCtx,
    article.title || "Wara Pergerakan PMII",
    CONTENT_W
  );

  const bodyItems = [];
  const BODY_FONT = "400 21px Georgia, 'Times New Roman', serif";
  const BODY_BOLD_FONT = "700 22px Georgia, 'Times New Roman', serif";
  const QUOTE_FONT = "italic 20px Georgia, 'Times New Roman', serif";
  const LINE_H = 34;

  blocks.forEach((b, idx) => {
    if (idx === 0 && b.type === "paragraph") {
      const fullFirstPara = `${datelinePrefix}${
        datelineDate ? ` (${datelineDate})` : ""
      } — ${b.text}`;
      mCtx.font = BODY_FONT;
      const lines = wrapCanvasText(mCtx, fullFirstPara, COL_W);
      lines.forEach((line, lIdx) => {
        bodyItems.push({
          type: "line",
          text: line,
          isLast: lIdx === lines.length - 1,
          isFirstParaLine: lIdx === 0,
          height: LINE_H,
        });
      });
      bodyItems.push({ type: "spacer", height: 14 });
      return;
    }

    if (b.type === "heading") {
      bodyItems.push({ type: "spacer", height: 10 });
      mCtx.font = BODY_BOLD_FONT;
      const hLines = wrapCanvasText(mCtx, b.text, COL_W);
      hLines.forEach((line) => {
        bodyItems.push({
          type: "headingLine",
          text: line,
          height: 33,
        });
      });
      bodyItems.push({ type: "spacer", height: 6 });
      return;
    }

    if (b.type === "quote") {
      mCtx.font = QUOTE_FONT;
      const qLines = wrapCanvasText(mCtx, `"${b.text}"`, COL_W - 28);
      bodyItems.push({
        type: "quoteBox",
        lines: qLines,
        height: qLines.length * 29 + 28,
      });
      bodyItems.push({ type: "spacer", height: 12 });
      return;
    }

    const prefix = b.type === "bullet" ? "• " : "";
    mCtx.font = BODY_FONT;
    const pLines = wrapCanvasText(mCtx, prefix + b.text, COL_W);
    pLines.forEach((line, lIdx) => {
      bodyItems.push({
        type: "line",
        text: line,
        isLast: lIdx === pLines.length - 1,
        height: LINE_H,
      });
    });
    bodyItems.push({ type: "spacer", height: 14 });
  });

  const totalItemsHeight = bodyItems.reduce((acc, it) => acc + it.height, 0);
  const colTargetHeight = Math.max(420, Math.ceil(totalItemsHeight / 3) + 40);

  const coverSectionH = coverImg ? 520 : 120;
  const headerTopH = 260 + titleLines.length * 52 + coverSectionH;
  const footerH = 160;
  const H = Math.max(1920, headerTopH + colTargetHeight + footerH + 80);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background kertas hangat formal (#fcfbf8)
  ctx.fillStyle = "#fcfbf8";
  ctx.fillRect(0, 0, W, H);

  // 1. Header Banner Biru Pergerakan (#07193f) + Garis Emas (#facc15)
  const bannerH = 165;
  ctx.fillStyle = "#07193f";
  ctx.fillRect(0, 0, W, bannerH);
  ctx.fillStyle = "#facc15";
  ctx.fillRect(0, bannerH, W, 7);

  if (logoImg) {
    ctx.drawImage(logoImg, PAD, 28, 86, 108);
  }

  ctx.textAlign = "left";
  ctx.fillStyle = "#facc15";
  ctx.font = "800 15px Arial, Helvetica, sans-serif";
  ctx.fillText(
    `${editionLabel.toUpperCase()}  •  PK. PMII SUNAN AMPEL MALANG`,
    PAD + 106,
    52
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 50px Georgia, 'Times New Roman', serif";
  ctx.fillText("WARA PERGERAKAN", PAD + 106, 104);

  ctx.fillStyle = "#bfdbfe";
  ctx.font = "600 17px Arial, Helvetica, sans-serif";
  ctx.fillText(
    "Buletin & Lembar Koran Digital Pergerakan Mahasiswa Islam Indonesia — UIN Malang",
    PAD + 106,
    134
  );

  // Kotak Info Kanan di Banner
  const badgeText = rubrik.label;
  ctx.font = "800 15px Arial, Helvetica, sans-serif";
  const badgeW = ctx.measureText(badgeText).width + 28;
  ctx.fillStyle = rubrik.accentColor;
  drawRoundedRect(ctx, W - PAD - badgeW, 34, badgeW, 32, 6);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "right";
  ctx.fillText(badgeText, W - PAD - 14, 55);

  ctx.fillStyle = "#facc15";
  ctx.font = "700 19px Arial, Helvetica, sans-serif";
  ctx.fillText(fullFormalDate, W - PAD, 96);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "500 16px Arial, Helvetica, sans-serif";
  ctx.fillText(`Estimasi Baca ${readTime} Menit`, W - PAD, 124);

  // 2. Pita Trilogi PMII
  let y = bannerH + 7;
  ctx.fillStyle = "#f3f0e6";
  ctx.fillRect(0, y, W, 44);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, y + 44);
  ctx.lineTo(W, y + 44);
  ctx.stroke();

  ctx.font = "700 15px Arial, Helvetica, sans-serif";
  ctx.fillStyle = "#0b2559";
  ctx.textAlign = "left";
  ctx.fillText("DZIKIR, FIKIR, DAN AMAL SHALEH", PAD, y + 27);

  ctx.fillStyle = "#475569";
  ctx.textAlign = "center";
  ctx.fillText("KORAN DIGITAL & DOKUMENTASI KARYA KADER", W / 2, y + 27);

  ctx.textAlign = "right";
  ctx.fillText("PMII-UINMALANG.OR.ID", W - PAD, y + 27);

  y += 82;

  // 3. Judul Artikel Formal
  ctx.textAlign = "left";
  ctx.fillStyle = rubrik.badgeBg;
  ctx.font = "800 16px Arial, Helvetica, sans-serif";
  ctx.fillText(`RUBRIK ${kategori.toUpperCase()}`, PAD, y);
  y += 12;

  ctx.fillStyle = "#020617";
  ctx.font = "700 42px Georgia, 'Times New Roman', serif";
  titleLines.forEach((line) => {
    y += 50;
    ctx.fillText(line, PAD, y);
  });
  y += 28;

  // 4. Baris Penulis & Foto Dokumentasi (Tanpa Intisari Redaksi)
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, PAD, y, CONTENT_W, 68, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#0b2559";
  ctx.font = "800 18px Arial, Helvetica, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    `Penulis: ${article.penulis || "Tim Redaksi PMII"}${
      article.editorName ? `   •   Penyunting: ${article.editorName}` : ""
    }`,
    PAD + 22,
    y + 41
  );

  ctx.fillStyle = "#475569";
  ctx.font = "600 16px Arial, Helvetica, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(
    `Diterbitkan: ${datelineDate || fullFormalDate}`,
    W - PAD - 22,
    y + 41
  );
  y += 88;

  if (coverImg) {
    const boxH = 440;
    ctx.save();
    ctx.fillStyle = "#0f172a";
    drawRoundedRect(ctx, PAD, y, CONTENT_W, boxH, 12);
    ctx.fill();

    const imgRatio = coverImg.width / coverImg.height;
    const boxRatio = CONTENT_W / boxH;
    let sx = 0,
      sy = 0,
      sw = coverImg.width,
      sh = coverImg.height;
    if (imgRatio > boxRatio) {
      sw = coverImg.height * boxRatio;
      sx = (coverImg.width - sw) / 2;
    } else {
      sh = coverImg.width / boxRatio;
      sy = (coverImg.height - sh) / 2;
    }
    ctx.drawImage(coverImg, sx, sy, sw, sh, PAD, y, CONTENT_W, boxH);
    ctx.restore();

    y += boxH + 22;
    ctx.fillStyle = "#475569";
    ctx.font = "600 15px Arial, Helvetica, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(
      `Foto: ${
        article.fotografer ||
        article.sumber ||
        "Dokumentasi PK. PMII Sunan Ampel Malang"
      }`,
      W - PAD,
      y
    );
    y += 22;
  }

  // Garis pemisah sebelum 3 kolom
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
  y += 28;

  // 5. Render Teks dalam 3 Kolom
  const colStartY = y;
  let currentCol = 0;
  let colY = colStartY;
  let maxRenderedY = colStartY;

  ctx.textAlign = "left";

  for (let i = 0; i < bodyItems.length; i++) {
    const item = bodyItems[i];
    const limitY = colStartY + colTargetHeight;

    if (colY + item.height > limitY && currentCol < 2) {
      currentCol++;
      colY = colStartY;
    }

    const activeX = PAD + currentCol * (COL_W + COL_GAP);

    if (item.type === "spacer") {
      colY += item.height;
    } else if (item.type === "headingLine") {
      ctx.font = BODY_BOLD_FONT;
      ctx.fillStyle = "#07193f";
      ctx.fillText(item.text, activeX, colY + 24);
      colY += item.height;
    } else if (item.type === "quoteBox") {
      ctx.fillStyle = rubrik.lightBg;
      ctx.fillRect(activeX, colY + 4, COL_W, item.height - 8);
      ctx.fillStyle = rubrik.badgeBg;
      ctx.fillRect(activeX, colY + 4, 5, item.height - 8);

      ctx.font = QUOTE_FONT;
      ctx.fillStyle = "#1e293b";
      item.lines.forEach((qLine, qIdx) => {
        ctx.fillText(qLine, activeX + 16, colY + 30 + qIdx * 28);
      });
      colY += item.height;
    } else if (item.type === "line") {
      ctx.font = item.isFirstParaLine
        ? "700 21px Georgia, 'Times New Roman', serif"
        : BODY_FONT;
      ctx.fillStyle = "#1e293b";
      drawJustifiedLine(ctx, item.text, activeX, colY + 24, COL_W, item.isLast);
      colY += item.height;
    }

    if (colY > maxRenderedY) maxRenderedY = colY;
  }

  const finalColBottomY = Math.max(
    maxRenderedY + 20,
    colStartY + colTargetHeight
  );
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PAD + COL_W + COL_GAP / 2, colStartY);
  ctx.lineTo(PAD + COL_W + COL_GAP / 2, finalColBottomY);
  ctx.moveTo(PAD + COL_W * 2 + COL_GAP * 1.5, colStartY);
  ctx.lineTo(PAD + COL_W * 2 + COL_GAP * 1.5, finalColBottomY);
  ctx.stroke();

  // 6. Kolofon Bawah & QR Code
  const footerY = H - 145;
  ctx.fillStyle = "#07193f";
  drawRoundedRect(ctx, PAD, footerY, CONTENT_W, 112, 14);
  ctx.fill();

  ctx.fillStyle = "#facc15";
  ctx.font = "800 15px Arial, Helvetica, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    "REDAKSI WARA PERGERAKAN • PK. PMII SUNAN AMPEL MALANG",
    PAD + 28,
    footerY + 36
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 17px Arial, Helvetica, sans-serif";
  ctx.fillText(
    "Sekretariat: Jl. Sunan Kalijaga Dalam III B-17, Dinoyo, Kota Malang  |  Email: pmiikomsunanampel@gmail.com",
    PAD + 28,
    footerY + 66
  );

  ctx.fillStyle = "#93c5fd";
  ctx.font = "600 16px Arial, Helvetica, sans-serif";
  ctx.fillText(
    "Instagram: @pmiisunanampelmalang   •   Portal Resmi: www.pmii-uinmalang.or.id",
    PAD + 28,
    footerY + 94
  );

  if (qrImg) {
    ctx.fillStyle = "#ffffff";
    drawRoundedRect(ctx, W - PAD - 106, footerY + 12, 88, 88, 8);
    ctx.fill();
    ctx.drawImage(qrImg, W - PAD - 102, footerY + 16, 80, 80);
  }

  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadElementAsPng(
  elementOrArticle,
  filename = "E-Koran-PMII.png",
  articleFallback = null
) {
  const articleObj =
    articleFallback ||
    (elementOrArticle &&
    typeof elementOrArticle === "object" &&
    !("nodeType" in elementOrArticle)
      ? elementOrArticle
      : null);

  if (articleObj) {
    await downloadArticleAsEkoranPng(articleObj, filename);
    return;
  }

  throw new Error("Data artikel E-Koran tidak ditemukan");
}

export function printEkoranClean(
  sheetElement,
  docTitle = "E-Koran PMII Sunan Ampel Malang"
) {
  if (typeof window === "undefined") return;
  if (!sheetElement) {
    window.print();
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const printDoc = iframe.contentWindow?.document;
  if (!printDoc) {
    window.print();
    return;
  }

  const headLinks = Array.from(
    document.querySelectorAll('link[rel="stylesheet"], style')
  )
    .map((el) => el.outerHTML)
    .join("\n");

  printDoc.open();
  printDoc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${docTitle}</title>
    ${headLinks}
    <style>
      @page { size: A4 portrait; margin: 8mm; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      body { background: #ffffff !important; color: #0f172a !important; margin: 0; padding: 0; display: flex; justify-content: center; }
      .ekoran-printable-sheet {
        box-shadow: none !important;
        width: 920px !important;
        max-width: none !important;
        transform: none !important;
        zoom: 0.78;
        margin: 0 auto !important;
      }
    </style>
  </head>
  <body>
    ${sheetElement.outerHTML}
  </body>
</html>`);
  printDoc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  }, 600);
}
