"use client";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import {
  Heart,
  QrCode,
  MessageSquare,
  Send,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Sparkles,
  Download,
  Copy,
  Check,
  Smartphone,
  Wallet,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ==========================================
// ALGORITMA DYNAMIC QRIS GENERATOR (CRC16)
// ==========================================
const calculateCRC16 = (str) => {
  let crc = 0xffff;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc = crc << 1;
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
};

const makeDynamicQRIS = (qris, nominal) => {
  if (!qris || qris.length < 20) return qris;
  if (!nominal || nominal <= 0) return qris;

  let q = qris.slice(0, -4);
  q = q.replace("010211", "010212");

  const nomStr = nominal.toString();
  const tag54 = "54" + nomStr.length.toString().padStart(2, "0") + nomStr;

  if (q.includes("5802ID")) {
    q = q.replace("5802ID", tag54 + "5802ID");
  } else if (q.includes("6304")) {
    q = q.replace("6304", tag54 + "6304");
  } else {
    return qris;
  }

  const newCrc = calculateCRC16(q);
  return q + newCrc;
};

const QUICK_PRAYERS = [
  "Semoga kaderisasi PMII Sunan Ampel makin progresif & berkah!",
  "Semangat terus merawat tradisi intelektual & gerakan, Sahabat/i!",
  "Bismillah, sedikit dukungan untuk kemandirian organisasi.",
];

export default function DonasiPage() {
  const [qrisBaseString, setQrisBaseString] = useState("");
  const [qrisBgUrl, setQrisBgUrl] = useState("");
  const [bgImgError, setBgImgError] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [messages, setMessages] = useState([]);

  const [amount, setAmount] = useState(10000);
  const [customAmount, setCustomAmount] = useState("");
  const nominals = [5000, 10000, 20000, 50000, 100000, 250000];

  const [nama, setNama] = useState("");
  const [pesan, setPesan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copiedNominal, setCopiedNominal] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const docSnap = await getDoc(doc(db, "website_config", "global"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.qrisString) setQrisBaseString(data.qrisString);
          if (data.qrisBackgroundUrl) setQrisBgUrl(data.qrisBackgroundUrl);
        }
      } catch {
        console.error("Gagal meload QRIS");
      } finally {
        setLoadingConfig(false);
      }
    }
    loadConfig();

    const q = query(
      collection(db, "donasi_messages"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const totalCollected = useMemo(() => {
    return messages.reduce(
      (sum, item) => sum + (Number(item.nominal) || 0),
      0
    );
  }, [messages]);

  const handleAmountClick = (val) => {
    setAmount(val);
    setCustomAmount("");
  };

  const handleCustomAmount = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setCustomAmount(val);
    if (val) setAmount(parseInt(val, 10));
    else setAmount(0);
  };

  const handleCopyNominal = () => {
    if (!amount || amount <= 0) return;
    navigator.clipboard.writeText(String(amount));
    setCopiedNominal(true);
    setTimeout(() => setCopiedNominal(false), 1800);
  };

  const handleSubmitPesan = async (e) => {
    e.preventDefault();
    if (!nama || !pesan || amount <= 0) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "donasi_messages"), {
        nama: nama.trim(),
        nominal: amount,
        pesan: pesan.trim(),
        createdAt: serverTimestamp(),
        adminReply: "",
      });
      setSubmitted(true);
      setNama("");
      setPesan("");
      setTimeout(() => setSubmitted(false), 5000);
    } catch {
      alert("Gagal mengirim pesan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalQrisString = qrisBaseString
    ? makeDynamicQRIS(qrisBaseString, amount)
    : "";
  const qrImageUrl = finalQrisString
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
        finalQrisString
      )}`
    : "";

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex flex-col font-sans text-slate-900 dark:text-slate-100 pb-16 xl:pb-0">
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
                Kemandirian & Filantropi Pergerakan // UIN Malang
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] text-white">
                Donasi & Dukungan{" "}
                <span className="text-amber-400">Pergerakan</span>
              </h1>
              <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                Dukungan Anda adalah energi kolektif untuk merawat tradisi
                kaderisasi, riset intelektual, dan pengabdian masyarakat PK. PMII
                Sunan Ampel Malang.
              </p>
            </div>

            {/* Live Telemetry */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Donatur Tercatat
                </p>
                <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                  {messages.length}
                </p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 col-span-1 sm:col-span-2">
                <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                  Akumulasi Jejak Dukungan
                </p>
                <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1 font-mono">
                  Rp {totalCollected.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN DONATION WORKSPACE */}
      <section className="flex-grow py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full -mt-8 relative z-20">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* KOLOM KIRI: PEMBAYARAN QRIS DINAMIS */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-lg p-5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-5 mb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600 dark:text-amber-400 block">
                  Langkah 01 // Nominal Otomatis
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                  <QrCode
                    size={20}
                    className="text-blue-600 dark:text-amber-400"
                  />{" "}
                  Tentukan Nominal Donasi
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70">
                <Wallet size={13} /> Dynamic QRIS
              </span>
            </div>

            {/* Preset Nominal Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
              {nominals.map((nom) => {
                const active = amount === nom && !customAmount;
                return (
                  <button
                    key={nom}
                    type="button"
                    onClick={() => handleAmountClick(nom)}
                    className={`py-3 px-3.5 rounded-xl text-xs sm:text-sm font-bold font-mono transition-all border text-center ${
                      active
                        ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20"
                        : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                    }`}
                  >
                    Rp {nom.toLocaleString("id-ID")}
                  </button>
                );
              })}
            </div>

            {/* Custom Nominal Input */}
            <div className="mb-7">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Atau Ketik Nominal Lainnya (Rp)
                </label>
                {amount > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyNominal}
                    className="text-[11px] font-mono font-bold text-blue-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    {copiedNominal ? (
                      <>
                        <Check size={12} className="text-emerald-500" /> Nominal
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Salin Rp{" "}
                        {amount.toLocaleString("id-ID")}
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-black text-slate-400 text-base sm:text-lg">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    customAmount
                      ? Number(customAmount).toLocaleString("id-ID")
                      : ""
                  }
                  onChange={handleCustomAmount}
                  className="w-full text-lg sm:text-2xl font-mono font-black pl-12 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-white transition"
                  placeholder="Contoh: 150.000"
                />
              </div>
            </div>

            {/* AREA QRIS PRESISI */}
            <div className="flex flex-col items-center justify-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="w-full flex items-center justify-between mb-4">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Kode QRIS Otomatis:
                </span>
                <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                  Nominal: Rp {(amount || 0).toLocaleString("id-ID")}
                </span>
              </div>

              {qrisBgUrl && !bgImgError ? (
                <div className="relative w-full max-w-[340px] sm:max-w-[380px] mx-auto shadow-xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div
                    className="relative w-full"
                    style={{ paddingBottom: "133%" }}
                  >
                    <Image
                      src={qrisBgUrl}
                      alt="Template QRIS"
                      fill
                      className="object-cover pointer-events-none select-none"
                      onError={() => setBgImgError(true)}
                    />
                  </div>

                  <div className="absolute top-[25.5%] left-[13%] w-[74%] aspect-square bg-white flex items-center justify-center p-1.5 sm:p-2 rounded-lg">
                    {loadingConfig ? (
                      <div className="flex flex-col items-center text-blue-600">
                        <Loader2 className="animate-spin mb-1" size={24} />
                      </div>
                    ) : qrImageUrl ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={qrImageUrl}
                          alt="QR Code Dinamis"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 font-bold text-center px-2">
                        QRIS Belum Dikonfigurasi Admin
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 w-full max-w-[300px] mx-auto flex flex-col items-center">
                  {loadingConfig ? (
                    <Loader2
                      className="animate-spin text-blue-600 my-16"
                      size={32}
                    />
                  ) : qrImageUrl ? (
                    <div className="relative w-full aspect-square">
                      <Image
                        src={qrImageUrl}
                        alt="QRIS Donasi"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium text-center py-16">
                      QRIS Belum Dikonfigurasi Admin
                    </p>
                  )}
                  <p className="text-xs font-mono font-bold text-slate-800 mt-3 text-center uppercase tracking-wider">
                    PK. PMII Sunan Ampel Malang
                  </p>
                </div>
              )}

              {/* Helper Buttons for Mobile Users */}
              {qrImageUrl && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 w-full">
                  <a
                    href={qrImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 text-white text-xs font-bold transition shadow-sm"
                  >
                    <Download size={14} /> Buka / Simpan Kode QR
                  </a>
                  <div className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold">
                    <ShieldCheck size={15} /> Semua M-Banking & E-Wallet
                  </div>
                </div>
              )}

              {/* Tips Scan dari HP */}
              <div className="mt-5 w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
                <Smartphone
                  size={18}
                  className="text-blue-600 dark:text-amber-400 shrink-0 mt-0.5"
                />
                <p className="leading-relaxed">
                  <strong>Buka lewat HP?</strong> Cukup pilih nominal di atas,{" "}
                  <em>screenshot</em> atau klik{" "}
                  <strong>Buka / Simpan Kode QR</strong>, lalu unggah dari galeri
                  pada menu QRIS aplikasi M-Banking / GoPay / DANA / ShopeePay
                  Anda.
                </p>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: PESAN DUKUNGAN & FEED REALTIME */}
          <div className="lg:col-span-5 space-y-6">
            {/* Form Kirim Pesan */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-lg p-5 sm:p-7">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600 dark:text-amber-400 block">
                Langkah 02 // Konfirmasi & Doa
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mt-0.5 mb-2">
                <MessageSquare className="text-rose-500" size={18} /> Tinggalkan
                Jejak & Doa Pergerakan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                Setelah melakukan transfer senilai{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  Rp {(amount || 0).toLocaleString("id-ID")}
                </strong>
                , tuliskan nama dan pesan dukungan Anda di bawah ini.
              </p>

              {submitted ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 p-6 rounded-2xl flex flex-col items-center text-center">
                  <CheckCircle2 size={36} className="mb-2.5" />
                  <p className="font-bold text-sm sm:text-base">
                    Terima kasih atas dukungan sahabat/i!
                  </p>
                  <p className="text-xs mt-1 opacity-90">
                    Pesan dan doa Anda telah tampil di dinding dukungan.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitPesan} className="space-y-3.5">
                  <div>
                    <input
                      type="text"
                      required
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 rounded-xl text-xs sm:text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition text-slate-900 dark:text-white font-semibold"
                      placeholder="Nama Lengkap / Alumni / Hamba Allah"
                    />
                  </div>
                  <div>
                    <textarea
                      rows="3"
                      required
                      value={pesan}
                      onChange={(e) => setPesan(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 rounded-xl text-xs sm:text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition resize-none text-slate-900 dark:text-white"
                      placeholder="Tuliskan doa atau harapan untuk PMII Komisariat..."
                    />
                    {/* Quick Prayer Chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {QUICK_PRAYERS.map((tpl, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPesan(tpl)}
                          className="text-[10px] text-left px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-600 dark:text-slate-300 hover:text-blue-600 border border-slate-200/70 dark:border-slate-700 transition line-clamp-1"
                        >
                          + &ldquo;{tpl.substring(0, 38)}...&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md shadow-blue-600/20"
                  >
                    {isSubmitting ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    Kirim Jejak Dukungan
                  </button>
                </form>
              )}
            </div>

            {/* Feed Komentar Live */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-lg overflow-hidden flex flex-col max-h-[520px]">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between sticky top-0 z-10">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Dinding Dukungan Terbaru
                </h3>
                <span className="text-[10px] font-mono font-bold bg-blue-600 text-white px-2.5 py-1 rounded-md">
                  {messages.length} Donatur
                </span>
              </div>

              <div className="overflow-y-auto p-5 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-400 dark:text-slate-500 text-xs py-10 flex flex-col items-center">
                    <Heart size={30} className="mb-2 opacity-30" />
                    Jadilah yang pertama mendukung langkah pergerakan!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800"
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-blue-950 flex items-center justify-center font-black text-amber-400 text-xs shrink-0">
                            {(msg.nama || "S").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {msg.nama}
                            </h4>
                            <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              Rp {Number(msg.nominal || 0).toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-11">
                        &ldquo;{msg.pesan}&rdquo;
                      </p>

                      {msg.adminReply && (
                        <div className="ml-11 mt-3 bg-blue-50 dark:bg-slate-900 border border-blue-200/70 dark:border-slate-700 p-3 rounded-xl">
                          <p className="text-[10px] font-mono font-bold text-blue-700 dark:text-amber-400 uppercase tracking-wider mb-1">
                            Balasan Pengurus Komisariat:
                          </p>
                          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                            {msg.adminReply}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
