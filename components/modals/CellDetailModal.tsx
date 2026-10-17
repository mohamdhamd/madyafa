"use client";

import React, { useState, useEffect } from "react";
import { LocalPayment } from "@/lib/db/localDb";

interface CellDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  columnTitle: string;
  columnAmount: number;
  paymentRecord?: LocalPayment | null;
  onSave: (paymentData: {
    status: "paid" | "partial" | "exempt" | "unpaid";
    paidAmount: number;
    note: string;
  }) => void;
  currency?: string;
}

const PRESET_NOTES = ["فودافون كاش", "إنستا باي", "كاش نقدي", "معفي صيانة", "دفع النصف", "محول بالبنك"];

export default function CellDetailModal({
  isOpen,
  onClose,
  memberName,
  columnTitle,
  columnAmount,
  paymentRecord,
  onSave,
  currency = "ج.م",
}: CellDetailModalProps) {
  const [status, setStatus] = useState<"paid" | "partial" | "exempt" | "unpaid">("paid");
  const [paidAmount, setPaidAmount] = useState<number>(columnAmount);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (paymentRecord) {
      setStatus(paymentRecord.status || "unpaid");
      setPaidAmount(paymentRecord.paidAmount ?? (paymentRecord.status === "paid" ? columnAmount : 0));
      setNote(paymentRecord.note || "");
    } else {
      setStatus("paid");
      setPaidAmount(columnAmount);
      setNote("");
    }
  }, [paymentRecord, columnAmount, isOpen]);

  if (!isOpen) return null;

  const handleSelectStatus = (newStatus: "paid" | "partial" | "exempt" | "unpaid") => {
    setStatus(newStatus);
    if (newStatus === "paid") {
      setPaidAmount(columnAmount);
    } else if (newStatus === "unpaid" || newStatus === "exempt") {
      setPaidAmount(0);
    } else if (newStatus === "partial" && paidAmount === 0) {
      setPaidAmount(Math.round(columnAmount / 2));
    }
  };

  const handlePresetNote = (preset: string) => {
    setNote((prev) => (prev ? `${prev} - ${preset}` : preset));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      status,
      paidAmount: Number(paidAmount) || 0,
      note: note.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden"></div>

        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <i className="fa-solid fa-receipt text-teal-400"></i>
              <span>تفاصيل الدفعة والملاحظات</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[260px]">
              {memberName} — <strong className="text-teal-400">{columnTitle}</strong> ({columnAmount} {currency})
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 flex items-center justify-center transition"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Status Selection Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">حالة الدفع:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSelectStatus("paid")}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                  status === "paid"
                    ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-950"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <i className="fa-solid fa-circle-check text-base text-emerald-300"></i>
                <span>دفع بالكامل</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectStatus("partial")}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                  status === "partial"
                    ? "bg-amber-500 border-amber-400 text-slate-950 shadow-lg shadow-amber-950"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <i className="fa-solid fa-clock-rotate-left text-base text-amber-300"></i>
                <span>دفع جزء</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectStatus("exempt")}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                  status === "exempt"
                    ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-950"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <i className="fa-solid fa-shield-heart text-base text-purple-300"></i>
                <span>معفي</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectStatus("unpaid")}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                  status === "unpaid"
                    ? "bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-950"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <i className="fa-solid fa-circle-xmark text-base text-rose-300"></i>
                <span>لم يدفع</span>
              </button>
            </div>
          </div>

          {/* Paid Amount Input (shown when partial) */}
          {status === "partial" && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                المبلغ المدفوع فعلياً ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-amber-500/60 rounded-xl px-3.5 py-2.5 text-sm font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          {/* Sub-note and Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              ملاحظة على الدفعة (اختياري)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثال: فودافون كاش / إنستا باي / إيصال 402"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESET_NOTES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetNote(preset)}
                  className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 active:scale-95 transition"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-teal-950 text-sm transition active:scale-95"
            >
              حفظ وتطبيق
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
