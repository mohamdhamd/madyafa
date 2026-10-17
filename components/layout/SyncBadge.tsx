"use client";

import React, { useEffect, useState } from "react";
import { syncEngine, SyncState } from "@/lib/sync/syncEngine";

export default function SyncBadge() {
  const [syncState, setSyncState] = useState<SyncState>("synced");
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    syncEngine.init();
    const unsubscribe = syncEngine.subscribe((state, count) => {
      setSyncState(state);
      setPendingCount(count);
    });
    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    setIsRotating(true);
    await syncEngine.syncPending();
    setTimeout(() => setIsRotating(false), 800);
  };

  if (syncState === "offline") {
    return (
      <button
        onClick={handleManualSync}
        className="px-2 py-1 rounded-xl text-[10px] sm:text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm active:scale-95 transition shrink-0"
        title="أنت تعمل الآن بدون إنترنت. كافة البيانات محفوظة على جهازك"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
        <span className="hidden xs:inline sm:inline">أوفلاين</span>
        {pendingCount > 0 && <span className="font-extrabold text-[10px]">({pendingCount})</span>}
        <i className="fa-solid fa-cloud-arrow-up text-[10px] opacity-70"></i>
      </button>
    );
  }

  if (syncState === "syncing" || isRotating) {
    return (
      <div className="px-2 py-1 rounded-xl text-[10px] sm:text-[11px] font-bold bg-teal-950/80 text-teal-300 border border-teal-500/40 flex items-center gap-1 shadow-sm shrink-0">
        <i className="fa-solid fa-arrows-rotate animate-spin text-[10px] text-teal-400"></i>
        <span className="hidden sm:inline">جاري المزامنة...</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <button
        onClick={handleManualSync}
        className="px-2 py-1 rounded-xl text-[10px] sm:text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm active:scale-95 transition shrink-0"
        title="انقر لمزامنة التغييرات المعلقة الآن"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        <span className="hidden xs:inline">معلق</span>
        <span className="text-[10px] font-bold">({pendingCount})</span>
        <i className="fa-solid fa-rotate text-[10px]"></i>
      </button>
    );
  }

  return (
    <button
      onClick={handleManualSync}
      className="px-2 py-1 rounded-xl text-[10px] sm:text-[11px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-sm hover:bg-emerald-900/60 active:scale-95 transition group shrink-0"
      title="كافة البيانات محفوظة سحابياً ومحلياً بأمان. انقر للتحديث الفوري"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
      <span className="hidden sm:inline">متزامن</span>
      <i className="fa-solid fa-cloud-check text-[10px] opacity-80 group-hover:rotate-180 transition-transform duration-500"></i>
    </button>
  );
}
