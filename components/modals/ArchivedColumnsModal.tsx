"use client";

import React from "react";
import { LocalColumn, LocalMember, LocalPayment } from "@/lib/db/localDb";

interface ArchivedColumnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  archivedColumns: LocalColumn[];
  members: LocalMember[];
  payments: Record<string, LocalPayment>;
  currency?: string;
  onRestoreColumn: (columnId: string) => void;
  onOpenColumnModal: (column: LocalColumn) => void;
  onDeleteColumn: (columnId: string) => void;
  autoArchiveCompleted: boolean;
  onToggleAutoArchive: (enabled: boolean) => void;
  showArchivedInTable: boolean;
  onToggleShowArchivedInTable: (show: boolean) => void;
}

export default function ArchivedColumnsModal({
  isOpen,
  onClose,
  archivedColumns,
  members,
  payments,
  currency = "ج.م",
  onRestoreColumn,
  onOpenColumnModal,
  onDeleteColumn,
  autoArchiveCompleted,
  onToggleAutoArchive,
  showArchivedInTable,
  onToggleShowArchivedInTable,
}: ArchivedColumnsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden shrink-0"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-950/70 border border-amber-600/40 text-amber-400 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-box-archive text-sm"></i>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                <span>أرشيف أعمدة التحصيل</span>
                <span className="text-xs bg-amber-950 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full font-bold">
                  {archivedColumns.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                الأعمدة المنتهية والمؤرشفة، محفوظة بالكامل ويمكن استعادتها للجدول في أي وقت
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 flex items-center justify-center transition"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Smart Preferences Row */}
        <div className="my-3 p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Auto-archive Toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoArchiveCompleted}
                onChange={(e) => onToggleAutoArchive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-200">الأرشفة التلقائية عند الاكتمال</div>
              <div className="text-[10px] text-slate-400">أرشفة العمود فور دفع جميع الأعضاء بنسبة 100%</div>
            </div>
          </label>

          {/* Show in table toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer border-t sm:border-t-0 sm:border-r border-slate-800 pt-2 sm:pt-0 sm:pr-4">
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showArchivedInTable}
                onChange={(e) => onToggleShowArchivedInTable(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-200">إظهار المؤرشف في الجدول</div>
              <div className="text-[10px] text-slate-400">عرض الأعمدة المؤرشفة بجانب النشطة</div>
            </div>
          </label>
        </div>

        {/* List of Archived Columns */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {archivedColumns.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-amber-400/60 text-xl shadow-inner">
                <i className="fa-solid fa-box-open"></i>
              </div>
              <div>
                <p className="font-bold text-sm text-slate-300">لا توجد أعمدة مؤرشفة حالياً</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  يمكنك أرشفة أي عمود اكتمل تحصيله بالضغط على عنوان العمود واختيار "أرشفة العمود"، للحفاظ على جدولك خفيفاً ومنظماً.
                </p>
              </div>
            </div>
          ) : (
            archivedColumns.map((col) => {
              // Calculate stats for this archived column
              let paidCount = 0;
              let exemptCount = 0;
              let totalCollected = 0;

              members.forEach((m) => {
                const p = payments[`${m.id}_${col.id}`];
                if (p?.status === "paid") {
                  paidCount++;
                  totalCollected += p.paidAmount || col.amount;
                } else if (p?.status === "exempt") {
                  exemptCount++;
                } else if (p?.status === "partial") {
                  totalCollected += p.paidAmount || 0;
                }
              });

              const totalMembersCount = members.length;
              const expectedTotal = totalMembersCount * col.amount;
              const percent = expectedTotal > 0 ? Math.min(100, Math.round((totalCollected / expectedTotal) * 100)) : 100;
              const isFullyCollected = percent >= 100 || (paidCount + exemptCount >= totalMembersCount && totalMembersCount > 0);

              return (
                <div
                  key={col.id}
                  className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-sm text-slate-100">{col.title}</h4>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-slate-700">
                          {col.amount} {currency} / للفرد
                        </span>
                        {isFullyCollected ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800/80 flex items-center gap-1">
                            <i className="fa-solid fa-circle-check text-[9px]"></i>
                            <span>مكتمل 100%</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800/80">
                            مُحصّل {percent}%
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2.5 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                          <span>
                            المحصّل: <strong className="text-emerald-400">{totalCollected.toLocaleString()} {currency}</strong> من {expectedTotal.toLocaleString()} {currency}
                          </span>
                          <span>
                            الأعضاء: {paidCount} دفعوا {exemptCount > 0 ? `(${exemptCount} معفي)` : ""} من {totalMembersCount}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              percent >= 100 ? "bg-emerald-500" : "bg-gradient-to-r from-amber-500 to-teal-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>

                      {col.archivedAt && (
                        <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
                          <i className="fa-regular fa-clock text-[9px]"></i>
                          <span>تاريخ الأرشفة: {new Date(col.archivedAt).toLocaleDateString("ar-EG")}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onRestoreColumn(col.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-950 hover:bg-teal-900 border border-teal-800/80 text-teal-300 flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                        title="إعادة العمود إلى الجدول النشط"
                      >
                        <i className="fa-solid fa-rotate-left text-xs"></i>
                        <span>استعادة للجدول</span>
                      </button>

                      <button
                        onClick={() => onOpenColumnModal(col)}
                        className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition"
                        title="تعديل تفاصيل العمود"
                      >
                        <i className="fa-solid fa-pen text-xs"></i>
                        <span className="hidden sm:inline">تعديل</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف العمود "${col.title}" نهائياً مع كافة سجلات مدفوعاته؟`)) {
                            onDeleteColumn(col.id);
                          }
                        }}
                        className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 flex items-center gap-1 transition"
                        title="حذف العمود نهائياً"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0 mt-3">
          <span className="text-xs text-slate-400">
            إجمالي الأعمدة المؤرشفة: <strong className="text-amber-400">{archivedColumns.length}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
