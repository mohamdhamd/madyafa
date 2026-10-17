"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/layout/Footer";

interface PublicData {
  workspace: {
    id: string;
    title: string;
    description: string;
    currency: string;
    defaultAmount: number;
  };
  members: Array<{
    id: string;
    orderIndex: number;
    name: string;
    generalNote: string;
  }>;
  columns: Array<{
    id: string;
    orderIndex: number;
    title: string;
    amount: number;
  }>;
  payments: Array<{
    id: string;
    memberId: string;
    columnId: string;
    status: "paid" | "partial" | "exempt" | "unpaid";
    paidAmount: number;
    note: string;
  }>;
  totalExpenses: number;
}

export default function PublicViewPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresPin, setRequiresPin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async (pinToSend?: string) => {
    setLoading(true);
    setPinError("");
    try {
      const url = `/api/public/${slug}${pinToSend ? `?pin=${encodeURIComponent(pinToSend)}` : ""}`;
      const res = await fetch(url);

      if (res.status === 403) {
        const errJson = await res.json();
        setRequiresPin(true);
        if (pinToSend) setPinError(errJson.error || "رمز PIN غير صحيح");
        return;
      }

      if (!res.ok) {
        setPinError("تعذر العثور على المضيافة أو تم إيقاف الرابط");
        return;
      }

      const resData = await res.json();
      setRequiresPin(false);
      setData(resData);
    } catch (e: any) {
      setPinError("خطأ في الاتصال: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    fetchData(pinInput.trim());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-night-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <i className="fa-solid fa-circle-notch animate-spin text-3xl text-teal-400 mb-3"></i>
        <div className="text-xs text-slate-400 font-bold">جاري تحميل بيانات المضيافة...</div>
      </div>
    );
  }

  if (requiresPin) {
    return (
      <div className="min-h-screen bg-night-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-950 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto mb-3 text-xl">
            <i className="fa-solid fa-lock"></i>
          </div>
          <h2 className="font-black text-lg text-slate-100">صفحة محمية برمز مرور</h2>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            أدخل رمز الـ PIN الممنوح لك من إدارة المضيافة لعرض كشف الحساب
          </p>

          {pinError && (
            <div className="mb-3 p-2 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs font-bold">
              {pinError}
            </div>
          )}

          <form onSubmit={handlePinSubmit} className="space-y-3">
            <input
              type="password"
              maxLength={8}
              required
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="رمز PIN"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-center text-lg font-mono text-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-extrabold py-3 rounded-xl text-xs shadow-lg transition active:scale-95"
            >
              عرض الكشف
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-night-950 text-slate-100 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto mb-3 text-2xl">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h2 className="font-bold text-lg text-slate-100">الصفحة غير متاحة</h2>
        <p className="text-xs text-slate-400 mt-1">{pinError || "لم يتم العثور على المضيافة"}</p>
        <Link href="/" className="mt-4 text-xs font-bold text-teal-400 hover:underline">
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  const { workspace, members, columns, payments, totalExpenses } = data;
  const currency = workspace.currency || "ج.م";

  // Build payments map for fast lookup
  const paymentMap: Record<string, any> = {};
  payments.forEach((p) => {
    paymentMap[`${p.memberId}_${p.columnId}`] = p;
  });

  const totalCollectedAll = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const netTreasury = Math.max(0, totalCollectedAll - totalExpenses);

  const q = searchQuery.trim().toLowerCase();
  const filteredMembers = members.filter(
    (m) => !q || m.name.toLowerCase().includes(q) || (m.generalNote && m.generalNote.toLowerCase().includes(q))
  );

  return (
    <div className="min-h-screen bg-night-950 text-slate-100 flex flex-col selection:bg-teal-600 selection:text-white">
      {/* Public Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-950 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <img src="/favicon.svg" alt="المضيافة" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <h1 className="font-black text-sm sm:text-base text-slate-100 leading-tight">
                {workspace.title}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-teal-400 font-bold flex items-center gap-1">
                <i className="fa-solid fa-circle-check text-[9px]"></i>
                <span>كشف حساب شفاف ومعتمد للأعضاء</span>
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl transition"
          >
            دخول المشرفين
          </Link>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto px-4 py-4 flex-1 flex flex-col">
        {/* Treasury Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg">
            <span className="text-[10px] text-slate-400 font-bold block">إجمالي الأعضاء</span>
            <div className="text-lg font-black text-slate-100 mt-0.5">{members.length} عضو</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg">
            <span className="text-[10px] text-slate-400 font-bold block">إجمالي المحصل</span>
            <div className="text-lg font-black text-emerald-400 mt-0.5">
              {totalCollectedAll.toLocaleString()} {currency}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg">
            <span className="text-[10px] text-slate-400 font-bold block">المصروفات</span>
            <div className="text-lg font-black text-rose-400 mt-0.5">
              {totalExpenses.toLocaleString()} {currency}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg">
            <span className="text-[10px] text-slate-400 font-bold block">صافي الخزينة المتاح</span>
            <div className="text-lg font-black text-teal-300 mt-0.5">
              {netTreasury.toLocaleString()} {currency}
            </div>
          </div>
        </div>

        {/* Search Bar for Member lookup */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-md mb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسمك في كشف الأعضاء..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-8 pl-3.5 py-2 text-xs font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Read-Only Matrix Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex-1 flex flex-col relative">
          <div className="table-scroll-container flex-1" style={{ maxHeight: "calc(100vh - 280px)" }}>
            <table className="border-collapse text-right w-full" style={{ minWidth: "max-content" }}>
              <thead>
                <tr>
                  <th className="sticky-col-right py-2.5 px-3 min-w-[140px] max-w-[160px] sm:min-w-[200px]">
                    <span className="font-extrabold text-slate-200 text-xs sm:text-sm">م • اسم العضو</span>
                  </th>
                  {columns.map((c) => (
                    <th key={c.id} className="py-2.5 px-3 min-w-[110px] border-l border-slate-800 text-center">
                      <div className="font-black text-slate-100 text-xs">{c.title}</div>
                      <span className="text-[10px] text-emerald-400 font-bold mt-0.5 inline-block">
                        {c.amount} {currency}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/70 text-xs sm:text-sm">
                {filteredMembers.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-slate-850/60 transition">
                    <td className="sticky-col-right py-2.5 px-3 min-w-[140px] max-w-[160px] sm:min-w-[200px] align-middle">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1 truncate font-bold text-slate-200">
                          {m.name}
                        </div>
                      </div>
                    </td>

                    {columns.map((c) => {
                      const rec = paymentMap[`${m.id}_${c.id}`];
                      let badge = (
                        <span className="text-[10px] px-2 py-1 rounded-lg bg-rose-950 text-rose-300 font-bold border border-rose-800/60">
                          لم يسدد
                        </span>
                      );

                      if (rec?.status === "paid") {
                        badge = (
                          <span className="text-[10px] px-2 py-1 rounded-lg bg-emerald-950 text-emerald-300 font-black border border-emerald-800/60 flex items-center justify-center gap-1">
                            <i className="fa-solid fa-check text-[10px]"></i>
                            <span>تم السداد</span>
                          </span>
                        );
                      } else if (rec?.status === "partial") {
                        badge = (
                          <span className="text-[10px] px-2 py-1 rounded-lg bg-amber-950 text-amber-300 font-bold border border-amber-800/60">
                            جزء: {rec.paidAmount} {currency}
                          </span>
                        );
                      } else if (rec?.status === "exempt") {
                        badge = (
                          <span className="text-[10px] px-2 py-1 rounded-lg bg-purple-950 text-purple-300 font-bold border border-purple-800/60">
                            معفي
                          </span>
                        );
                      }

                      return (
                        <td key={c.id} className="py-2.5 px-2 border-l border-slate-800 text-center align-middle">
                          {badge}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
