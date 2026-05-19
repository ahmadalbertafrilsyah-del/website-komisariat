"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { LayoutDashboard, Newspaper, Settings, LogOut, ShieldAlert } from "lucide-react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // State untuk mengecek apakah Firebase masih memeriksa status login
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // ================= SISTEM PENJAGA PINTU (ROUTE GUARD) =================
  useEffect(() => {
    // onAuthStateChanged akan terus memantau apakah ada user yang login
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user && pathname !== "/admin/login") {
        // Jika TIDAK ADA user login, dan dia BUKAN di halaman login -> Tendang ke Login!
        router.push("/admin/login");
      } else {
        // Jika aman (sudah login, atau memang sedang di halaman login) -> Izinkan masuk
        setIsAuthChecking(false);
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  // Fungsi untuk logout admin
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/admin/login");
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  // Layar Loading saat Firebase memeriksa kunci (mencegah halaman berkedip)
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <ShieldAlert size={40} className="text-yellow-400" />
          <p className="font-bold tracking-widest text-sm">MEMERIKSA AKSES KEAMANAN...</p>
        </div>
      </div>
    );
  }

  // Jika sedang berada di halaman login, tampilkan halamannya saja (tanpa sidebar)
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Gaya untuk menu aktif & non-aktif
  const menuStyle = (path) => {
    return pathname === path
      ? "flex items-center gap-3 text-yellow-400 font-bold bg-white/5 p-3 rounded-xl transition"
      : "flex items-center gap-3 text-slate-300 hover:text-yellow-400 p-3 rounded-xl transition";
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* SIDEBAR ADMIN */}
      <aside className="w-64 bg-[#1e293b] text-white p-6 flex flex-col justify-between shrink-0 fixed h-full z-30">
        <div>
          <div className="flex items-center gap-3 mb-10 pb-4 border-b border-slate-700">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-xs text-yellow-300 shadow-inner">
              ADM
            </div>
            <h2 className="text-lg font-bold tracking-tight">Panel Kontrol</h2>
          </div>
          
          <nav className="space-y-2">
            <Link href="/admin" className={menuStyle("/admin")}>
              <LayoutDashboard size={18}/> Global & Footer
            </Link>
            <Link href="/admin/beranda" className={menuStyle("/admin/beranda")}>
              <Settings size={18}/> Isi Beranda
            </Link>
            <Link href="/admin/berita" className={menuStyle("/admin/berita")}>
              <Newspaper size={18}/> Manajemen Berita
            </Link>
          </nav>
        </div>

        <div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 text-red-400 hover:text-red-300 font-semibold p-3 rounded-xl hover:bg-red-500/10 transition text-left"
          >
            <LogOut size={18}/> Keluar Sistem
          </button>
        </div>
      </aside>
      
      {/* AREA KONTEN UTAMA */}
      <main className="flex-grow pl-64 min-h-screen flex flex-col">
        <div className="p-8 flex-grow">
          {children}
        </div>
      </main>
    </div>
  );
}