"use client";

import { useEffect, useState } from "react";
import { Download, Share2, X, PlusSquare, CheckCircle2 } from "lucide-react";

let globalDeferredPrompt = null;
const listeners = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn(globalDeferredPrompt));
}

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Register Service Worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .catch((err) => console.log("SW register fail:", err));
      });
    }

    // 2. Simpan event beforeinstallprompt agar bisa dipanggil dari tombol di Footer
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      notifyListeners();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  return null;
}

export function PwaFooterInstallCard() {
  const [deferredPrompt, setDeferredPrompt] = useState(globalDeferredPrompt);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    const timer = setTimeout(() => {
      setIsStandalone(checkStandalone);
      setIsIos(isIosDevice);
      if (globalDeferredPrompt) {
        setDeferredPrompt(globalDeferredPrompt);
      }
    }, 0);

    const listener = (promptEvent) => {
      setDeferredPrompt(promptEvent);
    };
    listeners.add(listener);

    return () => {
      clearTimeout(timer);
      listeners.delete(listener);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    const activePrompt = deferredPrompt || globalDeferredPrompt;
    if (activePrompt) {
      activePrompt.prompt();
      const { outcome } = await activePrompt.userChoice;
      if (outcome === "accepted") {
        globalDeferredPrompt = null;
        setDeferredPrompt(null);
      }
    } else {
      alert(
        "Untuk memasang aplikasi ini di layar utama: Buka menu titik tiga browser (⋮) lalu pilih 'Tambahkan ke Layar Utama' / 'Install App'."
      );
    }
  };

  return (
    <>
      <div className="rounded-xl bg-[#091122] text-white border border-yellow-400/30 p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center shrink-0 text-yellow-400">
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white tracking-tight truncate">
                Pasang Aplikasi PMII
              </h4>
              <p className="text-[10px] text-slate-400 truncate">
                Akses cepat di layar utama HP / iOS
              </p>
            </div>
          </div>

          {isStandalone ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" /> Terpasang
            </span>
          ) : (
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-[11px] rounded-lg shadow-sm transition-all active:scale-95 inline-flex items-center gap-1 shrink-0"
            >
              <Download className="w-3 h-3" />
              <span>Install</span>
            </button>
          )}
        </div>
      </div>

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
                  Tekan tombol <strong>Bagikan (Share)</strong>{" "}
                  <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> di bilah bawah browser Safari Anda.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-yellow-400 text-slate-950 font-black flex items-center justify-center text-[11px] shrink-0">
                  2
                </span>
                <span>
                  Gulir ke bawah dan pilih{" "}
                  <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>{" "}
                  <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />.
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
