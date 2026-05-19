"use client";
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, Database, UserX, ShieldCheck, FileSpreadsheet } from "lucide-react";

export default function DatabaseAnggota() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Data simulasi (Ditambahkan kolom NIA)
  const allMembers = [
    { nim: "230101", nia: "04.03.23.001", nama: "Ahmad Rosikhul Fahmi", fakultas: "Sains dan Teknologi", angkatan: "2023", status: "Aktif" },
    { nim: "230102", nia: "04.03.23.002", nama: "Moh. Aditya Hadi Saputra", fakultas: "Sains dan Teknologi", angkatan: "2023", status: "Aktif" },
    { nim: "220456", nia: "04.03.22.045", nama: "Siti Nurhaliza", fakultas: "Syariah", angkatan: "2022", status: "Aktif" },
    { nim: "210789", nia: "04.03.21.089", nama: "Bima Arya", fakultas: "Ilmu Tarbiyah dan Keguruan", angkatan: "2021", status: "Alumni" },
    { nim: "240112", nia: "04.03.24.012", nama: "Dinda Kirana", fakultas: "Humaniora", angkatan: "2024", status: "Kader Baru" },
  ];

  // Fungsi untuk menangani pencarian
  const handleSearch = (e) => {
    e.preventDefault(); // Mencegah halaman reload saat form di-submit
    
    if (!searchQuery.trim()) {
      setHasSearched(false);
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = allMembers.filter(member =>
      member.nama.toLowerCase().includes(query) ||
      member.nim.includes(query) ||
      member.nia.includes(query)
    );

    setSearchResults(results);
    setHasSearched(true);
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] font-sans flex flex-col">
      <Navbar />

      <div className="flex-grow">
        {/* Header Section */}
        <section className="pt-36 pb-10 px-4 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-4 bg-blue-100/50 rounded-full mb-6 border border-blue-200">
             <Database className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1e293b] mb-4 tracking-tight">
            Database <span className="text-[#facc15]">Kader</span>
          </h1>
          <p className="text-slate-500 text-lg">
            Sistem Informasi Pendataan Anggota PMII Komisariat.
          </p>
        </section>

        {/* Search Box Section */}
        <section className="px-4 max-w-3xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="relative shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden flex bg-white border border-slate-200 focus-within:ring-2 focus-within:ring-[#facc15] focus-within:border-[#facc15] transition-all">
            <div className="flex items-center justify-center pl-6 bg-white">
              <Search className="h-6 w-6 text-slate-400" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Masukkan NIM, NIA, atau Nama Kader..." 
              className="w-full pl-4 pr-4 py-5 text-lg bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400" 
            />
            <button 
              type="submit"
              className="bg-[#1e293b] hover:bg-slate-800 text-white font-bold px-8 transition-colors whitespace-nowrap"
            >
              Cari Data
            </button>
          </form>
        </section>

        {/* Results Section */}
        <section className="px-4 max-w-6xl mx-auto mb-20">
          
          {/* Kondisi 1: Belum Melakukan Pencarian */}
          {!hasSearched && (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center">
              <ShieldCheck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-400 mb-2">Portal Pengecekan Anggota</h3>
              <p className="text-slate-400">Silakan masukkan NIM, NIA, atau Nama Kader pada kolom pencarian di atas untuk memverifikasi status keanggotaan.</p>
            </div>
          )}

          {/* Kondisi 2: Telah Mencari, tapi Data Tidak Ditemukan */}
          {hasSearched && searchResults.length === 0 && (
            <div className="bg-white rounded-3xl border border-red-100 p-16 text-center shadow-lg">
              <UserX className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Data Tidak Ditemukan</h3>
              <p className="text-slate-500">Kader dengan pencarian <span className="font-bold text-slate-800">"{searchQuery}"</span> tidak terdaftar dalam database kami. Pastikan penulisan NIM/NIA/Nama sudah benar.</p>
            </div>
          )}

          {/* Kondisi 3: Telah Mencari dan Data Ditemukan */}
          {hasSearched && searchResults.length > 0 && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-slate-50 border-b border-slate-200 p-4 md:p-6 flex justify-between items-center">
                <p className="font-semibold text-slate-700">
                  Ditemukan <span className="text-blue-600">{searchResults.length}</span> data yang cocok
                </p>
                <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition">
                  <FileSpreadsheet size={16} /> Export Hasil
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#1e293b] text-white">
                      <th className="py-4 px-6 font-semibold text-sm">NIM</th>
                      <th className="py-4 px-6 font-semibold text-sm text-yellow-400">NIA</th>
                      <th className="py-4 px-6 font-semibold text-sm">Nama Kader</th>
                      <th className="py-4 px-6 font-semibold text-sm">Fakultas / Rayon</th>
                      <th className="py-4 px-6 font-semibold text-sm text-center">Angkatan</th>
                      <th className="py-4 px-6 font-semibold text-sm text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700 text-sm divide-y divide-slate-100">
                    {searchResults.map((member, index) => (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 font-mono text-slate-500">{member.nim}</td>
                        <td className="py-4 px-6 font-mono font-bold text-slate-700">{member.nia}</td>
                        <td className="py-4 px-6 font-bold text-[#1e293b]">{member.nama}</td>
                        <td className="py-4 px-6">{member.fakultas}</td>
                        <td className="py-4 px-6 text-center">{member.angkatan}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            member.status === 'Aktif' ? 'bg-green-100 text-green-700' : 
                            member.status === 'Alumni' ? 'bg-slate-200 text-slate-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {member.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}