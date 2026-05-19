"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { LayoutDashboard, Newspaper, Settings, LogOut, Menu, X, ShieldAlert } from "lucide-react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); // State untuk buka/tutup sidebar di HP

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user && pathname !== "/admin/login") {
        router.push("/admin/login");
      } else {
        setIsAuthChecking(false);
      }
    });
    return () => unsubscribe();
  }, [pathname, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  if (isAuthChecking) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold">MEMERIKSA AKSES...</div>;
  if (pathname === "/admin/login") return <>{children}</>;

  const menuStyle = (path) => pathname === path 
    ? "flex items-center gap-3 text-yellow-400 font-bold bg-white/5 p-3 rounded-xl" 
    : "flex items-center gap-3 text-slate-300 hover:text-yellow-400 p-3 rounded-xl";

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* TOMBOL MENU HP */}
      <button className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 text-white rounded-lg" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* SIDEBAR */}
      <aside className={`fixed md:relative z-40 w-64 h-full bg-[#1e293b] text-white p-6 transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="flex items-center gap-3 mb-10 mt-10 md:mt-0">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-xs">ADM</div>
          <h2 className="text-lg font-bold">Panel Kontrol</h2>
        </div>
        
        <nav className="space-y-2">
          <Link href="/admin" onClick={() => setSidebarOpen(false)} className={menuStyle("/admin")}><LayoutDashboard size={18}/> Global & Footer</Link>
          <Link href="/admin/beranda" onClick={() => setSidebarOpen(false)} className={menuStyle("/admin/beranda")}><Settings size={18}/> Isi Beranda</Link>
          <Link href="/admin/berita" onClick={() => setSidebarOpen(false)} className={menuStyle("/admin/berita")}><Newspaper size={18}/> Manajemen Berita</Link>
        </nav>

        <button onClick={handleLogout} className="absolute bottom-6 w-[calc(100%-48px)] flex items-center gap-3 text-red-400 p-3 font-semibold">
          <LogOut size={18}/> Keluar
        </button>
      </aside>

      {/* OVERLAY SAAT SIDEBAR BUKA DI HP */}
      {sidebarOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)}></div>}

      {/* KONTEN */}
      <main className="flex-grow p-4 md:p-8 mt-16 md:mt-0 w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}