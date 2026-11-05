"use client";

import { useEffect, useState } from "react";
import { Download, Share2, X, PlusSquare } from "lucide-react";

export default function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .catch((err) => console.log("SW register fail:", err));
      });
    }

    // 2. Deteksi status standalone & perangkat iOS
    const checkStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    // Cek apakah user pernah menutup banner dalam 7 hari terakhir
    const dismissedAt = localStorage.getItem("pmii_pwa_dismissed");
    const isDismissedRecently =
      dismissedAt && Date.now() - Number(dismissedAt) < 7 * 24 * 60 * 60 * 1000;

    // 3. Tangkap beforeinstallprompt (Android / Chrome)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isDismissedRecently && !checkStandalone) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Tampilkan prompt setelah delay agar tidak mengganggu pengguna saat pertama kali buka
    const initTimer = setTimeout(() => {
      setIsStandalone(checkStandalone);
      setIsIos(isIosDevice);
      if (isIosDevice && !isDismissedRecently && !checkStandalone) {
        setShowPrompt(true);
      }
    }, 3500);

    return () => {
      clearTimeout(initTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback jika browser lain di HP
      alert("Untuk memasang aplikasi ini di layar utama: Buka menu titik tiga browser (⋮) lalu pilih 'Tambahkan ke Layar Utama' / 'Install App'.");
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosGuide(false);
    localStorage.setItem("pmii_pwa_dismissed", String(Date.now()));
  };

  if (isStandalone) return null;

  return (
    <>
      {/* Banner / Floating Button Install PWA */}
      {showPrompt && (
        <aside
          role="region"
          aria-label="Pemberitahuan Pemasangan Aplikasi"
          className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-[#091122]/95 backdrop-blur-md text-white border border-yellow-400/40 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center shrink-0 text-yellow-400">
              <Download className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white tracking-tight">
                  Pasang Aplikasi PMII
                </h4>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Akses cepat baca buku & berita pergerakan langsung dari layar utama HP / iOS Anda.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install Sekarang</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Nanti Saja
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Modal Panduan Khusus iOS (Safari iPhone / iPad) */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b1528] text-white border border-white/15 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Pasang di iPhone / iOS</h3>
                <p className="text-xs text-slate-400">Ikuti 2 langkah mudah:</p>
              </div>
            </div>

            <ol className="space-y-3 text-xs text-slate-200 mb-6 bg-slate-950/60 p-4 rounded-2xl border border-white/5">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-yellow-400 text-slate-950 font-black flex items-center justify-center text-[11px] shrink-0">
                  1
                </span>
                <span>
                  Tekan tombol <strong>Bagikan (Share)</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> di bilah bawah browser Safari Anda.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-yellow-400 text-slate-950 font-black flex items-center justify-center text-[11px] shrink-0">
                  2
                </span>
                <span>
                  Gulir ke bawah dan pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:bg-yellow-300 transition"
            >
              Mengerti, Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}

