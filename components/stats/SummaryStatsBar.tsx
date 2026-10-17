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

  return (
    <section className="max-w-7xl w-full mx-auto px-3 sm:px-4 pt-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* Card 1: Active Column Selector & Collected Amount */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-bold text-slate-400">ملخص البند:</span>
            <select
              value={activeColId}
              onChange={(e) => onSelectColumn(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-teal-300 font-bold text-xs rounded-lg px-2 py-1 max-w-[130px] truncate focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} {c.isArchived ? "📦 (مؤرشف)" : ""} ({c.amount} {currency})
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-base sm:text-xl font-black text-emerald-400 tracking-tight">
              {stats.collectedAmount.toLocaleString()} {currency}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 flex items-center justify-between">
              <span>تم تحصيله</span>
              <span className="text-emerald-500 font-bold">{stats.paidCount} دفعوا</span>
            </div>
          </div>
        </div>

        {/* Card 2: Remaining Amount & Unpaid Count */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-lg flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center justify-between">
            <span>المتبقي في البند</span>
            <i className="fa-solid fa-hourglass-half text-amber-500 text-xs"></i>
          </div>
          <div>
            <div className="text-base sm:text-xl font-black text-amber-400 tracking-tight">
              {stats.remainingAmount.toLocaleString()} {currency}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 flex items-center justify-between">
              <span>متبقي للتحصيل</span>
              <span className="text-amber-500 font-bold">
                {Math.max(0, stats.totalMembers - stats.paidCount)} فرد
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Members & Paid Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-lg flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center justify-between">
            <span>نسبة التحصيل</span>
            <i className="fa-solid fa-users text-teal-400 text-xs"></i>
          </div>
          <div>
            <div className="text-base sm:text-xl font-black text-slate-100 tracking-tight">
              {stats.paidCount} <span className="text-xs text-slate-400">/ {stats.totalMembers}</span>
            </div>
            <div className="mt-1.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-l from-emerald-400 to-teal-500 h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${stats.totalMembers > 0 ? (stats.paidCount / stats.totalMembers) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 4: Net Treasury Balance & Expenses Trigger */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-lg flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center justify-between">
            <span>صافي الخزينة</span>
            {onOpenExpenses && (
              <button
                onClick={onOpenExpenses}
                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded-lg flex items-center gap-1 active:scale-95 transition"
              >
                <i className="fa-solid fa-receipt text-[9px]"></i>
                <span>المصروفات</span>
              </button>
            )}
          </div>
          <div>
            <div className="text-base sm:text-xl font-black text-teal-300 tracking-tight">
              {netTreasury.toLocaleString()} {currency}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 flex items-center justify-between">
              <span>مصروفات: {totalExpenses.toLocaleString()} {currency}</span>
              <span className="text-teal-400 font-bold">الرصيد المتاح</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
