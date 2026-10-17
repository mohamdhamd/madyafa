"use client";

import React from "react";

interface SummaryStatsBarProps {
  columns: Array<{ id: string; title: string; amount: number; isArchived?: boolean }>;
  activeColId: string;
  onSelectColumn: (colId: string) => void;
  stats: {
    paidCount: number;
    totalMembers: number;
    collectedAmount: number;
    remainingAmount: number;
    shareAmount: number;
  };
  totalExpenses: number;
  currency?: string;
  onOpenExpenses?: () => void;
}

export default function SummaryStatsBar({
  columns,
  activeColId,
  onSelectColumn,
  stats,
  totalExpenses,
  currency = "ج.م",
  onOpenExpenses,
}: SummaryStatsBarProps) {
  const netTreasury = Math.max(0, stats.collectedAmount - totalExpenses);
  const paidPercent = stats.totalMembers > 0 ? Math.round((stats.paidCount / stats.totalMembers) * 100) : 0;

  return (
    <section className="max-w-7xl w-full mx-auto px-2.5 sm:px-4 pt-2">
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-2 sm:p-2.5 shadow-lg flex flex-col gap-1.5">
        {/* Row 1: Column Selector Dropdown + Expenses / Treasury Trigger */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">بند الحساب:</span>
            <select
              value={activeColId}
              onChange={(e) => onSelectColumn(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 text-teal-300 font-bold text-xs rounded-xl px-2 py-1 max-w-[200px] truncate focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} {c.isArchived ? "📦 (مؤرشف)" : ""} ({c.amount} {currency})
                </option>
              ))}
            </select>
          </div>

          {onOpenExpenses && (
            <button
              onClick={onOpenExpenses}
              className="text-[11px] font-bold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shrink-0 active:scale-95 transition"
            >
              <i className="fa-solid fa-receipt text-[10px] text-rose-400"></i>
              <span>المصروفات والخزينة</span>
              {totalExpenses > 0 && (
                <span className="text-[10px] bg-rose-900/80 px-1 rounded text-rose-200">
                  {totalExpenses.toLocaleString()}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Row 2: 3 Ultra-Compact Metric Stats in 1 Row */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 text-center">
          {/* 1. Collected */}
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl px-2 py-1.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-bold mb-0.5">
              <span>المحصل</span>
              <span className="text-emerald-400 font-extrabold">{paidPercent}%</span>
            </div>
            <div className="text-xs sm:text-base font-black text-emerald-400 truncate">
              {stats.collectedAmount.toLocaleString()} <span className="text-[9px] sm:text-[10px] font-normal text-slate-400">{currency}</span>
            </div>
            <div className="mt-1 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div
                className="bg-emerald-400 h-1 rounded-full transition-all duration-300"
                style={{ width: `${paidPercent}%` }}
              ></div>
            </div>
          </div>

          {/* 2. Remaining */}
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl px-2 py-1.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-bold mb-0.5">
              <span>المتبقي</span>
              <span className="text-amber-400 text-[10px]">({Math.max(0, stats.totalMembers - stats.paidCount)} فرد)</span>
            </div>
            <div className="text-xs sm:text-base font-black text-amber-400 truncate">
              {stats.remainingAmount.toLocaleString()} <span className="text-[9px] sm:text-[10px] font-normal text-slate-400">{currency}</span>
            </div>
            <div className="mt-1 text-[9px] text-slate-500 truncate">
              من أصل {stats.totalMembers}
            </div>
          </div>

          {/* 3. Net Treasury */}
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl px-2 py-1.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-bold mb-0.5">
              <span>صافي الخزينة</span>
              <i className="fa-solid fa-vault text-[10px] text-teal-400"></i>
            </div>
            <div className="text-xs sm:text-base font-black text-teal-300 truncate">
              {netTreasury.toLocaleString()} <span className="text-[9px] sm:text-[10px] font-normal text-slate-400">{currency}</span>
            </div>
            <div className="mt-1 text-[9px] text-slate-500 truncate">
              مصروفات: {totalExpenses.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
