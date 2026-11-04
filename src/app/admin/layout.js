"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  LayoutDashboard,
  Newspaper,
  Settings,
  LogOut,
  X,
  Users,
  GraduationCap,
  Trophy,
  Heart,
  FileSignature,
  BookOpen,
  Compass,
  FolderArchive,
  ClipboardList,
  ExternalLink,
  Grid,
  ShieldCheck,
  ChevronRight,
  MessageSquareQuote,
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

const ADMIN_MENU_GROUPS = [
  {
    groupLabel: "Konfigurasi Inti",
    items: [
      {
        href: "/admin",
        label: "Global & Footer",
        shortLabel: "Global",
        icon: LayoutDashboard,
      },
      {
        href: "/admin/beranda",
        label: "Halaman Beranda",
        shortLabel: "Beranda",
        icon: Settings,
      },
    ],
  },
  {
    groupLabel: "Basis Data Organisasi",
    items: [
      {
        href: "/admin/struktur",
        label: "Struktur Pengurus",
        shortLabel: "Pengurus",
        icon: ShieldCheck,
      },
      {
        href: "/admin/anggota",
        label: "Database Anggota",
        shortLabel: "Anggota",
        icon: Users,
      },
      {
        href: "/admin/rayon",
        label: "Data Pangkalan Rayon",
        shortLabel: "Rayon",
        icon: Compass,
      },
      {
        href: "/admin/alumni",
        label: "Direktori Alumni",
        shortLabel: "Alumni",
        icon: GraduationCap,
      },
      {
        href: "/admin/apresiasi",
        label: "Apresiasi & Prestasi",
        shortLabel: "Apresiasi",
        icon: Trophy,
      },
    ],
  },
  {
    groupLabel: "Literasi & Publikasi",
    items: [
      {
        href: "/admin/buku",
        label: "Bahan Bacaan Kader",
        shortLabel: "Bacaan",
        icon: BookOpen,
      },
      {
        href: "/admin/berita",
        label: "Berita & Artikel",
        shortLabel: "Berita",
        icon: Newspaper,
      },
      {
        href: "/admin/testimoni",
        label: "Kata Mereka (ACC)",
        shortLabel: "Testimoni",
        icon: MessageSquareQuote,
      },
    ],
  },
  {
    groupLabel: "Layanan & Keuangan",
    items: [
      {
        href: "/admin/administrasi",
        label: "Arsip Administrasi",
        shortLabel: "Arsip Adm",
        icon: FolderArchive,
      },
      {
        href: "/admin/pengajuan",
        label: "Layanan Pengajuan",
        shortLabel: "Pengajuan",
        icon: FileSignature,
      },
      {
        href: "/admin/pendaftaran",
        label: "Portal Pendaftaran",
        shortLabel: "Daftar",
        icon: ClipboardList,
      },
      {
        href: "/admin/donasi",
        label: "Donasi & Dukungan",
        shortLabel: "Donasi",
        icon: Heart,
      },
    ],
  },
];

const ALL_MENU_ITEMS = ADMIN_MENU_GROUPS.flatMap((g) => g.items);

