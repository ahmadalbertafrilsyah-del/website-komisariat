"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
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
  PanelLeftClose,
  PanelLeftOpen,
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
    groupLabel: "Database Organisasi",
    items: [
      {
        href: "/admin/struktur",
        label: "Database Pengurus",
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
        label: "Database Rayon",
        shortLabel: "Rayon",
        icon: Compass,
      },
      {
        href: "/admin/alumni",
        label: "Database Alumni",
        shortLabel: "Alumni",
        icon: GraduationCap,
      },
      {
        href: "/admin/apresiasi",
        label: "Apresiasi Kader",
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
        label: "Perpustakaan",
        shortLabel: "Bacaan",
        icon: BookOpen,
      },
      {
        href: "/admin/berita",
        label: "Kabar Pergerakan",
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const savedCollapsed = window.localStorage.getItem("pmii_admin_sidebar_collapsed");
      if (savedCollapsed === "true") {
        setIsSidebarCollapsed(true);
      }
      if (!user && pathname !== "/admin/login") {
        router.push("/admin/login");
      } else {
        setUserEmail(user?.email || "Admin Komisariat");
        setIsAuthChecking(false);
      }
    });
    return () => unsubscribe();
  }, [pathname, router]);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem("pmii_admin_sidebar_collapsed", String(next));
      return next;
    });
  };

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
    <div className="fixed inset-0 flex h-[100dvh] w-full bg-[#f1f5f9] overflow-hidden font-sans text-slate-900">
      {/* ==================== 1. DESKTOP SIDEBAR (lg+, Collapsible) ==================== */}
      <aside
        className={`hidden lg:flex ${
          isSidebarCollapsed ? "w-[74px]" : "w-64"
        } bg-[#020617] text-white flex-col border-r border-slate-800/80 shrink-0 select-none transition-all duration-200`}
      >
        {/* Brand Masthead */}
        <div
          className={`h-14 border-b border-slate-800/80 flex items-center ${
            isSidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-9 h-9 shrink-0">
                <Image
                  src="/logo.png"
                  alt="Logo PMII"
                  fill
                  sizes="36px"
                  className="object-contain"
                  priority
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-black tracking-wider text-white uppercase truncate">
                  Command Center
                </h2>
                <p className="text-[10px] font-mono text-amber-400 truncate">
                  PMII Sunan Ampel
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={toggleSidebarCollapse}
            title={
              isSidebarCollapsed
                ? "Perlebar Sidebar (Tampilkan Teks)"
                : "Sembunyikan Teks Sidebar (Hanya Ikon)"
            }
            className="p-2 rounded-lg bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-800 transition shrink-0"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <PanelLeftClose size={16} />
            )}
          </button>
        </div>

        {/* Navigation Groups */}
        <nav
          className={`flex-1 ${
            isSidebarCollapsed ? "px-2 py-3 space-y-3" : "px-3 py-4 space-y-5"
          } overflow-y-auto hide-scrollbar`}
        >
          {ADMIN_MENU_GROUPS.map((group, gIdx) => (
            <div key={gIdx}>
              {!isSidebarCollapsed ? (
                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-3">
                  {group.groupLabel}
                </p>
              ) : (
                gIdx > 0 && <div className="h-px bg-slate-800/80 my-2 mx-2" />
              )}
              <div className="space-y-1">
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
                      title={item.label}
                      className={`group relative flex items-center ${
                        isSidebarCollapsed
                          ? "justify-center p-2.5"
                          : "justify-between px-3 py-2"
                      } rounded-xl text-[13px] transition-all ${
                        isActive
                          ? "bg-blue-600 text-white font-semibold shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-slate-900 font-medium"
                      }`}
                    >
                      <span
                        className={`flex items-center ${
                          isSidebarCollapsed ? "justify-center" : "gap-2.5 truncate"
                        }`}
                      >
                        <Icon
                          size={isSidebarCollapsed ? 18 : 15}
                          className={
                            isActive
                              ? "text-amber-300 shrink-0"
                              : "text-slate-400 group-hover:text-slate-200 shrink-0"
                          }
                        />
                        {!isSidebarCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
          {!isSidebarCollapsed && (
            <div className="px-2 py-0.5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate font-mono">{userEmail}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Keluar Sistem"
            className={`w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-800 hover:border-rose-500 ${
              isSidebarCollapsed ? "p-2.5" : "px-3 py-2"
            } rounded-xl text-xs font-bold transition-colors`}
          >
            <LogOut size={15} />
            {!isSidebarCollapsed && <span>Keluar Sistem</span>}
          </button>
        </div>
      </aside>

      {/* ==================== 2. MAIN WORKSPACE AREA ==================== */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top App Bar (Compact Context Header - Sticky & Fixed on Mobile & Desktop) */}
        <header className="sticky top-0 z-40 bg-[#020617] text-white border-b border-slate-800 px-3.5 sm:px-6 h-14 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <CurrentIcon size={16} />
            </div>
            <div className="min-w-0 flex items-center gap-2">
              <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-widest text-slate-400">
                PANEL ADMIN
              </span>
              <ChevronRight size={12} className="hidden sm:inline text-slate-600" />
              <span className="font-bold text-white text-xs sm:text-sm truncate">
                {currentModule?.label || "Dashboard Admin"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
              aria-label="Buka Semua Menu Admin"
            >
              <Grid size={16} />
            </button>
          </div>
        </header>

        {/* Scrollable Content Viewport — overscroll-contain keeps top header firmly pinned on mobile */}
        <main className="flex-1 overflow-y-auto px-3.5 sm:px-6 pb-28 lg:pb-12 pt-0 scroll-smooth w-full overscroll-contain">
          <div className="max-w-[1600px] mx-auto w-full">{children}</div>
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
