"use client";

import React, { useState, useEffect, useRef } from "react";
import { LocalColumn, LocalMember, LocalPayment } from "@/lib/db/localDb";

interface MadyafaTableProps {
  columns: LocalColumn[];
  members: LocalMember[];
  payments: Record<string, LocalPayment>;
  defaultAmount: number;
  currency?: string;
  onToggleCell: (memberId: string, colId: string) => void;
  onOpenCellDetail: (memberId: string, colId: string) => void;
  onOpenMemberModal: (member?: LocalMember) => void;
  onOpenColumnModal: (column?: LocalColumn) => void;
  onOpenBulkJsonModal: () => void;
  onOpenWhatsAppModal: () => void;
  onOpenExpensesModal: () => void;
  newlyCreatedColId?: string | null;
}

export default function MadyafaTable({
  columns,
  members,
  payments,
  defaultAmount,
  currency = "ج.م",
  onToggleCell,
  onOpenCellDetail,
  onOpenMemberModal,
  onOpenColumnModal,
  onOpenBulkJsonModal,
  onOpenWhatsAppModal,
  onOpenExpensesModal,
  newlyCreatedColId,
}: MadyafaTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "unpaid" | "paid">("all");
  const [activeFilterColId, setActiveFilterColId] = useState<string>("");

  useEffect(() => {
    if (columns.length > 0 && !activeFilterColId) {
      setActiveFilterColId(columns[columns.length - 1].id);
    }
  }, [columns, activeFilterColId]);

  // RTL Scroll Helper
  const getRtlScrollType = () => {
    if (typeof window === "undefined") return "negative";
    if ((window as any)._rtlScrollType) return (window as any)._rtlScrollType;
    try {
      const testDiv = document.createElement("div");
      testDiv.dir = "rtl";
      testDiv.innerHTML = '<div style="width: 200px; height: 1px;"></div>';
      testDiv.style.cssText = "position: absolute; top: -9999px; width: 100px; height: 1px; overflow: scroll; visibility: hidden;";
      document.body.appendChild(testDiv);
      let type = "negative";
      if (testDiv.scrollLeft > 0) {
        type = "positive";
      } else {
        testDiv.scrollLeft = 1;
        type = testDiv.scrollLeft === 0 ? "negative" : "reverse";
      }
      document.body.removeChild(testDiv);
      (window as any)._rtlScrollType = type;
      return type;
    } catch {
      return "negative";
    }
  };

  const scrollHorizontally = (direction: "left" | "right") => {
    const container = containerRef.current;
    if (!container) return;
    const type = getRtlScrollType();
    const step = 280;
    const delta = direction === "left" ? -step : step;
    if (type === "positive") {
      container.scrollBy({ left: -delta, behavior: "smooth" });
    } else {
      container.scrollBy({ left: delta, behavior: "smooth" });
    }
  };

  const scrollToEdge = (edge: "start" | "end") => {
    const container = containerRef.current;
    if (!container) return;
    const type = getRtlScrollType();
    if (edge === "start") {
      if (type === "positive") {
        container.scrollTo({ left: container.scrollWidth, behavior: "smooth" });
      } else {
        container.scrollTo({ left: 0, behavior: "smooth" });
      }
    } else {
      if (type === "positive") {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollTo({ left: -container.scrollWidth, behavior: "smooth" });
      }
    }
  };

  // Drag-to-Scroll & Touch Handlers
  useEffect(() => {
    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    if (!container) return;

    let isMouseDown = false;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialScrollLeft = 0;
    let initialScrollTop = 0;
    const dragThreshold = 6;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      startX = e.pageX;
      startY = e.pageY;
      initialScrollLeft = container.scrollLeft;
      initialScrollTop = container.scrollTop;
      isMouseDown = true;
      isDragging = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const dx = e.pageX - startX;
      const dy = e.pageY - startY;

      if (!isDragging && (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold)) {
        isDragging = true;
        container.classList.add("is-dragging");
        document.body.style.userSelect = "none";
      }

      if (isDragging) {
        e.preventDefault();
        const type = getRtlScrollType();
        if (type === "positive") {
          container.scrollLeft = initialScrollLeft - dx;
        } else {
          container.scrollLeft = initialScrollLeft + dx;
        }
        container.scrollTop = initialScrollTop - dy;
      }
    };

    const onMouseUp = () => {
      if (!isMouseDown) return;
      isMouseDown = false;
      if (isDragging) {
        const suppressClick = (ev: MouseEvent) => {
          ev.stopPropagation();
          ev.preventDefault();
          window.removeEventListener("click", suppressClick, true);
        };
        window.addEventListener("click", suppressClick, true);
        setTimeout(() => window.removeEventListener("click", suppressClick, true), 60);

        isDragging = false;
        container.classList.remove("is-dragging");
        document.body.style.userSelect = "";
      }
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Touch on sticky right column to pan table
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartScroll = 0;
    let touchIsHorizontal = false;
    let touchDecided = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartScroll = container.scrollLeft;
      touchIsHorizontal = false;
      touchDecided = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const target = e.target as HTMLElement;
      if (!target?.closest(".sticky-col-right")) return;

      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;

      if (!touchDecided && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        touchDecided = true;
        touchIsHorizontal = Math.abs(dx) > Math.abs(dy);
      }

      if (touchIsHorizontal) {
        const type = getRtlScrollType();
        if (type === "positive") {
          container.scrollLeft = touchStartScroll - dx;
        } else {
          container.scrollLeft = touchStartScroll + dx;
        }
      }
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: true });

    // Update left shadow indicator
    const updateShadows = () => {
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 8) {
        wrapper?.classList.remove("table-wrapper-left-shadow");
        return;
      }
      const type = getRtlScrollType();
      const atLeft = type === "positive" ? container.scrollLeft <= 8 : Math.abs(container.scrollLeft) >= maxScroll - 8;
      if (!atLeft) {
        wrapper?.classList.add("table-wrapper-left-shadow");
      } else {
        wrapper?.classList.remove("table-wrapper-left-shadow");
      }
    };

    container.addEventListener("scroll", updateShadows, { passive: true });
    window.addEventListener("resize", updateShadows, { passive: true });
    setTimeout(updateShadows, 100);

    return () => {
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("scroll", updateShadows);
      window.removeEventListener("resize", updateShadows);
    };
  }, []);

  // Reveal newly created column smoothly
  useEffect(() => {
    if (newlyCreatedColId) {
      setTimeout(() => {
        scrollToEdge("end");
      }, 150);
    }
  }, [newlyCreatedColId]);

  // Filter members
  const q = searchQuery.trim().toLowerCase();
  const filteredMembers = members.filter((member) => {
    const matchesSearch = !q || member.name.toLowerCase().includes(q) || (member.generalNote && member.generalNote.toLowerCase().includes(q));
    if (!matchesSearch) return false;

    if (filterType === "all" || !activeFilterColId) return true;
    const rec = payments[`${member.id}_${activeFilterColId}`];
    const isPaid = rec?.status === "paid" || rec?.status === "exempt";
    if (filterType === "paid") return isPaid;
    if (filterType === "unpaid") return !isPaid;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-3 sm:px-4 py-2.5">
      {/* Search & Actions Bar */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-2.5 shadow-lg mb-2 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم العضو أو الملاحظة..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-8 pl-7 py-2 text-xs font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <i className="fa-solid fa-circle-xmark text-sm"></i>
              </button>
            )}
          </div>

          <button
            onClick={() => onOpenMemberModal()}
            className="bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 active:scale-95 text-white font-extrabold text-xs px-3 py-2 rounded-xl shadow-md shadow-teal-950 flex items-center gap-1.5 shrink-0 transition"
          >
            <i className="fa-solid fa-user-plus text-xs"></i>
            <span>إضافة عضو</span>
          </button>

          <button
            onClick={onOpenBulkJsonModal}
            className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs px-2.5 py-2 rounded-xl border border-slate-700/80 shadow flex items-center gap-1.5 shrink-0 transition"
            title="إضافة أسماء دفعة واحدة بصيغة JSON"
          >
            <i className="fa-solid fa-code text-amber-400 text-xs"></i>
            <span className="hidden sm:inline">إضافة JSON</span>
            <span className="sm:hidden">JSON</span>
          </button>

          <button
            onClick={onOpenWhatsAppModal}
            className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 font-bold text-xs px-2.5 py-2 rounded-xl shadow flex items-center gap-1.5 shrink-0 transition active:scale-95"
            title="مشاركة تقرير واتساب"
          >
            <i className="fa-brands fa-whatsapp text-sm text-emerald-400"></i>
            <span className="hidden sm:inline">واتساب</span>
          </button>
        </div>

        {/* Filter Pills and Add Column */}
        <div className="flex items-center justify-between gap-1.5 pt-0.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setFilterType("all")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                filterType === "all" ? "bg-slate-700 text-white" : "bg-slate-950 text-slate-400 hover:bg-slate-800"
              }`}
            >
              الكل ({members.length})
            </button>
            <button
              onClick={() => setFilterType("unpaid")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                filterType === "unpaid" ? "bg-rose-950 text-rose-300 border border-rose-800" : "bg-slate-950 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>لم يدفعوا</span>
            </button>
            <button
              onClick={() => setFilterType("paid")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                filterType === "paid" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-slate-950 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>دفعوا</span>
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onOpenExpensesModal}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-950/70 text-rose-300 border border-rose-800/60 hover:bg-rose-900/60 flex items-center gap-1 transition"
            >
              <i className="fa-solid fa-receipt text-rose-400"></i>
              <span>المصروفات</span>
            </button>
            <button
              onClick={() => onOpenColumnModal()}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-teal-950/80 text-teal-300 border border-teal-800/60 hover:bg-teal-900/60 flex items-center gap-1 transition"
            >
              <i className="fa-solid fa-plus text-teal-400"></i>
              <span>عمود جديد</span>
            </button>
          </div>
        </div>
      </div>

      {/* Helper Banner for Auto-Expanding Columns & Navigation */}
      <div className="mb-2 px-3 py-1.5 bg-slate-900/80 border border-slate-800/80 rounded-xl flex items-center justify-between text-[11px] text-slate-300 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
          <i className="fa-solid fa-wand-magic-sparkles text-teal-400 shrink-0"></i>
          <span className="truncate">
            <strong className="text-teal-300">ميزة ذكية:</strong> عند التعليم في آخر عمود، يتم تلقائياً إنشاء عمود جديد!
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 mr-1.5">
          <button
            type="button"
            onClick={() => scrollToEdge("start")}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 shadow-sm flex items-center gap-1 active:scale-95 transition text-[11px] font-bold"
            title="الرجوع لأسماء الأعضاء"
          >
            <i className="fa-solid fa-angles-right text-[10px]"></i>
            <span className="hidden sm:inline">الأسماء</span>
          </button>
          <button
            type="button"
            onClick={() => scrollHorizontally("right")}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 shadow-sm flex items-center justify-center active:scale-90 transition font-bold"
            title="تمرير لليمين"
          >
            <i className="fa-solid fa-chevron-right text-xs"></i>
          </button>
          <button
            type="button"
            onClick={() => scrollHorizontally("left")}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 shadow-sm flex items-center justify-center active:scale-90 transition font-bold"
            title="تمرير لليسار"
          >
            <i className="fa-solid fa-chevron-left text-xs"></i>
          </button>
          <button
            type="button"
            onClick={() => scrollToEdge("end")}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 shadow-sm flex items-center gap-1 active:scale-95 transition text-[11px] font-bold"
            title="الذهاب لآخر دفعة"
          >
            <span className="hidden sm:inline">آخر عمود</span>
            <i className="fa-solid fa-angles-left text-[10px]"></i>
          </button>
        </div>
      </div>

      {/* Table Card Wrapper */}
      <div
        ref={wrapperRef}
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex-1 flex flex-col relative"
      >
        <div ref={containerRef} className="table-scroll-container flex-1" style={{ maxHeight: "calc(100vh - 280px)" }}>
          <table className="border-collapse text-right w-full" style={{ minWidth: "max-content", tableLayout: "auto" }}>
            {/* Table Header */}
            <thead>
              <tr>
                <th className="sticky-col-right py-2.5 px-2 sm:px-2.5 min-w-[130px] max-w-[145px] sm:min-w-[200px] sm:max-w-[230px]">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-100 text-xs sm:text-sm">م • اسم العضو</span>
                    <span className="text-[10px] bg-slate-800 text-teal-400 font-bold px-1.5 py-0.5 rounded-md border border-slate-700">
                      {members.length}
                    </span>
                  </div>
                </th>

                {columns.map((col, idx) => {
                  const isLast = idx === columns.length - 1;
                  const isFlash = col.id === newlyCreatedColId;
                  return (
                    <th
                      key={col.id}
                      className={`py-2.5 px-2 min-w-[110px] sm:min-w-[135px] border-l border-slate-800 text-center align-top ${
                        isFlash ? "new-col-flash" : ""
                      }`}
                    >
                      <div
                        onClick={() => onOpenColumnModal(col)}
                        className="cursor-pointer group rounded-xl p-1 hover:bg-slate-800/80 transition"
                      >
                        <div className="flex items-center justify-center gap-1 font-extrabold text-slate-100 text-xs leading-tight">
                          <span className="truncate max-w-[100px]">{col.title}</span>
                          <i className="fa-solid fa-pen text-[9px] text-slate-500 group-hover:text-teal-400 shrink-0"></i>
                        </div>
                        <div className="mt-1 flex items-center justify-center gap-1">
                          <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.5 rounded-md">
                            {col.amount} {currency}
                          </span>
                          {isLast && (
                            <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800/60 px-1.5 py-0.5 rounded-md font-bold">
                              تلقائي+
                            </span>
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}

                {/* Quick Add Column button header */}
                <th className="py-2.5 px-1.5 min-w-[55px] text-center align-middle bg-slate-900 border-l border-slate-800">
                  <button
                    onClick={() => onOpenColumnModal()}
                    className="w-8 h-8 rounded-xl bg-teal-950 hover:bg-teal-900 text-teal-300 border border-teal-800/80 flex items-center justify-center mx-auto shadow active:scale-90 transition"
                    title="إضافة عمود تحصيل جديد"
                  >
                    <i className="fa-solid fa-plus text-xs"></i>
                  </button>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/70 text-xs sm:text-sm">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="py-12 text-center text-slate-500">
                    <i className="fa-solid fa-users-slash text-2xl text-slate-600 block mb-2"></i>
                    لا توجد نتائج مطابقة لبحثك أو الفلتر المختار.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const realIndex = members.findIndex((m) => m.id === member.id) + 1;

                  return (
                    <tr key={member.id} className="hover:bg-slate-850/60 transition">
                      {/* Sticky Member Name & Index Cell */}
                      <td className="sticky-col-right py-2 px-2 sm:px-2.5 min-w-[130px] max-w-[145px] sm:min-w-[200px] sm:max-w-[230px] align-middle">
                        <div
                          onClick={() => onOpenMemberModal(member)}
                          className="cursor-pointer group flex items-start gap-1.5 sm:gap-2"
                        >
                          <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 font-bold text-[10px] sm:text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-slate-700">
                            {realIndex}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-200 text-xs sm:text-sm leading-snug group-hover:text-teal-400 truncate">
                              {member.name}
                            </div>
                            {member.generalNote ? (
                              <div className="text-[10px] text-amber-300 bg-amber-950/70 border border-amber-800/60 rounded px-1.5 py-0.5 mt-0.5 inline-flex items-center gap-1 max-w-full truncate">
                                <i className="fa-regular fa-note-sticky text-[9px]"></i>
                                <span className="truncate">{member.generalNote}</span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-500 mt-0.5 opacity-70 group-hover:opacity-100">
                                + إضافة ملاحظة
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Payment Cells */}
                      {columns.map((col) => {
                        const key = `${member.id}_${col.id}`;
                        const rec = payments[key] || { status: "unpaid", paidAmount: 0, note: "" };

                        let btnStyle = "bg-slate-950 border-slate-800 text-transparent hover:border-slate-700";
                        let iconHtml = <i className="fa-solid fa-check text-xs"></i>;

                        if (rec.status === "paid") {
                          btnStyle = "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950";
                          iconHtml = <i className="fa-solid fa-check text-sm font-black"></i>;
                        } else if (rec.status === "partial") {
                          btnStyle = "bg-amber-500 border-amber-400 text-slate-950 shadow-md shadow-amber-950";
                          iconHtml = <i className="fa-solid fa-hourglass-half text-xs"></i>;
                        } else if (rec.status === "exempt") {
                          btnStyle = "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-950";
                          iconHtml = <i className="fa-solid fa-shield-heart text-xs"></i>;
                        }

                        return (
                          <td key={col.id} className="py-2 px-1.5 border-l border-slate-800/70 text-center align-middle">
                            <div className="flex flex-col items-center justify-center gap-1">
                              <div className="flex items-center justify-center gap-1">
                                {/* Main Touch Checkbox */}
                                <button
                                  type="button"
                                  onClick={() => onToggleCell(member.id, col.id)}
                                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 flex items-center justify-center transition active:scale-90 ${btnStyle}`}
                                  aria-label="تغيير حالة الدفع"
                                >
                                  {iconHtml}
                                </button>

                                {/* Quick Details Button */}
                                <button
                                  type="button"
                                  onClick={() => onOpenCellDetail(member.id, col.id)}
                                  className="w-6 h-9 sm:w-7 sm:h-10 rounded-lg text-slate-500 hover:text-teal-400 hover:bg-slate-800 flex items-center justify-center transition"
                                  title="تفاصيل الدفعة أو ملاحظة"
                                >
                                  <i className="fa-solid fa-ellipsis-vertical text-xs"></i>
                                </button>
                              </div>

                              {/* Paid amount badge if partial or custom note */}
                              {rec.status === "partial" && (
                                <span
                                  onClick={() => onOpenCellDetail(member.id, col.id)}
                                  className="cursor-pointer text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 truncate max-w-[100px]"
                                >
                                  {rec.paidAmount} {currency}
                                </span>
                              )}

                              {rec.note && (
                                <span
                                  onClick={() => onOpenCellDetail(member.id, col.id)}
                                  className="cursor-pointer text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/60 truncate max-w-[105px]"
                                >
                                  {rec.note}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      <td className="bg-slate-950/40"></td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer: Column Totals */}
            <tfoot>
              <tr>
                <td className="sticky-col-right py-2 px-2 sm:px-2.5 min-w-[130px] max-w-[145px] sm:min-w-[200px] sm:max-w-[230px] font-black text-teal-300">
                  <div className="text-xs sm:text-sm">إجمالي التحصيل</div>
                  <div className="text-[9px] sm:text-[10px] font-normal text-slate-400">المحصل والمتبقي</div>
                </td>

                {columns.map((col) => {
                  let paidCount = 0;
                  let collectedAmount = 0;

                  members.forEach((m) => {
                    const rec = payments[`${m.id}_${col.id}`];
                    if (rec?.status === "paid") {
                      paidCount++;
                      collectedAmount += col.amount;
                    } else if (rec?.status === "partial") {
                      collectedAmount += rec.paidAmount || 0;
                    }
                  });

                  const totalExpected = members.length * col.amount;
                  const remaining = Math.max(0, totalExpected - collectedAmount);

                  return (
                    <td key={col.id} className="py-2 px-1.5 border-l border-slate-800 text-center align-middle">
                      <div className="text-xs font-black text-slate-100">
                        {paidCount} / {members.length} دفع
                      </div>
                      <div className="text-[11px] font-bold text-emerald-400 mt-0.5">
                        محصل: {collectedAmount.toLocaleString()} {currency}
                      </div>
                      <div className="text-[10px] text-amber-400">
                        متبقي: {remaining.toLocaleString()} {currency}
                      </div>
                    </td>
                  );
                })}

                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