const MOBILE_DOCK_ITEMS = [
  { href: "/admin", label: "Utama", icon: LayoutDashboard },
  { href: "/admin/anggota", label: "Anggota", icon: Users },
  { href: "/admin/buku", label: "Bacaan", icon: BookOpen },
  { href: "/admin/berita", label: "Berita", icon: Newspaper },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user && pathname !== "/admin/login") {
        router.push("/admin/login");
      } else {
        setUserEmail(user?.email || "Admin Komisariat");
        setIsAuthChecking(false);
      }
    });
    return () => unsubscribe();
  }, [pathname, router]);

  const currentModule = useMemo(() => {
    const exact = ALL_MENU_ITEMS.find((item) => item.href === pathname);
    if (exact) return exact;
    const prefix = ALL_MENU_ITEMS.find(
      (item) => item.href !== "/admin" && pathname.startsWith(item.href)
    );
    return prefix || ALL_MENU_ITEMS[0];
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/admin/login");
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  if (isAuthChecking) return <LoadingScreen text="Memeriksa Otoritas Admin..." />;
  if (pathname === "/admin/login") return <>{children}</>;

  const CurrentIcon = currentModule?.icon || LayoutDashboard;

  return (
    <div className="flex h-screen w-full bg-[#f1f5f9] overflow-hidden font-sans text-slate-900">
      {/* ==================== 1. DESKTOP SIDEBAR (lg+) ==================== */}
      <aside className="hidden lg:flex w-64 bg-[#020617] text-white flex-col border-r border-slate-800/80 shrink-0 select-none">
        {/* Brand Masthead */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-xs text-amber-300 border border-blue-400/30 shadow-sm">
              PK
            </div>
            <div>
              <h2 className="text-xs font-black tracking-wider text-white uppercase">
                Command Center
              </h2>
              <p className="text-[10px] font-mono text-amber-400">
                PMII Sunan Ampel
              </p>
            </div>
          </div>
          <Link
            href="/"
            target="_blank"
            title="Buka Website Publik"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
          >
            <ExternalLink size={14} />
          </Link>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto hide-scrollbar">
          {ADMIN_MENU_GROUPS.map((group, gIdx) => (
            <div key={gIdx}>
              <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-3">
                {group.groupLabel}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-all ${
                        isActive
                          ? "bg-blue-600 text-white font-semibold shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-slate-900 font-medium"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <Icon
                          size={15}
                          className={
                            isActive
                              ? "text-amber-300 shrink-0"
                              : "text-slate-400 group-hover:text-slate-200 shrink-0"
                          }
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                            isActive
                              ? "bg-amber-400 text-slate-950"
                              : "bg-blue-950 text-amber-400 border border-blue-800"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
          <div className="px-2 py-1 flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate font-mono">{userEmail}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-800 hover:border-rose-500 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
          >
            <LogOut size={14} /> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* ==================== 2. MAIN WORKSPACE AREA ==================== */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top App Bar (Mobile Native Header + Desktop Context Bar) */}
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
              <CurrentIcon size={17} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-400">
                <span>Admin</span>
                <ChevronRight size={10} />
                <span className="text-blue-600 font-bold truncate">
                  {currentModule?.shortLabel || "Panel"}
                </span>
              </div>
              <h1 className="font-black text-slate-900 text-sm sm:text-base truncate leading-tight">
                {currentModule?.label || "Dashboard Admin"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/bacaan"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition"
            >
              <BookOpen size={13} /> Perpustakaan Kader
            </Link>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              <span className="hidden sm:inline">Lihat Web</span>
              <span className="sm:hidden">Web</span>
              <ExternalLink size={12} />
            </Link>
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 text-white hover:bg-blue-600 transition"
              aria-label="Buka Semua Menu Admin"
            >
              <Grid size={17} />
            </button>
          </div>
        </header>

        {/* Scrollable Content Viewport (padded on mobile for bottom dock) */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 pb-28 lg:pb-10 scroll-smooth w-full">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>

      {/* ==================== 3. MOBILE NATIVE BOTTOM NAVIGATION DOCK (< lg) ==================== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#020617]/95 backdrop-blur-xl border-t border-slate-800 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-16 items-center max-w-md mx-auto">
          {MOBILE_DOCK_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin"
                ? pathname === "/admin" && !drawerOpen
                : pathname.startsWith(item.href) && !drawerOpen;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-all ${
                  active
                    ? "text-amber-400"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div
                  className={`px-3 py-1 rounded-full transition-colors ${
                    active ? "bg-blue-600/30 border border-blue-500/40" : ""
                  }`}
                >
                  <Icon size={18} />
                </div>
                <span className="text-[10px] font-bold tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* 5th Tab: App Drawer Launcher */}
          <button
            type="button"
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-all ${
              drawerOpen
                ? "text-amber-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div
              className={`px-3 py-1 rounded-full transition-colors ${
                drawerOpen ? "bg-amber-400 text-slate-950" : ""
              }`}
            >
              {drawerOpen ? <X size={18} /> : <Grid size={18} />}
            </div>
            <span className="text-[10px] font-bold tracking-tight">
              Semua Menu
            </span>
          </button>
        </div>
      </div>

      {/* ==================== 4. MOBILE NATIVE APP DRAWER SHEET (< lg) ==================== */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Bottom Sheet Container */}
          <div className="relative z-10 bg-[#020617] text-white border-t border-slate-800 rounded-t-3xl max-h-[84vh] flex flex-col shadow-2xl overflow-hidden pb-16">
            {/* Sheet Handle & Header */}
            <div className="px-5 pt-3 pb-3.5 border-b border-slate-800/90 flex flex-col">
              <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
                    Pusat Kendali Admin // Mobile OS
                  </p>
                  <h3 className="text-base font-black text-white">
                    Pilih Modul Manajemen
                  </h3>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Categorized App Icon Grid */}
            <div className="p-4 overflow-y-auto space-y-5">
              {ADMIN_MENU_GROUPS.map((group, gIdx) => (
                <div key={gIdx}>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 mb-2.5 px-1">
                    {group.groupLabel}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        item.href === "/admin"
                          ? pathname === "/admin"
                          : pathname.startsWith(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setDrawerOpen(false)}
                          className={`relative p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all active:scale-95 ${
                            isActive
                              ? "bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/25"
                              : "bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-800"
                          }`}
                        >
                          {item.badge && (
                            <span className="absolute top-1.5 right-1.5 text-[8px] font-mono font-black uppercase px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                              {item.badge}
                            </span>
                          )}
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isActive
                                ? "bg-white/15 text-amber-300"
                                : "bg-slate-800 text-blue-400"
                            }`}
                          >
                            <Icon size={20} />
                          </div>
                          <span className="text-[11px] font-bold leading-tight line-clamp-2">
                            {item.shortLabel}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Account & Logout Bar in Sheet */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase text-slate-500">
                    Sesi Aktif
                  </p>
                  <p className="text-xs font-mono font-bold text-slate-300 truncate">
                    {userEmail}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <LogOut size={14} /> Keluar Sistem
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
