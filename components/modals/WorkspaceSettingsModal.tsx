"use client";

import React, { useState, useEffect } from "react";
import { LocalWorkspace } from "@/lib/db/localDb";

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: LocalWorkspace | null;
  onSave: (updated: {
    title: string;
    description: string;
    settings: {
      defaultAmount: number;
      defaultColPrefix: string;
      currency: string;
      publicSlug: string;
      publicPin?: string;
    };
  }) => void;
}

export default function WorkspaceSettingsModal({
  isOpen,
  onClose,
  workspace,
  onSave,
}: WorkspaceSettingsModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [defaultAmount, setDefaultAmount] = useState(100);
  const [defaultColPrefix, setDefaultColPrefix] = useState("دفعة");
  const [currency, setCurrency] = useState("ج.م");
  const [publicSlug, setPublicSlug] = useState("");
  const [publicPin, setPublicPin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (workspace) {
      setTitle(workspace.title || "");
      setDescription(workspace.description || "");
      setDefaultAmount(workspace.settings?.defaultAmount ?? 100);
      setDefaultColPrefix(workspace.settings?.defaultColPrefix || "دفعة");
      setCurrency(workspace.settings?.currency || "ج.م");
      setPublicSlug(workspace.settings?.publicSlug || "");
      setPublicPin(workspace.settings?.publicPin || "");
    }
  }, [workspace, isOpen]);

  if (!isOpen || !workspace) return null;

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/view/${publicSlug}`
    : `/view/${publicSlug}`;

  const handleCopyPublicLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !publicSlug.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      settings: {
        defaultAmount: Number(defaultAmount) || 0,
        defaultColPrefix: defaultColPrefix.trim() || "دفعة",
        currency: currency.trim() || "ج.م",
        publicSlug: publicSlug.trim().toLowerCase(),
        publicPin: publicPin.trim(),
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden"></div>

        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-gear text-teal-400"></i>
            <span>إعدادات المضيافة والاشتراك</span>
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
              اسم المضيافة أو الجمعية <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                قيمة الشهرية الافتراضية
              </label>
              <input
                type="number"
                min="0"
                value={defaultAmount}
                onChange={(e) => setDefaultAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                العملة
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              الاسم الافتراضي للأعمدة الجديدة
            </label>
            <input
              type="text"
              value={defaultColPrefix}
              onChange={(e) => setDefaultColPrefix(e.target.value)}
              placeholder="مثال: دفعة / شهر"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Public Transparency Link Section */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-bold text-teal-400 mb-1 flex items-center gap-1.5">
              <i className="fa-solid fa-eye text-xs"></i>
              <span>رابط المشاهدة العامة للأعضاء (بدون صلاحية تعديل)</span>
            </label>
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="text"
                readOnly
                value={publicUrl}
                dir="ltr"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyPublicLink}
                className="px-3 py-2 rounded-xl bg-teal-950 border border-teal-600 text-teal-300 text-xs font-bold hover:bg-teal-900 active:scale-95 transition"
              >
                {copied ? "تم النسخ" : "نسخ الرابط"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              رمز PIN اختياري لحماية صفحة المشاهدة
            </label>
            <input
              type="password"
              maxLength={8}
              value={publicPin}
              onChange={(e) => setPublicPin(e.target.value)}
              placeholder="اتركه فارغاً إذا كنت تريد الصفحة متاحة مباشرة لأي شخص يملك الرابط"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-3 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-teal-950 text-sm transition active:scale-95"
            >
              حفظ التعديلات
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
