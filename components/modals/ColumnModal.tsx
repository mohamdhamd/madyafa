"use client";

import React, { useState, useEffect } from "react";
import { LocalColumn } from "@/lib/db/localDb";

interface ColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (columnData: { id?: string; title: string; amount: number }) => void;
  onDelete?: (id: string) => void;
  onMarkAllPaid?: (id: string) => void;
  editingColumn?: LocalColumn | null;
  currency?: string;
}

export default function ColumnModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onMarkAllPaid,
  editingColumn,
  currency = "ج.م",
}: ColumnModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number>(100);

  useEffect(() => {
    if (editingColumn) {
      setTitle(editingColumn.title || "");
      setAmount(editingColumn.amount ?? 100);
    } else {
      setTitle("");
      setAmount(100);
    }
  }, [editingColumn, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: editingColumn?.id,
      title: title.trim(),
      amount: Number(amount) || 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden"></div>

        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-table-columns text-teal-400"></i>
            <span>{editingColumn ? "تخصيص عمود التحصيل" : "إضافة عمود تحصيل جديد"}</span>
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 flex items-center justify-center transition"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              اسم العمود / بند التحصيل <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: شهر نوفمبر / صيانة التكييف / فرش المضيافة"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              قيمة السهم / المبلغ المطلوب للفرد ({currency})
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="مثال: 100 (اتركه 0 إذا كان بنداً مفتوحاً بدون مبلغ ثابت)"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              يقوم النظام تلقائياً باحتساب الإجمالي المطلوب والمحصل بناءً على هذه القيمة.
            </p>
          </div>

          {editingColumn && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              {onMarkAllPaid && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`هل أنت متأكد من تعليم جميع الأعضاء كـ "دفعوا بالكامل" في عمود "${editingColumn.title}"؟`)) {
                      onMarkAllPaid(editingColumn.id);
                      onClose();
                    }
                  }}
                  className="bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
                >
                  <i className="fa-solid fa-check-double text-xs"></i>
                  <span>تعليم الكل دفع</span>
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`هل أنت متأكد من حذف عمود "${editingColumn.title}" وجميع سجلات مدفوعاته؟`)) {
                      onDelete(editingColumn.id);
                      onClose();
                    }
                  }}
                  className="bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition"
                >
                  <i className="fa-solid fa-trash-can text-xs"></i>
                  <span>حذف العمود</span>
                </button>
              )}
            </div>
          )}

          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-teal-950 text-sm transition active:scale-95"
            >
              حفظ العمود
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
