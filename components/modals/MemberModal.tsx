"use client";

import React, { useState, useEffect } from "react";
import { LocalMember } from "@/lib/db/localDb";

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberData: { id?: string; name: string; phone?: string; generalNote?: string }) => void;
  onDelete?: (id: string) => void;
  onMoveOrder?: (id: string, delta: number) => void;
  editingMember?: LocalMember | null;
  existingMembers?: LocalMember[];
  preventDuplicate?: boolean;
}

export default function MemberModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onMoveOrder,
  editingMember,
  existingMembers = [],
  preventDuplicate = true,
}: MemberModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [generalNote, setGeneralNote] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setErrorMsg("");
    if (editingMember) {
      setName(editingMember.name || "");
      setPhone(editingMember.phone || "");
      setGeneralNote(editingMember.generalNote || "");
    } else {
      setName("");
      setPhone("");
      setGeneralNote("");
    }
  }, [editingMember, isOpen]);

  if (!isOpen) return null;

  const normalizeArabic = (s: string) =>
    s.trim().toLowerCase().replace(/[إأآا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const trimmed = name.trim();
    if (!trimmed) return;

    if (preventDuplicate && existingMembers.length > 0) {
      const norm = normalizeArabic(trimmed);
      const exists = existingMembers.some(
        (m) => m.id !== editingMember?.id && normalizeArabic(m.name) === norm
      );
      if (exists) {
        setErrorMsg(`عذراً، يوجد عضو آخر مسجل بنفس هذا الاسم بالفعل: "${trimmed}"`);
        return;
      }
    }

    onSave({
      id: editingMember?.id,
      name: trimmed,
      phone: phone.trim(),
      generalNote: generalNote.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden"></div>

        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-user-check text-teal-400"></i>
            <span>{editingMember ? "تعديل بيانات العضو" : "إضافة عضو جديد"}</span>
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 flex items-center justify-center transition"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-rose-400 text-sm shrink-0"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3.5 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              اسم العضو <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: الحاج محمد عبد الرحمن"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              رقم الهاتف (اختياري - لإيصالات واتساب)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="مثال: 01012345678"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              ملاحظة عامة ثابتة (اختياري)
            </label>
            <textarea
              rows={2}
              value={generalNote}
              onChange={(e) => setGeneralNote(e.target.value)}
              placeholder="مثال: يدفع أول الشهر / فودافون كاش / معفي من الصيانة..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            ></textarea>
          </div>

          {editingMember && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {onMoveOrder && (
                  <>
                    <button
                      type="button"
                      onClick={() => onMoveOrder(editingMember.id, -1)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"
                    >
                      <i className="fa-solid fa-arrow-up"></i>
                      <span>لأعلى</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveOrder(editingMember.id, 1)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"
                    >
                      <i className="fa-solid fa-arrow-down"></i>
                      <span>لأسفل</span>
                    </button>
                  </>
                )}
              </div>

              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`هل أنت متأكد من حذف العضو "${editingMember.name}"؟`)) {
                      onDelete(editingMember.id);
                      onClose();
                    }
                  }}
                  className="bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"
                >
                  <i className="fa-solid fa-trash-can"></i>
                  <span>حذف</span>
                </button>
              )}
            </div>
          )}

          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-teal-950 text-sm transition active:scale-95"
            >
              حفظ البيانات
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
