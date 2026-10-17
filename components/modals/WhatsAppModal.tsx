"use client";

import React, { useState } from "react";
import { LocalColumn, LocalMember, LocalPayment } from "@/lib/db/localDb";

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceTitle: string;
  columns: LocalColumn[];
  members: LocalMember[];
  payments: Record<string, LocalPayment>;
  totalExpenses: number;
  currency?: string;
}

export default function WhatsAppModal({
  isOpen,
  onClose,
  workspaceTitle,
  columns,
  members,
  payments,
  totalExpenses,
  currency = "ج.م",
}: WhatsAppModalProps) {
  const [selectedColId, setSelectedColId] = useState(columns[0]?.id || "");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const activeCol = columns.find((c) => c.id === selectedColId) || columns[0];
  const shareAmount = activeCol?.amount || 0;

  const paidMembers: Array<{ name: string; note: string; paidAmount: number }> = [];
  const unpaidMembers: Array<{ name: string; phone?: string }> = [];

  members.forEach((m) => {
    const key = `${m.id}_${activeCol?.id}`;
    const rec = payments[key];
    if (rec?.status === "paid") {
      paidMembers.push({ name: m.name, note: rec.note || "", paidAmount: shareAmount });
    } else if (rec?.status === "partial") {
      paidMembers.push({
        name: `${m.name} (جزء: ${rec.paidAmount} ${currency})`,
        note: rec.note || "",
        paidAmount: rec.paidAmount || 0,
      });
    } else if (rec?.status === "exempt") {
      paidMembers.push({ name: `${m.name} (معفي)`, note: rec.note || "", paidAmount: 0 });
    } else {
      unpaidMembers.push({ name: m.name, phone: m.phone });
    }
  });

  const totalCollected = paidMembers.reduce((sum, p) => sum + p.paidAmount, 0);
  const netTreasury = Math.max(0, totalCollected - totalExpenses);

  const reportText = `📊 *تقرير تحصيل: ${workspaceTitle}*
🏷️ *البند:* ${activeCol?.title || ""}
💰 *قيمة السهم:* ${shareAmount} ${currency}
──────────────
✅ *تم سداد:* ${paidMembers.length} من أصل ${members.length} عضو
💵 *إجمالي المحصل في هذا البند:* ${totalCollected.toLocaleString()} ${currency}
💸 *إجمالي المصروفات:* ${totalExpenses.toLocaleString()} ${currency}
💎 *صافي الخزينة المتاح:* ${netTreasury.toLocaleString()} ${currency}
──────────────
🟢 *سجل المشتركين المسددين (${paidMembers.length}):*
${paidMembers.map((m, i) => `${i + 1}. ${m.name}${m.note ? ` (${m.note})` : ""}`).join("\n")}

${
  unpaidMembers.length > 0
    ? `⏳ *المتبقي عليهم السداد (${unpaidMembers.length}):*\n` +
      unpaidMembers.map((m, i) => `${i + 1}. ${m.name}`).join("\n") +
      "\n\n_نسأل الله التوفيق والبركة للجميع وتقبل صالح الأعمال_ 🤲"
    : "🎉 *تم تحصيل هذا البند بالكامل من جميع الأعضاء بفضل الله!* 🌟"
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(reportText);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden"></div>

        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <i className="fa-brands fa-whatsapp text-emerald-400 text-lg"></i>
            <span>مشاركة تقرير واتساب</span>
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 flex items-center justify-center transition"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">اختر عمود التحصيل للتقرير:</label>
            <select
              value={selectedColId}
              onChange={(e) => setSelectedColId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.amount} {currency})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">معاينة نص الرسالة:</label>
            <textarea
              readOnly
              rows={9}
              value={reportText}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-sans text-slate-200 leading-relaxed focus:outline-none select-all"
            ></textarea>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={handleOpenWhatsApp}
              className="w-full sm:flex-1 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold py-3 rounded-xl shadow-lg shadow-emerald-950 text-sm flex items-center justify-center gap-2 transition active:scale-95"
            >
              <i className="fa-brands fa-whatsapp text-lg"></i>
              <span>فتح واتساب ومشاركة</span>
            </button>
            <button
              onClick={handleCopy}
              className={`w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                copied
                  ? "bg-emerald-900 border border-emerald-500 text-emerald-200"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              }`}
            >
              <i className={`fa-solid ${copied ? "fa-check" : "fa-copy"}`}></i>
              <span>{copied ? "تم النسخ!" : "نسخ النص"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
