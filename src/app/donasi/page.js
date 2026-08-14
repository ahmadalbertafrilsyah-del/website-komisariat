"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { Heart, QrCode, MessageSquare, Send, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ==========================================
// ALGORITMA SAKTI: DYNAMIC QRIS GENERATOR
// ==========================================
const calculateCRC16 = (str) => {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc = crc << 1;
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
};

const makeDynamicQRIS = (qris, nominal) => {
  if (!qris || qris.length < 20) return qris;
  if (!nominal || nominal <= 0) return qris;
  
  let q = qris.slice(0, -4);
  q = q.replace("010211", "010212");
  
  let nomStr = nominal.toString();
  let tag54 = "54" + nomStr.length.toString().padStart(2, '0') + nomStr;
  
  if (q.includes("5802ID")) {
    q = q.replace("5802ID", tag54 + "5802ID");
  } else if (q.includes("6304")) {
    q = q.replace("6304", tag54 + "6304");
  } else {
    return qris; 
  }
  
  let newCrc = calculateCRC16(q);
  return q + newCrc;
};

export default function DonasiPage() {
  const [qrisBaseString, setQrisBaseString] = useState("");
  const [qrisBgUrl, setQrisBgUrl] = useState(""); 
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [messages, setMessages] = useState([]);
  
  const [amount, setAmount] = useState(10000);
  const [customAmount, setCustomAmount] = useState("");
  const nominals = [1000, 2000, 5000, 10000, 20000, 50000, 100000];

  const [nama, setNama] = useState("");
  const [pesan, setPesan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const docSnap = await getDoc(doc(db, "website_config", "global"));
        if (docSnap.exists()) {
           const data = docSnap.data();
           if (data.qrisString) setQrisBaseString(data.qrisString);
           if (data.qrisBackgroundUrl) setQrisBgUrl(data.qrisBackgroundUrl);
        }
      } catch (error) {
        console.error("Gagal meload QRIS");
      } finally {
        setLoadingConfig(false);
      }
    }
    loadConfig();

    const q = query(collection(db, "donasi_messages"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleAmountClick = (val) => {
    setAmount(val);
    setCustomAmount("");
  };

  const handleCustomAmount = (e) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(val);
    if(val) setAmount(parseInt(val));
    else setAmount(0);
  };

  const handleSubmitPesan = async (e) => {
    e.preventDefault();
    if (!nama || !pesan || amount <= 0) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "donasi_messages"), {
        nama, nominal: amount, pesan, createdAt: serverTimestamp(), adminReply: ""
      });
      setSubmitted(true);
      setNama(""); setPesan("");
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      alert("Gagal mengirim pesan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalQrisString = qrisBaseString ? makeDynamicQRIS(qrisBaseString, amount) : "";
  const qrImageUrl = finalQrisString ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(finalQrisString)}` : "";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-3 flex items-center justify-center gap-3">
              <Heart className="text-pink-500 fill-pink-500" size={32}/> Donasi Pergerakan
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-2xl mx-auto px-4">
              Dukungan finansial Anda adalah energi bagi kami untuk terus merawat tradisi dan membangun peradaban intelektual PMII Komisariat.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            
            {/* KOLOM KIRI: PEMBAYARAN QRIS */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 sm:p-8">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-6">
                <QrCode className="text-blue-600 dark:text-blue-400"/> Tentukan Nominal Donasi
              </h2>

              <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
                {nominals.map((nom) => (
                  <button 
                    key={nom} onClick={() => handleAmountClick(nom)}
                    className={`flex-grow sm:flex-grow-0 px-3 py-2.5 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${amount === nom && !customAmount ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-slate-900' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-600'}`}
                  >
                    Rp {nom.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>
              
              <div className="mb-8">
                <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Atau Masukkan Nominal Lainnya (Rp)</label>
                <input 
                  type="text" value={customAmount ? Number(customAmount).toLocaleString('id-ID') : ""} onChange={handleCustomAmount}
                  className="w-full text-xl sm:text-2xl font-black text-center text-slate-800 dark:text-white p-4 border border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 transition"
                  placeholder="Contoh: 150.000"
                />
              </div>

              {/* AREA QRIS PRESISI */}
              <div className="flex flex-col items-center justify-center mt-2">
                {qrisBgUrl ? (
                  <div className="relative w-full max-w-[360px] sm:max-w-[400px] mx-auto shadow-2xl rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700">
                    
                    <div className="relative w-full" style={{ paddingBottom: '133%' /* Rasio umum template QRIS */ }}>
                      <Image src={qrisBgUrl} alt="Template QRIS" fill className="object-cover pointer-events-none select-none" />
                    </div>

                    <div className="absolute top-[25.5%] left-[13%] w-[74%] aspect-square bg-white flex items-center justify-center p-1 sm:p-2 rounded-lg">
                      {loadingConfig ? (
                        <div className="flex flex-col items-center text-blue-600">
                           <Loader2 className="animate-spin mb-1" size={24}/>
                        </div>
                      ) : qrImageUrl ? (
                        <div className="relative w-full h-full">
                          <Image 
                            src={qrImageUrl} 
                            alt="QR Code Dinamis" 
                            fill
                            className="object-contain mix-blend-multiply dark:mix-blend-normal" 
                            unoptimized // Karena dari API Eksternal
                          />
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-bold text-center px-2">QRIS Belum Dikonfigurasi Admin</p>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 w-full max-w-[320px] mx-auto flex flex-col items-center">
                     {loadingConfig ? (
                       <Loader2 className="animate-spin text-blue-600 mb-2" size={32}/>
                     ) : qrImageUrl ? (
                       <div className="relative w-full h-64">
                         <Image src={qrImageUrl} alt="QRIS Donasi" fill className="object-contain" unoptimized />
                       </div>
                     ) : (
                       <p className="text-xs text-slate-400 font-medium text-center">QRIS Belum Dikonfigurasi Admin</p>
                     )}
                     <p className="text-sm font-bold text-slate-800 mt-4 text-center">Scan QRIS Untuk Donasi</p>
                  </div>
                )}

                <div className="mt-8 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-5 py-2.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                  <ShieldCheck size={18}/>
                  <span className="text-xs sm:text-sm font-bold tracking-wide">Mendukung Semua Pembayaran QRIS</span>
                </div>
              </div>

            </div>

            {/* KOLOM KANAN: PESAN DUKUNGAN */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
                  <MessageSquare className="text-pink-500" size={18}/> Tinggalkan Jejak & Pesan
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  Setelah berhasil transfer, tuliskan nama dan doa Anda untuk memotivasi langkah pergerakan kami.
                </p>

                {submitted ? (
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 p-6 rounded-2xl flex flex-col items-center text-center animate-in zoom-in duration-300">
                    <CheckCircle2 size={40} className="mb-3"/>
                    <p className="font-bold text-base">Terima kasih atas kebaikan Anda!</p>
                    <p className="text-xs mt-1">Pesan dukungan telah berhasil dikirimkan.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitPesan} className="space-y-4">
                    <div>
                      <input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} className="w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition text-slate-800 dark:text-slate-200" placeholder="Nama Lengkap / Instansi"/>
                    </div>
                    <div>
                      <textarea rows="3" required value={pesan} onChange={(e) => setPesan(e.target.value)} className="w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition resize-none text-slate-800 dark:text-slate-200" placeholder="Tulis harapan atau doa Anda..."/>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
                      {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>}
                      Kirim Pesan Dukungan
                    </button>
                  </form>
                )}
              </div>

              {/* Feed Komentar Live */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between sticky top-0 z-10">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Dukungan Terbaru</h3>
                  <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-md">{messages.length} Donatur</span>
                </div>
                
                <div className="overflow-y-auto p-6 space-y-6 hide-scrollbar">
                  {messages.length === 0 ? (
                    <div className="text-center text-slate-400 dark:text-slate-500 text-xs py-10 flex flex-col items-center">
                      <Heart size={32} className="mb-2 opacity-20"/>
                      Jadilah yang pertama mendukung langkah kami!
                    </div>
                  ) : messages.map((msg) => (
                    <div key={msg.id} className="border-b border-slate-100 dark:border-slate-700 pb-6 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-pink-100 dark:from-blue-900/50 dark:to-pink-900/50 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-sm shrink-0">
                            {msg.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{msg.nama}</h4>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Berdonasi <span className="text-emerald-600 dark:text-emerald-400 font-bold">Rp {Number(msg.nominal).toLocaleString('id-ID')}</span></p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed ml-12">"{msg.pesan}"</p>
                      
                      {msg.adminReply && (
                        <div className="ml-12 mt-4 bg-blue-50 dark:bg-slate-700/50 border border-blue-100 dark:border-slate-600 p-3.5 rounded-xl relative">
                          <div className="absolute -top-1.5 left-5 w-3 h-3 border-t border-l border-blue-100 dark:border-slate-600 bg-blue-50 dark:bg-slate-700 rotate-45"></div>
                          <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 mb-1.5 flex items-center gap-1">Balasan Pengurus:</p>
                          <p className="text-xs text-blue-900 dark:text-slate-200 leading-relaxed">{msg.adminReply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}