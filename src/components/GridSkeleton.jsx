import React from "react";

export default function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
      {/* Menampilkan 8 kotak kosong sebagai kerangka muat */}
      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
        <div key={item} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col animate-pulse">
          {/* Kerangka Gambar */}
          <div className="h-40 sm:h-48 w-full bg-slate-200"></div>
          
          {/* Kerangka Teks */}
          <div className="p-5 flex flex-col flex-grow">
            <div className="h-5 bg-slate-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-6"></div>
            <div className="mt-auto space-y-2">
              <div className="h-3 bg-slate-200 rounded w-full"></div>
              <div className="h-3 bg-slate-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}