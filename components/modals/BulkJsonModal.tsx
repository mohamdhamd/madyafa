"use client";

import React, { useState } from "react";

interface BulkJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (members: Array<{ name: string; phone?: string; generalNote?: string }>) => void;
}

export default function BulkJsonModal({ isOpen, onClose, onImport }: BulkJsonModalProps) {
  const [jsonText, setJsonText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleFillExample = (type: "simple" | "objects") => {
    setErrorMsg("");
    if (type === "simple") {
      setJsonText(
        JSON.stringify(
          [
            "الحاج محمد عبد الرحمن",
            "الأستاذ أحمد فؤاد",
            "المهندس إبراهيم خليل",
            "الشيخ محمود عبد العال",
            "سيد عبد اللطيف",
          ],
          null,
          2
        )
      );
    } else {
      setJsonText(
        JSON.stringify(
          [
            { name: "الحاج محمد عبد الرحمن", note: "فودافون كاش", phone: "01012345678" },
            { name: "الأستاذ أحمد فؤاد", note: "إنستا باي", phone: "01123456789" },
            { name: "المهندس إبراهيم خليل", note: "أول كل شهر", phone: "01234567890" },
          ],
          null,
          2
        )
      );
    }
  };

  const handleProcessImport = () => {
    setErrorMsg("");
    if (!jsonText.trim()) {
      setErrorMsg("يرجى لصق كود الـ JSON أولاً");
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        setErrorMsg("يجب أن يكون كود JSON عبارة عن مصفوفة أسماء [...]");
        return;
      }

      const formatted: Array<{ name: string; phone?: string; generalNote?: string }> = [];

      for (const item of parsed) {
        if (typeof item === "string" && item.trim()) {
          formatted.push({ name: item.trim() });
        } else if (typeof item === "object" && item !== null && item.name) {
          formatted.push({
            name: String(item.name).trim(),
            phone: item.phone ? String(item.phone).trim() : "",
            generalNote: item.note || item.generalNote ? String(item.note || item.generalNote).trim() : "",
          });
        }
      }

      if (formatted.length === 0) {
        setErrorMsg("لم يتم العثور على أي أسماء صالحة داخل كود الـ JSON");
        return;
      }

      onImport(formatted);
      onClose();
    } catch (e: any) {
      setErrorMsg("كود الـ JSON غير صالح، تأكد من صحة الأقواس والفواصل: " + e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden"></div>

        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-code text-amber-400"></i>
            <span>إضافة أعضاء دفعة واحدة (JSON)</span>
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 flex items-center justify-center transition"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">أمثلة جاهزة للتجربة:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleFillExample("simple")}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700/60 active:scale-95 transition"
              >
                أسماء فقط [ ]
              </button>
              <button
                type="button"
                onClick={() => handleFillExample("objects")}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700/60 active:scale-95 transition"
              >
                أسماء وملاحظات [ { } ]
              </button>
            </div>
          </div>

          <textarea
            rows={8}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            dir="ltr"
            placeholder='[\n  "اسم 1",\n  "اسم 2"\n]'
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
          ></textarea>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation text-rose-400"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleProcessImport}
              className="flex-1 bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold py-3 rounded-xl shadow-lg shadow-amber-950 text-sm transition active:scale-95 flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-file-import"></i>
              <span>استيراد الأسماء فوراً</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
