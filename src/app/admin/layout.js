"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { LayoutDashboard, Newspaper, Settings, LogOut, Menu, X, Users } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); 

  // Pengecekan Akses Keamanan
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
    try {
      await signOut(auth);
      router.push("/admin/login");
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  // 1. Layar Loading Seragam
  if (isAuthChecking) return <LoadingScreen text="Memeriksa Akses Keamanan" />;

  // 2. Jika di Halaman Login, Tampilkan Fullscreen tanpa Sidebar
  if (pathname === "/admin/login") return <>{children}</>;

  // Gaya untuk Menu Navigasi
  const menuStyle = (path) => {
    const isActive = pathname === path;
    return `flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
      isActive 
        ? "bg-blue-600/10 text-yellow-400 font-bold border border-blue-500/20 shadow-inner" 
        : "text-slate-400 hover:text-slate-200 hover:bg-white/5 font-medium"
    }`;
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* ================= 1. SIDEBAR (Kiri) ================= */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] text-white flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Header Sidebar */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between md:justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-lg border border-blue-500/30">
              PMII
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-100">Panel Admin</h2>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">Komisariat</p>
            </div>
          </div>
          {/* Tombol Close Sidebar (Hanya HP) */}
          <button className="md:hidden text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-lg" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>
        
        {/* Navigasi Utama */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto hide-scrollbar">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 pl-2">Menu Utama</p>
          <Link href="/admin" onClick={() => setSidebarOpen(false)} className={menuStyle("/admin")}>
            <LayoutDashboard size={18} className={pathname === "/admin" ? "text-blue-400" : ""} /> Global & Footer
          </Link>
          <Link href="/admin/beranda" onClick={() => setSidebarOpen(false)} className={menuStyle("/admin/beranda")}>
            <Settings size={18} className={pathname === "/admin/beranda" ? "text-blue-400" : ""} /> Beranda
          </Link>
          <Link href="/admin/struktur" onClick={() => setSidebarOpen(false)} className={menuStyle("/admin/struktur")}>
            <Users size={18} className={pathname === "/admin/struktur" ? "text-blue-400" : ""} /> Pengurus
          </Link>
          <Link href="/admin/anggota" onClick={() => setSidebarOpen(false)} className={menuStyle("/admin/anggota")}>
            <Newspaper size={18} className={pathname === "/admin/anggota" ? "text-blue-400" : ""} /> Anggota
          </Link>
          <Link href="/admin/rayon" onClick={() => setSidebarOpen(false)} className={menuStyle("/admin/rayon")}>
            <Newspaper size={18} className={pathname === "/admin/rayon" ? "text-blue-400" : ""} /> Rayon
          </Link>
          <Link href="/admin/berita" onClick={() => setSidebarOpen(false)} className={menuStyle("/admin/berita")}>
            <Newspaper size={18} className={pathname === "/admin/berita" ? "text-blue-400" : ""} /> Berita & Artikel
          </Link>
        </nav>

        {/* Area Bawah (Logout) */}
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 p-3 rounded-xl font-bold transition-colors duration-200"
          >
            <LogOut size={18}/> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* ================= 2. OVERLAY GELAP (Saat Sidebar Buka di HP) ================= */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity" 
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* ================= 3. AREA KONTEN UTAMA (Kanan) ================= */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* HEADER KHUSUS MOBILE (Muncul hanya di HP) */}
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              className="p-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors" 
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h1 className="font-bold text-slate-800 text-sm">Dashboard</h1>
          </div>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xs text-white">
            P
          </div>
        </header>

        {/* AREA HALAMAN YANG BISA DI-SCROLL */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-8 scroll-smooth w-full">
          {children}
        </main>

      </div>

    </div>
  );
}