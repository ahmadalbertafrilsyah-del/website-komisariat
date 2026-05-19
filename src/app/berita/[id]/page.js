"use client";
import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Calendar, User, Clock, Share2, Tag, Bookmark } from "lucide-react";

export default function DetailBerita() {
  const params = useParams();

  // Simulasi database (Di real-app, ini diambil dari API/Database)
  const article = {
    title: "Refleksi Hari Lahir PMII: Meneguhkan Komitmen Kebangsaan di Era Digital",
    category: "Opini",
    date: "17 April 2026",
    penulis: "Tim Infokom",
    readTime: "5 Menit Baca",
    content: `Pergerakan Mahasiswa Islam Indonesia (PMII) lahir pada 17 April 1960 di Surabaya. Menapak usia yang matang ini, tantangan yang dihadapi oleh pergerakan tentu semakin kompleks. Rekonstruksi gerakan dan adaptasi ekosistem baru digital harus dikawal ketat oleh seluruh kader komisariat agar selaras dengan tuntutan zaman tanpa mencabut akar nilai Keislaman dan Kebangsaan.

    Dalam era disrupsi ini, kader PMII tidak hanya dituntut untuk cerdas secara intelektual, tetapi juga harus adaptif terhadap teknologi. Transformasi digital bukan sekadar pindah platform dari luring ke daring, melainkan bagaimana substansi nilai-nilai Aswaja tetap terjaga dalam setiap konten digital yang diproduksi.

    Sebagaimana pesan pendiri bangsa, mahasiswa adalah penyambung lidah rakyat. Maka, setiap ketukan keyboard kita di media sosial harus merepresentasikan keberpihakan pada kaum yang lemah (mustadh'afin).`,
  };

  return (
    <main className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar />

      <div className="pt-32 pb-24 px-4 max-w-4xl mx-auto">
        {/* Breadcrumb & Navigation */}
        <div className="flex justify-between items-center mb-8">
            <Link href="/berita" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">
              <ArrowLeft size={16} /> Kembali
            </Link>
            <div className="flex gap-2 text-slate-400">
                <Bookmark size={20} className="hover:text-blue-600 cursor-pointer" />
                <Share2 size={20} className="hover:text-blue-600 cursor-pointer" />
            </div>
        </div>

        {/* Hero Section: Judul & Meta */}
        <header className="mb-10 text-center">
          <div className="inline-block bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            {article.category}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-[1.2] mb-6 tracking-tight">
            {article.title}
          </h1>
          
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-slate-500 font-medium">
             <div className="flex items-center gap-2"><User size={16} className="text-blue-600"/> {article.penulis}</div>
             <div className="flex items-center gap-2"><Calendar size={16} className="text-blue-600"/> {article.date}</div>
             <div className="flex items-center gap-2"><Clock size={16} className="text-blue-600"/> {article.readTime}</div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="w-full h-64 md:h-[450px] bg-slate-200 rounded-3xl mb-12 overflow-hidden shadow-lg border border-slate-100 flex items-center justify-center">
           <span className="text-slate-400 font-medium italic">Gambar Utama Berita</span>
        </div>

        {/* Content Area */}
        <article className="prose prose-lg md:prose-xl max-w-none text-slate-700 leading-loose">
          <p className="first-letter:text-5xl first-letter:font-bold first-letter:text-blue-600 first-letter:mr-3 first-letter:float-left text-justify">
            {article.content}
          </p>
          
          {/* Kutipan Menonjol (Pull Quote) */}
          <blockquote className="my-12 p-8 bg-slate-50 border-l-4 border-blue-600 rounded-r-2xl italic text-slate-800 font-medium shadow-sm">
            "Transformasi digital bukan sekadar pindah platform dari luring ke daring, melainkan bagaimana substansi nilai-nilai Aswaja tetap terjaga."
          </blockquote>
          
          <p className="text-justify">{article.content}</p>
        </article>

        {/* Separator */}
        <hr className="my-16 border-slate-100" />

        {/* Related Articles Section */}
        <section>
          <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <Tag size={20} className="text-blue-600" /> Bacaan Terkait
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
               <Link href="#" key={i} className="group p-6 border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-lg transition-all">
                  <span className="text-blue-600 font-bold text-xs uppercase">Kegiatan</span>
                  <h4 className="font-bold text-slate-900 mt-2 group-hover:text-blue-600 transition-colors">Menakar Peran Mahasiswa dalam Krisis Ekologi Global</h4>
               </Link>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}