"use client";
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Send, User, Mail, Phone, BookOpen, MapPin } from "lucide-react";

export default function Pendaftaran() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulasi pengiriman data ke Firebase
    setTimeout(() => {
      alert("Pendaftaran berhasil dikirim! Kami akan menghubungi Anda melalui WhatsApp.");
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] font-sans">
      <Navbar />

      {/* Header Banner */}
      <section className="pt-36 pb-20 px-4 bg-[#1e293b] text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Formulir <span className="text-[#facc15]">Pendaftaran</span>
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-lg font-light">
            Mari bertumbuh, bergerak, dan berdampak bersama PMII. Isi data diri Anda dengan lengkap dan benar.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-20 px-4 max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-[#1e293b]">Data Calon Kader</h2>
            <p className="text-sm text-slate-500 mt-1">Sistem Terintegrasi Database Kader UIN Maulana Malik Ibrahim Malang</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Nama Lengkap */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">Nama Lengkap</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input type="text" required className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#facc15] focus:border-transparent transition-all outline-none" placeholder="Masukkan nama lengkap" />
                </div>
              </div>

              {/* NIM */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">NIM</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5 text-slate-400" />
                  </div>
                  <input type="number" required className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#facc15] focus:border-transparent transition-all outline-none" placeholder="Masukkan NIM" />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Fakultas */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">Fakultas</label>
                <select required className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#facc15] focus:border-transparent transition-all outline-none bg-white">
                  <option value="">Pilih Fakultas</option>
                  <option value="saintek">Sains dan Teknologi</option>
                  <option value="syariah">Syariah</option>
                  <option value="fitk">Ilmu Tarbiyah dan Keguruan</option>
                  <option value="humaniora">Humaniora</option>
                  <option value="ekonomi">Ekonomi</option>
                  <option value="psikologi">Psikologi</option>
                  <option value="kedokteran">Kedokteran dan Ilmu Kesehatan</option>
                </select>
              </div>

              {/* Program Studi */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">Program Studi</label>
                <input type="text" required className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#facc15] focus:border-transparent transition-all outline-none" placeholder="Contoh: Teknik Informatika" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">Email Aktif</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input type="email" required className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#facc15] focus:border-transparent transition-all outline-none" placeholder="nama@email.com" />
                </div>
              </div>

              {/* No WhatsApp */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">No. WhatsApp</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input type="tel" required className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#facc15] focus:border-transparent transition-all outline-none" placeholder="081234567890" />
                </div>
              </div>
            </div>

            {/* Alamat Asal */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">Alamat Asal / Domisili</label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <MapPin className="h-5 w-5 text-slate-400" />
                </div>
                <textarea required rows="3" className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#facc15] focus:border-transparent transition-all outline-none resize-none" placeholder="Masukkan alamat lengkap..."></textarea>
              </div>
            </div>

            {/* Alasan */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">Motivasi Bergabung PMII</label>
              <textarea required rows="3" className="block w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#facc15] focus:border-transparent transition-all outline-none resize-none" placeholder="Ceritakan singkat motivasi Anda..."></textarea>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-[#1e293b] hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? "Mengirim Data..." : <>Kirim Formulir Pendaftaran <Send size={20} /></>}
              </button>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  );
}