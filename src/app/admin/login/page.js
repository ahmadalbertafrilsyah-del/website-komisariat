"use client";
import React, { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, Loader2, ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin");
    } catch {
      setError("Autentikasi gagal. Periksa kembali alamat email dan kata sandi pengurus Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col lg:flex-row font-sans relative overflow-hidden">
      {/* Architectural Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-[#facc15] to-blue-600 z-20" />

      {/* Left Architectural Brand Column (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12 xl:p-16 border-r border-slate-800/80 bg-slate-950/40">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-300 hover:text-[#facc15] bg-slate-900/90 hover:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-800 transition-colors"
          >
            <ArrowLeft size={15} /> Kembali ke Beranda Publik
          </Link>
        </div>

        <div className="max-w-lg my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/15 border border-blue-500/30 text-[#facc15] text-[11px] font-mono font-bold uppercase tracking-widest mb-5">
            <ShieldCheck size={15} /> OTORITAS PENGURUS KOMISARIAT
          </div>
          <h1 className="text-4xl xl:text-5xl font-black tracking-tight text-white leading-[1.12] mb-5">
            Pusat Kendali &{" "}
            <span className="text-[#facc15]">Pangkalan Data.</span>
          </h1>
          <p className="text-slate-300 text-sm xl:text-base leading-relaxed mb-8">
            Sistem manajemen terpadu PK. PMII Sunan Ampel Malang — kelola struktur pengurus, database kader & alumni, perpustakaan digital, berita, hingga persuratan dan pengajuan SK dalam satu dasbor.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-800/90">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
              <p className="text-[10px] font-mono uppercase text-slate-400">Enkripsi</p>
              <p className="text-sm font-black text-white mt-0.5">Firebase Auth</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
              <p className="text-[10px] font-mono uppercase text-slate-400">Sinkronisasi</p>
              <p className="text-sm font-black text-[#facc15] mt-0.5">Real-Time DB</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
              <p className="text-[10px] font-mono uppercase text-slate-400">Akses</p>
              <p className="text-sm font-black text-emerald-400 mt-0.5">Terproteksi</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-slate-500">
          <span>PK. PMII SUNAN AMPEL MALANG</span>
          <span className="text-[#facc15]">DZIKIR • FIKIR • AMAL SHOLEH</span>
        </div>
      </div>

      {/* Right Login Form Area */}
      <div className="flex-1 flex flex-col justify-center px-5 py-10 sm:px-8 lg:px-12 relative z-10">
        {/* Mobile Back Button */}
        <div className="lg:hidden mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-300 hover:text-[#facc15] bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800"
          >
            <ArrowLeft size={14} /> Kembali ke Beranda
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-10">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 bg-[#020617] text-[#facc15] rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                <ShieldCheck size={24} />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600 block">
                  PORTAL ADMINISTRATOR
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Masuk ke Sistem
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
              Gunakan akun email dan kata sandi resmi pengurus komisariat untuk mengakses panel manajemen.
            </p>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-start gap-2.5">
                <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Alamat Email Pengurus
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm bg-slate-50 focus:bg-white text-slate-900 font-medium"
                    placeholder="admin@pmii-uinmalang.or.id"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm bg-slate-50 focus:bg-white text-slate-900 font-medium"
                    placeholder="apa hayoo???"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 bg-[#020617] hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-[#facc15]" />
                      <span>Memverifikasi Otoritas...</span>
                    </>
                  ) : (
                    <span>Masuk ke Command Center</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Akses dibatasi hanya untuk pengurus PK. PMII Sunan Ampel Malang yang memiliki wewenang.
          </p>
        </div>
      </div>
    </div>
  );
}
