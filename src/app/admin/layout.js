"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { LayoutDashboard, Newspaper, Settings, LogOut, Menu, X, Users, GraduationCap, Trophy } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); 

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

  if (isAuthChecking) return <LoadingScreen text="Memeriksa Akses Keamanan" />;
  if (pathname === "/admin/login") return <>{children}</>;

  // Gaya menu standar enterprise: bersih, font sedang, tidak berlebihan
  const menuStyle = (path) => {
    const isActive = pathname === path;
    return `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 text-sm ${
      isActive 
        ? "bg-blue-600 text-white font-medium shadow-sm" 
        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800 font-medium"
    }`;
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* Sidebar - Dark Mode Enterprise */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between md:justify-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center font-bold text-sm text-white shadow-sm">
              P
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-white">Panel Admin</h2>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Komisariat</p>
            </div>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-md" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto hide-scrollbar">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Menu Navigasi</p>
          <Link href="/admin" onClick={() => setSidebarOpen(false)} className={menuStyle("/admin")}><LayoutDashboard size={18} /> Global & Footer</Link>
          <Link href="/admin/beranda" onClick={() => setSidebarOpen(false)} className={menuStyle("/admin/beranda")}><Settings size={18} /> Beranda</Link>
          <Link href="/admin/administrasi" onClick={() => setSidebarOpen(false)} className={menuStyle("/admin/administrasi")}><Newspaper size={18} /> Administrasi</Link>
          <Link href="/admin/struktur" onClick={() => setSidebarOpen(false)} className={menuStyle("/admin/struktur")}><Users size={18} /> Pengurus</Link>
          <Link href="/admin/anggota" onClick={() => setSidebarOpen(false)} className={menuStyle("/admin/anggota")}><Users size={18} /> Anggota</Link>
          <Link href="/admin/rayon" onClick={() => setSidebarOpen(false)} className={menuStyle("/admin/rayon")}><Users size={18} /> Rayon</Link>
          <Link href="/admin/alumni" onClick={() => setSidebarOpen(false)} className={menuStyle("/admin/alumni")}><GraduationCap size={18} /> Kelola Alumni</Link>
          <Link href="/admin/apresiasi" onClick={() => setSidebarOpen(false)} className={menuStyle("/admin/apresiasi")}><Trophy size={18} /> Apresiasi Kader</Link>
          <Link href="/admin/berita" onClick={() => setSidebarOpen(false)} className={menuStyle("/admin/berita")}><Newspaper size={18} /> Berita & Artikel</Link>
          <Link href="/admin/pendaftaran" onClick={() => setSidebarOpen(false)} className={menuStyle("/admin/pendaftaran")}><Newspaper size={18} /> Pendaftaran</Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-500 hover:text-white text-slate-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200">
            <LogOut size={16}/> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* Overlay Mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="p-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-100 transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
            </button>
            <h1 className="font-semibold text-slate-800 text-sm">Dashboard</h1>
          </div>
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center font-bold text-xs text-white">P</div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth w-full">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}