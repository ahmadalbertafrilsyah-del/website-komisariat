"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Heart, Reply, Trash2, Send, MessageSquare } from "lucide-react";

export default function AdminDonasi() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "donasi_messages"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleReplySubmit = async (e, id) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      await updateDoc(doc(db, "donasi_messages", id), {
        adminReply: replyText,
        repliedAt: serverTimestamp()
      });
      setReplyText("");
      setActiveReplyId(null);
    } catch (error) {
      alert("Gagal membalas pesan.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus pesan dan riwayat donasi ini dari publik?")) return;
    try {
      await deleteDoc(doc(db, "donasi_messages", id));
    } catch (error) {
      alert("Gagal menghapus pesan.");
    }
  };

  if (loading) return <p className="text-slate-500 text-sm font-medium animate-pulse">Memuat pesan masuk...</p>;

  return (
    <div className="space-y-6 pb-12 w-full max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Heart className="text-pink-500" size={24}/> Log Donasi & Pesan Dukungan
        </h1>
        <p className="text-sm text-slate-500 mt-1">Balas pesan dan ucapan dari para donatur, senior, atau alumni.</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <MessageSquare size={18} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">Daftar Dukungan Masuk</h2>
        </div>

        <div className="divide-y divide-slate-100">
          {messages.length === 0 ? (
            <div className="p-12 text-center text-slate-400">Belum ada donasi atau pesan yang masuk.</div>
          ) : messages.map((msg) => (
            <div key={msg.id} className="p-6">
              <div className="flex justify-between items-start gap-4 mb-3">
                <div>
                  <h3 className="font-bold text-slate-800">{msg.nama}</h3>
                  <p className="text-xs text-slate-500 font-medium">{msg.createdAt?.toDate?.().toLocaleString("id-ID")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap">
                    Rp {Number(msg.nominal).toLocaleString('id-ID')}
                  </span>
                  <button onClick={() => handleDelete(msg.id)} className="text-slate-400 hover:text-red-500 transition"><Trash2 size={16}/></button>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-md border border-slate-100 text-sm text-slate-700 mb-4">
                "{msg.pesan}"
              </div>

              {msg.adminReply ? (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-md ml-8 md:ml-12 relative">
                  <div className="absolute -left-3 top-4 w-3 h-3 border-t border-l border-blue-100 bg-blue-50 rotate-[-45deg]"></div>
                  <p className="text-xs font-bold text-blue-800 mb-1">Balasan Pengurus:</p>
                  <p className="text-sm text-blue-900">{msg.adminReply}</p>
                  <button onClick={() => setActiveReplyId(msg.id)} className="text-[10px] font-bold text-blue-500 mt-2 hover:underline">Edit Balasan</button>
                </div>
              ) : (
                <div className="ml-0 md:ml-12">
                  {activeReplyId === msg.id ? (
                    <form onSubmit={(e) => handleReplySubmit(e, msg.id)} className="flex gap-2">
                      <input 
                        type="text" autoFocus value={replyText} onChange={e => setReplyText(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="Ketik balasan pengurus..."
                      />
                      <button type="submit" className="bg-blue-600 text-white px-4 rounded-md font-medium text-sm flex items-center gap-2"><Send size={14}/> Balas</button>
                      <button type="button" onClick={() => setActiveReplyId(null)} className="bg-slate-100 text-slate-600 px-3 rounded-md text-sm font-medium">Batal</button>
                    </form>
                  ) : (
                    <button onClick={() => {setActiveReplyId(msg.id); setReplyText("");}} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition">
                      <Reply size={14}/> Berikan Balasan
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}