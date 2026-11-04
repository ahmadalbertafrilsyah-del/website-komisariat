// app/admin/pengajuan/page.js
"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import {
  Inbox, Settings, Loader2, CheckCircle, XCircle, Trash2, Plus, Edit, X,
  Save, ArrowUp, ArrowDown, Link as LinkIcon, ExternalLink, FileText, Send
} from "lucide-react";

const defaultSkSchema = [
  { id: "namaOrganisasi", label: "Asal Organisasi / Nama Kepanitiaan", type: "text", required: true, placeholder: "Contoh: PR PMII Rayon XYZ" },
  { id: "email", label: "Email Pemohon (Penerima Info ACC)", type: "email", required: true, placeholder: "email_anda@gmail.com" },
  { id: "tentangSK", label: "Tentang SK", type: "textarea", required: true, placeholder: "Deskripsikan dengan singkat mengenai SK apa yang diajukan..." },
  { id: "linkBerkas", label: "Link Surat Permohonan / Berkas Dukung", type: "url", required: false, placeholder: "https://drive.google.com/..." }
];

const defaultRtarSchema = [
  { id: "namaRayon", label: "Nama Rayon", type: "text", required: true, placeholder: "Contoh: PR PMII Penakluk" },
  { id: "email", label: "Email Pemohon (Penerima Info ACC)", type: "email", required: true, placeholder: "email_anda@gmail.com" },
  { id: "waktuPelaksanaan", label: "Rencana Tgl Pelaksanaan", type: "date", required: true, placeholder: "" },
  { id: "tempat", label: "Tempat Pelaksanaan", type: "text", required: true, placeholder: "Misal: Gedung NU Kota Malang" },
  { id: "linkBerkas", label: "Link Berkas / Proposal (G-Drive)", type: "url", required: false, placeholder: "https://drive.google.com/..." }
];

