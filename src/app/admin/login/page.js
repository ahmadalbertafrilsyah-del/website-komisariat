"use client";
import React, { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, Loader2 } from "lucide-react";

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
      router.push("/admin"); // Jika berhasil, arahkan ke dashboard admin
    } catch (err) {
      setError("Autentikasi gagal. Periksa kembali alamat email dan kata sandi Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-16 h-16 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-center text-2xl font-bold text-slate-900 tracking-tight">
          Portal Administrator
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Silakan masuk menggunakan kredensial pengurus yang sah.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl border border-slate-200 sm:px-10">
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm font-medium flex items-start gap-2">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm bg-white" 
                  placeholder="admin@domain.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm bg-white" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-md shadow-sm transition-colors text-sm disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Memverifikasi...
                  </>
                ) : (
                  "Masuk ke Sistem"
                )}
              </button>
            </div>
          </form>
          
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Akses dibatasi hanya untuk pengurus PMII yang memiliki wewenang.
        </p>
      </div>
    </div>
  );
}