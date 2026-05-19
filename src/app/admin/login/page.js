"use client";
import React, { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ShieldAlert, Lock, Mail } from "lucide-react";

export default function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin"); // Jika berhasil, lempar ke dashboard admin utama
    } catch (err) {
      setError("Email atau Password pengurus salah!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Akses Cahaya Latar */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px]"></div>

      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 text-white">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-yellow-400 text-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-yellow-400/20">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Gerbang Pengurus</h1>
          <p className="text-slate-400 text-sm mt-1">Silakan masuk untuk mengelola sistem data</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-xl text-sm mb-6 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">Email Admin</label>
            <div className="relative">
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-yellow-400 transition" 
                placeholder="admin@pmii.com"
              />
              <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">Password Security</label>
            <div className="relative">
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-yellow-400 transition" 
                placeholder="••••••••"
              />
              <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold py-3.5 rounded-xl transition shadow-lg shadow-yellow-400/10 text-sm mt-2 disabled:opacity-50"
          >
            {loading ? "Membuka Gerbang..." : "Masuk Kontrol Panel"}
          </button>
        </form>
      </div>
    </div>
  );
}