export default function AdminPengajuan() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inbox-sk");

  // Data Inbox
  const [inboxSK, setInboxSK] = useState([]);
  const [inboxRTAR, setInboxRTAR] = useState([]);

  // Data Schema Form Custom
  const [skSchema, setSkSchema] = useState([]);
  const [rtarSchema, setRtarSchema] = useState([]);

  // Modal Custom Form Builder
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [fieldForm, setFieldForm] = useState({ id: "", label: "", type: "text", required: true, placeholder: "" });

  // Modal ACC SK (Input Link Rekomendasi)
  const [accModal, setAccModal] = useState({ isOpen: false, item: null, collection: "", linkRekomendasi: "" });

  // Modal Detail Data (Buka Data Lengkap)
  const [detailModal, setDetailModal] = useState({ isOpen: false, data: null, title: "" });

  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const skSnap = await getDocs(collection(db, "pengajuan_sk"));
        setInboxSK(skSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

        const rtarSnap = await getDocs(collection(db, "pengajuan_rtar"));
        setInboxRTAR(rtarSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

        const schemaSnap = await getDoc(doc(db, "website_config", "pengajuan_schema"));
        if (schemaSnap.exists()) {
          const sData = schemaSnap.data();
          setSkSchema(sData.sk || defaultSkSchema);
          setRtarSchema(sData.rtar || defaultRtarSchema);
        } else {
          setSkSchema(defaultSkSchema);
          setRtarSchema(defaultRtarSchema);
        }
      } catch (err) {
        console.error("Error fetching pengajuan:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const openDetail = (item) => {
    setDetailModal({
      isOpen: true,
      data: item.dataForm || {},
      title: item.dataForm?.namaOrganisasi || item.dataForm?.namaRayon || "Data Pemohon"
    });
  };

  const openAccModal = (item, collectionName) => {
    setAccModal({ isOpen: true, item, collection: collectionName, linkRekomendasi: "" });
  };

  const handleUpdateStatus = async (item, collectionName, newStatus, customLinkRekomendasi = null) => {
    if (newStatus === "Ditolak" && !confirm("Yakin menolak pengajuan ini? Notifikasi email akan dikirim.")) return;
    if (newStatus === "Disetujui" && customLinkRekomendasi === null && !confirm("Yakin menyetujui pengajuan ini?")) return;

    setIsSendingEmail(true);
    try {
      const updateData = { status: newStatus };
      if (customLinkRekomendasi) updateData.linkRekomendasi = customLinkRekomendasi;

      await updateDoc(doc(db, collectionName, item.id), updateData);

      if (collectionName === "pengajuan_sk") {
        setInboxSK(prev => prev.map(p => p.id === item.id ? { ...p, ...updateData } : p));
      } else {
        setInboxRTAR(prev => prev.map(p => p.id === item.id ? { ...p, ...updateData } : p));
      }

      if (item.email) {
        try {
          await fetch("/api/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: item.email,
              namaBarang: `Pengajuan ${collectionName === "pengajuan_sk" ? "SK Kepengurusan" : "Kegiatan RTAR"}`,
              namaOrganisasi: item.dataForm?.namaOrganisasi || item.dataForm?.namaRayon || "Organisasi PMII",
              status: newStatus,
              waktuPinjam: formatDate(item.createdAt),
              linkRekomendasi: customLinkRekomendasi || ""
            })
          });
        } catch (e) {
          console.error("Gagal kirim email", e);
        }
      }

      alert(`Berhasil! Pengajuan telah ${newStatus}.`);
      setAccModal({ isOpen: false, item: null, collection: "", linkRekomendasi: "" });
    } catch (err) {
      alert("Gagal update status: " + err.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDeleteInbox = async (id, collectionName) => {
    if (!confirm("Hapus data pengajuan ini permanen?")) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      if (collectionName === "pengajuan_sk") setInboxSK(prev => prev.filter(p => p.id !== id));
      else setInboxRTAR(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  // ================= ACTION FORM BUILDER =================
  const handleOpenBuilder = (index = null) => {
    if (index !== null) {
      const currentSchema = activeTab === "form-sk" ? skSchema : rtarSchema;
      setFieldForm(currentSchema[index]);
      setEditingIndex(index);
    } else {
      setFieldForm({ id: "", label: "", type: "text", required: true, placeholder: "" });
      setEditingIndex(null);
    }
    setIsModalOpen(true);
  };

  const handleSaveField = async (e) => {
    e.preventDefault();
    const fieldId = fieldForm.id || fieldForm.label.toLowerCase().replace(/[^a-z0-9]/g, "");
    const newField = { ...fieldForm, id: fieldId };

    const updatedSchema = activeTab === "form-sk" ? [...skSchema] : [...rtarSchema];
    if (editingIndex !== null) updatedSchema[editingIndex] = newField;
    else updatedSchema.push(newField);

    if (activeTab === "form-sk") setSkSchema(updatedSchema);
    else setRtarSchema(updatedSchema);

    await setDoc(doc(db, "website_config", "pengajuan_schema"), {
      [activeTab === "form-sk" ? "sk" : "rtar"]: updatedSchema
    }, { merge: true });

    setIsModalOpen(false);
  };

  const handleDeleteField = async (indexToDelete) => {
    if (!confirm("Yakin menghapus pertanyaan ini dari Form?")) return;
    const updatedSchema = activeTab === "form-sk"
      ? skSchema.filter((_, i) => i !== indexToDelete)
      : rtarSchema.filter((_, i) => i !== indexToDelete);

    if (activeTab === "form-sk") setSkSchema(updatedSchema);
    else setRtarSchema(updatedSchema);

    await setDoc(doc(db, "website_config", "pengajuan_schema"), {
      [activeTab === "form-sk" ? "sk" : "rtar"]: updatedSchema
    }, { merge: true });
  };

  const handleMoveField = async (index, direction) => {
    const updatedSchema = activeTab === "form-sk" ? [...skSchema] : [...rtarSchema];

    if (direction === -1 && index > 0) {
      [updatedSchema[index - 1], updatedSchema[index]] = [updatedSchema[index], updatedSchema[index - 1]];
    } else if (direction === 1 && index < updatedSchema.length - 1) {
      [updatedSchema[index], updatedSchema[index + 1]] = [updatedSchema[index + 1], updatedSchema[index]];
    } else {
      return;
    }

    if (activeTab === "form-sk") setSkSchema(updatedSchema);
    else setRtarSchema(updatedSchema);

    await setDoc(doc(db, "website_config", "pengajuan_schema"), {
      [activeTab === "form-sk" ? "sk" : "rtar"]: updatedSchema
    }, { merge: true });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={32} className="text-blue-600 animate-spin" />
      </div>
    );
  }

  const currentInbox = activeTab === "inbox-sk" ? inboxSK : inboxRTAR;
  const currentSchema = activeTab === "form-sk" ? skSchema : rtarSchema;

  return (
    <div className="space-y-5 pb-12 w-full text-sm">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 py-3.5 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600 block">
            LAYANAN PERMOHONAN KADER & RAYON
          </span>
          <h1 className="text-lg sm:text-xl font-black text-slate-900">
            Pusat Layanan Pengajuan SK & RTAR
          </h1>
        </div>
        {(activeTab === "form-sk" || activeTab === "form-rtar") && (
          <button
            onClick={() => handleOpenBuilder()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Plus size={15} /> Tambah Pertanyaan Form
          </button>
        )}
      </div>

      {/* TABS */}
      <div className="bg-white border border-slate-200 p-1.5 rounded-2xl flex overflow-x-auto gap-1 scrollbar-none shadow-sm">
        <button onClick={() => setActiveTab("inbox-sk")} className={`px-4 py-2.5 font-bold text-xs rounded-xl flex items-center gap-2 whitespace-nowrap transition ${activeTab === "inbox-sk" ? "bg-[#020617] text-white" : "text-slate-600 hover:bg-slate-100"}`}>
          <Inbox size={15} className={activeTab === "inbox-sk" ? "text-[#facc15]" : ""} /> Inbox SK ({inboxSK.length})
        </button>
        <button onClick={() => setActiveTab("inbox-rtar")} className={`px-4 py-2.5 font-bold text-xs rounded-xl flex items-center gap-2 whitespace-nowrap transition ${activeTab === "inbox-rtar" ? "bg-[#020617] text-white" : "text-slate-600 hover:bg-slate-100"}`}>
          <Inbox size={15} className={activeTab === "inbox-rtar" ? "text-[#facc15]" : ""} /> Inbox RTAR ({inboxRTAR.length})
        </button>
        <button onClick={() => setActiveTab("form-sk")} className={`px-4 py-2.5 font-bold text-xs rounded-xl flex items-center gap-2 whitespace-nowrap transition ${activeTab === "form-sk" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
          <Settings size={15} /> Setting Form SK
        </button>
        <button onClick={() => setActiveTab("form-rtar")} className={`px-4 py-2.5 font-bold text-xs rounded-xl flex items-center gap-2 whitespace-nowrap transition ${activeTab === "form-rtar" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
          <Settings size={15} /> Setting Form RTAR
        </button>
      </div>

      {/* ================= AREA INBOX ================= */}
      {(activeTab === "inbox-sk" || activeTab === "inbox-rtar") && (
        <>
          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {currentInbox.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-xs">
                Belum ada pengajuan masuk.
              </div>
            ) : (
              currentInbox.map((item, idx) => (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">#{idx + 1} • {formatDate(item.createdAt)}</span>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                        {item.dataForm?.namaOrganisasi || item.dataForm?.namaRayon || "Pemohon"}
                      </h4>
                      <p className="text-xs text-blue-600 break-all">{item.email}</p>
                    </div>
                    {item.status === "Disetujui" ? (
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">Disetujui</span>
                    ) : item.status === "Ditolak" ? (
                      <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">Ditolak</span>
                    ) : (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">Diproses</span>
                    )}
                  </div>
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openDetail(item)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
                    >
                      <FileText size={13} /> Buka Data
                    </button>
                    <div className="flex items-center gap-1.5">
                      {item.status === "Diproses" && (
                        <>
                          {activeTab === "inbox-sk" ? (
                            <button disabled={isSendingEmail} onClick={() => openAccModal(item, "pengajuan_sk")} className="bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold">ACC</button>
                          ) : (
                            <button disabled={isSendingEmail} onClick={() => handleUpdateStatus(item, "pengajuan_rtar", "Disetujui")} className="bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold">ACC</button>
                          )}
                          <button disabled={isSendingEmail} onClick={() => handleUpdateStatus(item, activeTab === "inbox-sk" ? "pengajuan_sk" : "pengajuan_rtar", "Ditolak")} className="bg-red-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold">Tolak</button>
                        </>
                      )}
                      <button onClick={() => handleDeleteInbox(item.id, activeTab === "inbox-sk" ? "pengajuan_sk" : "pengajuan_rtar")} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap min-w-max">
                <thead className="bg-slate-50 text-slate-500 text-[11px] font-mono uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4">Tanggal Masuk</th>
                    <th className="py-3.5 px-4">Data Pemohon</th>
                    <th className="py-3.5 px-4 text-center">Data Lengkap</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                  {currentInbox.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        Belum ada pengajuan masuk.
                      </td>
                    </tr>
                  ) : (
                    currentInbox.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono text-xs">{formatDate(item.createdAt)}</td>
                        <td className="py-3 px-4 max-w-[240px] whitespace-normal">
                          <p className="font-bold text-slate-900 line-clamp-2">
                            {item.dataForm?.namaOrganisasi || item.dataForm?.namaRayon || "Pemohon"}
                          </p>
                          <p className="text-xs text-blue-600 mt-0.5 break-words">{item.email}</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => openDetail(item)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold px-3 py-1.5 rounded-xl text-xs inline-flex items-center gap-1.5 transition"
                          >
                            <FileText size={14} /> Buka Data
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.status === "Disetujui" ? (
                            <div className="flex flex-col gap-1 items-center">
                              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase flex items-center gap-1">
                                <CheckCircle size={12} /> Disetujui
                              </span>
                              {item.linkRekomendasi && (
                                <a href={item.linkRekomendasi} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 underline mt-0.5">
                                  Lihat SK Rekom
                                </a>
                              )}
                            </div>
                          ) : item.status === "Ditolak" ? (
                            <span className="bg-red-100 text-red-700 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase inline-flex items-center gap-1">
                              <XCircle size={12} /> Ditolak
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase inline-flex items-center gap-1">
                              <Loader2 size={12} className="animate-spin" /> Diproses
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {item.status === "Diproses" && (
                              <>
                                {activeTab === "inbox-sk" ? (
                                  <button disabled={isSendingEmail} onClick={() => openAccModal(item, "pengajuan_sk")} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-1.5 rounded-lg shadow-sm" title="Setujui SK & Input Rekomendasi">
                                    <CheckCircle size={14} />
                                  </button>
                                ) : (
                                  <button disabled={isSendingEmail} onClick={() => handleUpdateStatus(item, "pengajuan_rtar", "Disetujui")} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-1.5 rounded-lg shadow-sm" title="Setujui (Kirim Email)">
                                    <CheckCircle size={14} />
                                  </button>
                                )}
                                <button disabled={isSendingEmail} onClick={() => handleUpdateStatus(item, activeTab === "inbox-sk" ? "pengajuan_sk" : "pengajuan_rtar", "Ditolak")} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white p-1.5 rounded-lg shadow-sm" title="Tolak (Kirim Email)">
                                  <XCircle size={14} />
                                </button>
                              </>
                            )}
                            <button onClick={() => handleDeleteInbox(item.id, activeTab === "inbox-sk" ? "pengajuan_sk" : "pengajuan_rtar")} className="bg-white border border-slate-200 text-slate-400 hover:text-red-600 p-1.5 rounded-lg">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ================= MODAL DETAIL DATA PENGAJUAN ================= */}
      {detailModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
            <div className="sticky top-0 z-20 bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                Detail Pengajuan — {detailModal.title}
              </h3>
              <button onClick={() => setDetailModal({ isOpen: false, data: null, title: "" })} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-white flex-1 space-y-4">
              {Object.entries(detailModal.data || {}).map(([key, val]) => {
                const isLink = typeof val === "string" && val.startsWith("http");
                const formattedKey = key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());

                return (
                  <div key={key} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <span className="font-bold text-slate-500 block mb-1 text-[11px] font-mono uppercase tracking-wider">{formattedKey}</span>
                    {isLink ? (
                      <a href={val} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline inline-flex items-center gap-1.5 font-bold bg-blue-50 px-3 py-1.5 rounded-xl text-xs mt-1">
                        <ExternalLink size={13} /> Buka Berkas Terlampir
                      </a>
                    ) : (
                      <span className="text-slate-900 font-medium text-sm whitespace-pre-wrap">{val || "-"}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL KHUSUS ACC SK (TOMBOL SETUJUI STICKY DI ATAS) ================= */}
      {accModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="sticky top-0 z-20 bg-white px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-600 p-1.5 rounded-lg text-white">
                  <CheckCircle size={16} />
                </div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base">Setujui & Terbitkan SK</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={isSendingEmail || !accModal.linkRekomendasi}
                  onClick={() => handleUpdateStatus(accModal.item, accModal.collection, "Disetujui", accModal.linkRekomendasi)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  {isSendingEmail ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Kirim ACC</span>
                </button>
                <button onClick={() => setAccModal({ isOpen: false, item: null, collection: "", linkRekomendasi: "" })} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Pengajuan dari <strong>{accModal.item.dataForm?.namaOrganisasi || "Pemohon"}</strong> akan disetujui. Masukkan link Google Drive Surat Rekomendasi/Balasan agar terkirim otomatis ke email <strong>{accModal.item.email}</strong>.
              </p>
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="url"
                  value={accModal.linkRekomendasi}
                  onChange={e => setAccModal({ ...accModal, linkRekomendasi: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:bg-white focus:border-emerald-600 outline-none"
                  placeholder="https://drive.google.com/..."
                  required
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= AREA FORM BUILDER ================= */}
      {(activeTab === "form-sk" || activeTab === "form-rtar") && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6 w-full">
          <div className="mb-5">
            <h2 className="font-black text-slate-900 text-base sm:text-lg">Konfigurasi Pertanyaan Formulir</h2>
            <p className="text-xs text-slate-500">Sesuaikan kolom input yang wajib diisi kader saat mengajukan permohonan.</p>
          </div>

          <div className="space-y-2.5 w-full">
            {currentSchema.map((field, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50/70 hover:border-blue-300 transition-colors w-full"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                    <span>{field.label}</span>
                    {field.required && (
                      <span className="text-red-600 text-[10px] bg-red-100 px-2 py-0.5 rounded font-mono font-bold uppercase">
                        Wajib
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono bg-white border border-slate-200 w-max px-2 py-0.5 rounded">
                    Tipe: {field.type} • ID: {field.id}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden mr-1">
                    <button onClick={() => handleMoveField(idx, -1)} disabled={idx === 0} className="p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowUp size={14} /></button>
                    <div className="w-px bg-slate-200" />
                    <button onClick={() => handleMoveField(idx, 1)} disabled={idx === currentSchema.length - 1} className="p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowDown size={14} /></button>
                  </div>
                  <button onClick={() => handleOpenBuilder(idx)} className="text-amber-600 hover:bg-amber-50 p-2 rounded-lg border border-slate-200 bg-white"><Edit size={14} /></button>
                  <button onClick={() => handleDeleteField(idx)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg border border-slate-200 bg-white"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL FORM BUILDER (TOMBOL SIMPAN STICKY DI ATAS) ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
            <div className="sticky top-0 z-20 bg-white px-5 py-4 border-b border-slate-200 flex justify-between items-center gap-2 shrink-0">
              <h2 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Settings size={18} className="text-blue-600" />
                {editingIndex !== null ? "Edit Pertanyaan" : "Buat Pertanyaan Baru"}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  form="fieldForm"
                  className="text-xs font-bold px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm"
                >
                  <Save size={14} /> Simpan Pertanyaan
                </button>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto bg-white flex-1">
              <form id="fieldForm" onSubmit={handleSaveField} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                    Judul Pertanyaan (Label) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fieldForm.label}
                    onChange={e => setFieldForm({ ...fieldForm, label: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/70 focus:bg-white outline-none focus:border-blue-600"
                    placeholder="Contoh: Lampirkan Surat Rekomendasi"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">Jenis Input</label>
                    <select
                      value={fieldForm.type}
                      onChange={e => setFieldForm({ ...fieldForm, type: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/70 focus:bg-white outline-none focus:border-blue-600"
                    >
                      <option value="text">Teks Pendek (Text)</option>
                      <option value="textarea">Teks Panjang (Textarea)</option>
                      <option value="email">Email</option>
                      <option value="date">Tanggal (Date)</option>
                      <option value="number">Angka (Number)</option>
                      <option value="url">Link Teks (G-Drive / Web)</option>
                      <option value="file">Upload Dokumen/Berkas (.pdf)</option>
                      <option value="image">Upload Gambar/Foto (.jpg, .png)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">Wajib Diisi?</label>
                    <select
                      value={fieldForm.required}
                      onChange={e => setFieldForm({ ...fieldForm, required: e.target.value === "true" })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/70 focus:bg-white outline-none focus:border-blue-600"
                    >
                      <option value="true">Ya, Wajib</option>
                      <option value="false">Tidak (Opsional)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">Teks Petunjuk (Placeholder)</label>
                  <input
                    type="text"
                    value={fieldForm.placeholder}
                    onChange={e => setFieldForm({ ...fieldForm, placeholder: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/70 focus:bg-white outline-none focus:border-blue-600"
                    placeholder="Misal: Masukkan data di sini..."
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
