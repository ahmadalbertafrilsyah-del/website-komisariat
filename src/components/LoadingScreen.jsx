"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const LOGO_URL = "/logo.png";

export default function LoadingScreen({ text = "Memuat Sistem" }) {
  const [globalConfig, setGlobalConfig] = useState(null);

  useEffect(() => {
    const cachedGlobal = localStorage.getItem('pmii_global_config');
    if (cachedGlobal) {
      setGlobalConfig(JSON.parse(cachedGlobal));
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col items-center justify-center overflow-hidden">
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 md:w-64 h-48 md:h-64 bg-blue-600/30 rounded-full blur-[80px] animate-pulse"></div>
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 md:w-48 h-32 md:h-48 bg-yellow-500/20 rounded-full blur-[60px] animate-pulse delay-75"></div>
       
       <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="relative z-10 flex flex-col items-center">
         <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center mb-8 relative z-20">
            {LOGO_URL ? (
               <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
            ) : (
               <div className="w-full h-full bg-blue-600 rounded-2xl shadow-[0_0_50px_rgba(37,99,235,0.4)] border border-blue-400/30 flex items-center justify-center">
                  <span className="text-yellow-400 font-extrabold text-2xl md:text-3xl tracking-widest">{globalConfig?.logoText || "PMII"}</span>
               </div>
            )}
         </motion.div>
         
         <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs md:text-sm tracking-widest uppercase">
            <span>{text}</span>
            <div className="flex gap-1 mt-0.5">
               <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></motion.div>
               <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></motion.div>
               <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></motion.div>
            </div>
         </div>
       </motion.div>
    </div>
  );
}