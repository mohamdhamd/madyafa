"use client";

import React, { useState } from "react";
import { LocalExpense } from "@/lib/db/localDb";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: LocalExpense[];
  onAddExpense: (expense: { title: string; amount: number; date: string; note: string }) => void;
  onDeleteExpense: (id: string) => void;
  currency?: string;
}

export default function ExpenseModal({
  isOpen,
  onClose,
  expenses,
  onAddExpense,
  onDeleteExpense,
  currency = "ج.م",
}: ExpenseModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) return;

    onAddExpense({
      title: title.trim(),
      amount: Number(amount),
      date: date || new Date().toISOString(),
      note: note.trim(),
    });

    setTitle("");
    setAmount("");
    setNote("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden"></div>

        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <i className="fa-solid fa-receipt text-rose-400"></i>
              <span>سجل المصروفات والخزينة</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              إجمالي المصروفات المسجلة: <strong className="text-rose-400">{totalAmount.toLocaleString()} {currency}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 flex items-center justify-center transition"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Add Expense Form */}
        <form onSubmit={handleSubmit} className="mt-3.5 space-y-2.5 bg-slate-950/70 border border-slate-800 p-3 rounded-2xl shrink-0">
          <div className="font-bold text-xs text-slate-300 flex items-center gap-1.5">
            <i className="fa-solid fa-plus text-teal-400"></i>
            <span>تسجيل مصروف جديد</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="بند الصرف (مثال: كهرباء، نظافة)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <input
                type="number"
                required
                min="0.1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={`المبلغ (${currency})`}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-rose-400 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ملاحظات إضافية (اختياري)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-l from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold py-2 rounded-xl text-xs shadow-md transition active:scale-95"
          >
            + إضافة المصروف وخصمه من الخزينة
          </button>
        </form>

        {/* Expenses List */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1">
          <div className="text-xs font-bold text-slate-400">سجل المصروفات السابقة:</div>
          {expenses.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <i className="fa-solid fa-receipt text-2xl text-slate-700 block mb-2"></i>
              لا توجد مصروفات مسجلة حتى الآن.
            </div>
          ) : (
            expenses.map((exp) => (
              <div
                key={exp.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-200 truncate">{exp.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>{new Date(exp.date).toLocaleDateString("ar-EG")}</span>
                    {exp.note && <span className="truncate">({exp.note})</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-black text-rose-400 text-sm">
                    -{Number(exp.amount).toLocaleString()} {currency}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`حذف المصروف "${exp.title}"؟`)) {
                        onDeleteExpense(exp.id);
                      }
                    }}
                    className="w-7 h-7 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-400 flex items-center justify-center active:scale-90 transition"
                    title="حذف"
                  >
                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-slate-800 mt-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
}
