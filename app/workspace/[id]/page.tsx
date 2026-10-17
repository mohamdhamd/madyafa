"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SummaryStatsBar from "@/components/stats/SummaryStatsBar";
import MadyafaTable from "@/components/table/MadyafaTable";
import MemberModal from "@/components/modals/MemberModal";
import ColumnModal from "@/components/modals/ColumnModal";
import CellDetailModal from "@/components/modals/CellDetailModal";
import BulkJsonModal from "@/components/modals/BulkJsonModal";
import WhatsAppModal from "@/components/modals/WhatsAppModal";
import WorkspaceSettingsModal from "@/components/modals/WorkspaceSettingsModal";
import ExpenseModal from "@/components/modals/ExpenseModal";
import ArchivedColumnsModal from "@/components/modals/ArchivedColumnsModal";
import { localDb, LocalColumn, LocalMember, LocalPayment, LocalExpense, LocalWorkspace } from "@/lib/db/localDb";
import { syncEngine } from "@/lib/sync/syncEngine";

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;

  const [workspace, setWorkspace] = useState<LocalWorkspace | null>(null);
  const [allWorkspaces, setAllWorkspaces] = useState<Array<{ id: string; title: string }>>([]);
  const [members, setMembers] = useState<LocalMember[]>([]);
  const [columns, setColumns] = useState<LocalColumn[]>([]);
  const [payments, setPayments] = useState<Record<string, LocalPayment>>({});
  const [expenses, setExpenses] = useState<LocalExpense[]>([]);
  const [activeSummaryColId, setActiveSummaryColId] = useState<string>("");
  const [newlyCreatedColId, setNewlyCreatedColId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<LocalMember | null>(null);

  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<LocalColumn | null>(null);

  const [isCellModalOpen, setIsCellModalOpen] = useState(false);
  const [cellTarget, setCellTarget] = useState<{ memberId: string; colId: string } | null>(null);

  const [isBulkJsonOpen, setIsBulkJsonOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);
  const [showArchivedInTable, setShowArchivedInTable] = useState(false);
  const [autoArchiveCompleted, setAutoArchiveCompleted] = useState<boolean>(false);

  // Load auto archive preference from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`madyafa_auto_archive_${workspaceId}`);
      if (saved !== null) {
        setAutoArchiveCompleted(saved === "true");
      }
    }
  }, [workspaceId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initial Load: Dexie Cache First (Instant 0ms start!) then fetch cloud
  const loadFromLocalDb = useCallback(async () => {
    try {
      const localWs = await localDb.workspaces.get(workspaceId);
      if (localWs) setWorkspace(localWs);

      const localMembers = await localDb.members.where("workspaceId").equals(workspaceId).sortBy("orderIndex");
      if (localMembers.length > 0) setMembers(localMembers.filter((m) => m.isActive !== false));

      const localCols = await localDb.columns.where("workspaceId").equals(workspaceId).sortBy("orderIndex");
      if (localCols.length > 0) {
        setColumns(localCols);
        if (!activeSummaryColId) setActiveSummaryColId(localCols[localCols.length - 1].id);
      }

      const localPayments = await localDb.payments.where("workspaceId").equals(workspaceId).toArray();
      const pMap: Record<string, LocalPayment> = {};
      localPayments.forEach((p) => {
        pMap[`${p.memberId}_${p.columnId}`] = p;
      });
      setPayments(pMap);

      const localExp = await localDb.expenses.where("workspaceId").equals(workspaceId).toArray();
      setExpenses(localExp);
    } catch (e) {
      console.error("Local Dexie Load Error:", e);
    }
  }, [workspaceId, activeSummaryColId]);

  // 2. Fetch fresh server data and update local Dexie
  const fetchFromServer = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      if (res.status === 401) {
        if (typeof navigator !== "undefined" && navigator.onLine) {
          localStorage.removeItem("madyafa_auth");
          router.push("/login");
          return;
        }
      }
      if (!res.ok) return;

      const data = await res.json();
      if (data.workspace) {
        setWorkspace(data.workspace);
        await localDb.workspaces.put(data.workspace);
      }
      if (data.members) {
        setMembers(data.members);
        await localDb.members.bulkPut(data.members);
      }
      if (data.columns && data.columns.length > 0) {
        setColumns(data.columns);
        await localDb.columns.bulkPut(data.columns);
        if (!activeSummaryColId && data.columns.length > 0) {
          setActiveSummaryColId(data.columns[data.columns.length - 1].id);
        }
      } else {
        const localCols = await localDb.columns.where("workspaceId").equals(workspaceId).toArray();
        if (localCols.length === 0) {
          const prefix = data.workspace?.settings?.defaultColPrefix || "دفعة";
          const defaultShare = data.workspace?.settings?.defaultAmount ?? 100;
          const initialCol: LocalColumn = {
            id: `col_${Date.now()}`,
            workspaceId,
            orderIndex: 0,
            title: `${prefix} 1`,
            amount: defaultShare,
          };
          setColumns([initialCol]);
          await syncEngine.optimisticUpsertColumn(initialCol);
        }
      }
      if (data.payments) {
        const pMap: Record<string, LocalPayment> = {};
        data.payments.forEach((p: LocalPayment) => {
          pMap[`${p.memberId}_${p.columnId}`] = p;
        });
        setPayments(pMap);
        await localDb.payments.bulkPut(data.payments);
      }
      if (data.expenses) {
        setExpenses(data.expenses);
        await localDb.expenses.bulkPut(data.expenses);
      }
    } catch (e) {
      console.log("Offline mode: using local cached data");
    }
  }, [workspaceId, router, activeSummaryColId]);

  // Fetch workspaces for switcher
  useEffect(() => {
    localDb.workspaces
      .toArray()
      .then((ws) => {
        if (ws && ws.length > 0) {
          setAllWorkspaces(ws.map((w) => ({ id: w.id, title: w.title })));
        }
      })
      .catch(() => {});

    fetch("/api/workspaces")
      .then((r) => r.json())
      .then((d) => {
        if (d.workspaces) setAllWorkspaces(d.workspaces);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadFromLocalDb().then(() => fetchFromServer());
  }, [workspaceId, loadFromLocalDb, fetchFromServer]);

  // Partition columns into active and archived
  const activeColumns = useMemo(() => columns.filter((c) => !c.isArchived), [columns]);
  const archivedColumns = useMemo(() => columns.filter((c) => c.isArchived), [columns]);
  const displayedColumns = useMemo(() => {
    if (showArchivedInTable) return columns;
    return activeColumns;
  }, [showArchivedInTable, columns, activeColumns]);

  const handleToggleAutoArchive = (enabled: boolean) => {
    setAutoArchiveCompleted(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem(`madyafa_auto_archive_${workspaceId}`, String(enabled));
    }
    showToast(enabled ? "تم تفعيل الأرشفة التلقائية عند الاكتمال ⚡" : "تم تعطيل الأرشفة التلقائية");
  };

  const handleToggleArchiveColumn = async (colId: string, isArchived: boolean) => {
    const col = columns.find((c) => c.id === colId);
    if (!col) return;

    const updatedCol: LocalColumn = {
      ...col,
      isArchived,
      archivedAt: isArchived ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };

    setColumns((prev) => prev.map((c) => (c.id === colId ? updatedCol : c)));
    await syncEngine.optimisticUpsertColumn(updatedCol);
    showToast(
      isArchived
        ? `تم نقل عمود "${col.title}" إلى الأرشيف 📦`
        : `تمت استعادة عمود "${col.title}" إلى الجدول النشط 🔄`
    );
  };

  const checkAutoArchive = async (colId: string, currentPayments: Record<string, LocalPayment>) => {
    if (!autoArchiveCompleted) return;
    const col = columns.find((c) => c.id === colId);
    if (!col || col.isArchived) return;

    if (members.length === 0) return;
    const isCompleted = members.every((m) => {
      const p = currentPayments[`${m.id}_${colId}`];
      return p?.status === "paid" || p?.status === "exempt";
    });

    if (isCompleted) {
      const updatedCol: LocalColumn = {
        ...col,
        isArchived: true,
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setColumns((prev) => prev.map((c) => (c.id === colId ? updatedCol : c)));
      await syncEngine.optimisticUpsertColumn(updatedCol);
      showToast(`تمت أرشفة عمود "${col.title}" تلقائياً لاكتمال تحصيله بنسبة 100% 📦`);
    }
  };

  // Auto-column expansion helper respecting workspace.settings.autoColumnMode
  const checkAutoColumnExpansion = async (
    colId: string,
    currentPayments: Record<string, LocalPayment>,
    isPaid: boolean
  ) => {
    if (!isPaid) return;
    const mode = workspace?.settings?.autoColumnMode || "on_complete";
    if (mode === "manual") return;

    const lastActive = activeColumns.length > 0 ? activeColumns[activeColumns.length - 1] : null;
    const isLastCol = lastActive && lastActive.id === colId;
    if (!isLastCol) return;

    if (mode === "on_complete") {
      if (members.length === 0) return;
      const isCompleted = members.every((m) => {
        const p = currentPayments[`${m.id}_${colId}`];
        return p?.status === "paid" || p?.status === "exempt";
      });
      if (!isCompleted) return;
    }

    const prefix = workspace?.settings?.defaultColPrefix || "دفعة";
    const nextNum = columns.length + 1;
    const defaultShare = workspace?.settings?.defaultAmount ?? 100;
    const newColId = `col_${Date.now()}`;

    const newColumn: LocalColumn = {
      id: newColId,
      workspaceId,
      orderIndex: columns.length,
      title: `${prefix} ${nextNum}`,
      amount: defaultShare,
    };

    setColumns((prev) => [...prev, newColumn]);
    await syncEngine.optimisticUpsertColumn(newColumn);

    if (mode === "on_complete") {
      setActiveSummaryColId(newColId);
      setNewlyCreatedColId(newColId);
      showToast(`اكتمل تحصيل "${lastActive.title}"! تم إنشاء "${prefix} ${nextNum}" تلقائياً ⚡`);
    } else {
      // on_first_check: created in background without moving focus or scrolling away
      showToast(`تم تجهيز عمود "${prefix} ${nextNum}" تلقائياً ✨`);
    }
  };

  const handleCycleAutoMode = async () => {
    const currentMode = workspace?.settings?.autoColumnMode || "on_complete";
    let nextMode: "on_complete" | "on_first_check" | "manual" = "on_complete";
    let message = "";

    if (currentMode === "on_complete") {
      nextMode = "on_first_check";
      message = "نمط التوليد: تلقائي فور تسجيل أول دفعة بالعمود ✨";
    } else if (currentMode === "on_first_check") {
      nextMode = "manual";
      message = "نمط التوليد: يدوي فقط (إيقاف التوليد التلقائي) ✋";
    } else {
      nextMode = "on_complete";
      message = "نمط التوليد: تلقائي عند اكتمال سداد جميع الأعضاء (موصى به) ⚡";
    }

    if (!workspace) return;
    const updatedWs: LocalWorkspace = {
      ...workspace,
      settings: {
        ...workspace.settings,
        autoColumnMode: nextMode,
      },
    };

    setWorkspace(updatedWs);
    await localDb.workspaces.put(updatedWs);
    await syncEngine.queueOperation("update", "workspace", workspaceId, workspaceId, updatedWs);
    showToast(message);
  };

  // Handle Cell Toggle (Click Checkbox)
  const handleToggleCell = async (memberId: string, colId: string) => {
    const key = `${memberId}_${colId}`;
    const current = payments[key];
    const isCurrentlyPaid = current?.status === "paid";
    const nextStatus: "paid" | "unpaid" = isCurrentlyPaid ? "unpaid" : "paid";

    const col = columns.find((c) => c.id === colId);
    const amount = nextStatus === "paid" ? col?.amount || workspace?.settings.defaultAmount || 100 : 0;

    const updatedPayment: LocalPayment = {
      id: key,
      workspaceId,
      memberId,
      columnId: colId,
      status: nextStatus,
      paidAmount: amount,
      note: current?.note || "",
      updatedAt: new Date().toISOString(),
    };

    // Optimistic UI state update
    const updatedMap = { ...payments, [key]: updatedPayment };
    setPayments(updatedMap);
    await syncEngine.optimisticUpsertPayment(updatedPayment);

    // Check auto archive if paid
    if (nextStatus === "paid") {
      await checkAutoArchive(colId, updatedMap);
    }

    // Check auto column expansion if paid
    if (nextStatus === "paid") {
      await checkAutoColumnExpansion(colId, updatedMap, true);
    }
  };

  // Member Modal Save / Delete / Reorder
  const handleSaveMember = async (mData: { id?: string; name: string; phone?: string; generalNote?: string }) => {
    const isEdit = !!mData.id;
    const memberId = mData.id || `mem_${Date.now()}`;
    const newMember: LocalMember = {
      id: memberId,
      workspaceId,
      name: mData.name,
      phone: mData.phone || "",
      generalNote: mData.generalNote || "",
      orderIndex: isEdit ? members.find((m) => m.id === memberId)?.orderIndex || 0 : members.length,
      isActive: true,
      updatedAt: new Date().toISOString(),
    };

    setMembers((prev) => {
      if (isEdit) return prev.map((m) => (m.id === memberId ? newMember : m));
      return [...prev, newMember];
    });

    await syncEngine.optimisticUpsertMember(newMember);
    showToast(isEdit ? "تم تحديث بيانات العضو" : "تمت إضافة العضو بنجاح");
  };

  const handleDeleteMember = async (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    await syncEngine.optimisticDeleteMember(id, workspaceId);
    showToast("تم حذف العضو");
  };

  const handleMoveMemberOrder = async (id: string, delta: number) => {
    const idx = members.findIndex((m) => m.id === id);
    if (idx === -1) return;
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= members.length) return;

    const updated = [...members];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;

    // Update order indexes
    updated.forEach((m, i) => {
      m.orderIndex = i;
    });

    setMembers(updated);
    for (const m of updated) {
      await syncEngine.optimisticUpsertMember(m);
    }
  };

  // Column Modal Save / Delete / MarkAllPaid
  const handleSaveColumn = async (cData: { id?: string; title: string; amount: number }) => {
    const isEdit = !!cData.id;
    const colId = cData.id || `col_${Date.now()}`;
    const newCol: LocalColumn = {
      id: colId,
      workspaceId,
      title: cData.title,
      amount: cData.amount,
      orderIndex: isEdit ? columns.find((c) => c.id === colId)?.orderIndex || 0 : columns.length,
      updatedAt: new Date().toISOString(),
    };

    setColumns((prev) => {
      if (isEdit) return prev.map((c) => (c.id === colId ? newCol : c));
      return [...prev, newCol];
    });

    await syncEngine.optimisticUpsertColumn(newCol);
    showToast(isEdit ? "تم تحديث العمود" : "تمت إضافة العمود بنجاح");
  };

  const handleDeleteColumn = async (id: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== id));
    await syncEngine.optimisticDeleteColumn(id, workspaceId);
    showToast("تم حذف العمود");
  };

  const handleMarkAllPaid = async (colId: string) => {
    const col = columns.find((c) => c.id === colId);
    const amount = col?.amount || 100;
    const updatedMap = { ...payments };

    for (const m of members) {
      const key = `${m.id}_${colId}`;
      const updated: LocalPayment = {
        id: key,
        workspaceId,
        memberId: m.id,
        columnId: colId,
        status: "paid",
        paidAmount: amount,
        note: updatedMap[key]?.note || "",
        updatedAt: new Date().toISOString(),
      };
      updatedMap[key] = updated;
      await syncEngine.optimisticUpsertPayment(updated);
    }

    setPayments(updatedMap);
    showToast("تم تعليم جميع الأعضاء كـ دفعوا بالكامل ✅");
    await checkAutoArchive(colId, updatedMap);
    await checkAutoColumnExpansion(colId, updatedMap, true);
  };

  // Cell Detail Save
  const handleSaveCellDetail = async (pData: {
    status: "paid" | "partial" | "exempt" | "unpaid";
    paidAmount: number;
    note: string;
  }) => {
    if (!cellTarget) return;
    const key = `${cellTarget.memberId}_${cellTarget.colId}`;
    const updated: LocalPayment = {
      id: key,
      workspaceId,
      memberId: cellTarget.memberId,
      columnId: cellTarget.colId,
      status: pData.status,
      paidAmount: pData.paidAmount,
      note: pData.note,
      updatedAt: new Date().toISOString(),
    };

    const updatedMap = { ...payments, [key]: updated };
    setPayments(updatedMap);
    await syncEngine.optimisticUpsertPayment(updated);
    if (pData.status === "paid" || pData.status === "exempt") {
      await checkAutoArchive(cellTarget.colId, updatedMap);
    }
    showToast("تم حفظ تفاصيل الدفعة");
  };

  // Bulk JSON Import
  const handleBulkImport = async (imported: Array<{ name: string; phone?: string; generalNote?: string }>) => {
    const newMembersList: LocalMember[] = [];
    let startIdx = members.length;

    for (const item of imported) {
      const mId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const mem: LocalMember = {
        id: mId,
        workspaceId,
        name: item.name,
        phone: item.phone || "",
        generalNote: item.generalNote || "",
        orderIndex: startIdx++,
        isActive: true,
      };
      newMembersList.push(mem);
      await syncEngine.optimisticUpsertMember(mem);
    }

    setMembers((prev) => [...prev, ...newMembersList]);

    // If no columns exist yet, auto-create the initial first column
    if (columns.length === 0) {
      const prefix = workspace?.settings.defaultColPrefix || "دفعة";
      const defaultShare = workspace?.settings.defaultAmount ?? 100;
      const initialCol: LocalColumn = {
        id: `col_${Date.now()}`,
        workspaceId,
        orderIndex: 0,
        title: `${prefix} 1`,
        amount: defaultShare,
      };
      setColumns([initialCol]);
      await syncEngine.optimisticUpsertColumn(initialCol);
    }

    showToast(`تم استيراد ${newMembersList.length} عضو بنجاح ✨`);
  };

  // Workspace Settings Save
  const handleSaveSettings = async (updated: any) => {
    const newWs: LocalWorkspace = {
      ...workspace!,
      title: updated.title,
      description: updated.description,
      settings: updated.settings,
    };
    setWorkspace(newWs);
    await localDb.workspaces.put(newWs);
    await syncEngine.queueOperation("update", "workspace", workspaceId, workspaceId, newWs);
    showToast("تم تحديث إعدادات المضيافة");
  };

  // Expenses Save / Delete
  const handleAddExpense = async (exp: { title: string; amount: number; date: string; note: string }) => {
    const expId = `exp_${Date.now()}`;
    const newExp: LocalExpense = {
      id: expId,
      workspaceId,
      title: exp.title,
      amount: exp.amount,
      date: exp.date,
      note: exp.note,
    };
    setExpenses((prev) => [newExp, ...prev]);
    await syncEngine.optimisticUpsertExpense(newExp);
    showToast("تم تسجيل المصروف في الخزينة");
  };

  const handleDeleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    await syncEngine.optimisticDeleteExpense(id, workspaceId);
    showToast("تم حذف المصروف");
  };

  // Stats for the active column
  const summaryCols = displayedColumns.length > 0 ? displayedColumns : columns;
  const activeCol = summaryCols.find((c) => c.id === activeSummaryColId) || summaryCols[summaryCols.length - 1];
  const shareAmount = activeCol?.amount ?? workspace?.settings.defaultAmount ?? 100;
  let paidCount = 0;
  let collectedAmount = 0;

  if (activeCol) {
    members.forEach((m) => {
      const rec = payments[`${m.id}_${activeCol.id}`];
      if (rec?.status === "paid") {
        paidCount++;
        collectedAmount += shareAmount;
      } else if (rec?.status === "partial") {
        collectedAmount += rec.paidAmount || 0;
      }
    });
  }

  const totalExpected = members.length * shareAmount;
  const remainingAmount = Math.max(0, totalExpected - collectedAmount);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Target cell member & column for detail modal
  const targetMember = cellTarget ? members.find((m) => m.id === cellTarget.memberId) : null;
  const targetCol = cellTarget ? columns.find((c) => c.id === cellTarget.colId) : null;
  const targetPayment = cellTarget ? payments[`${cellTarget.memberId}_${cellTarget.colId}`] : null;

  return (
    <div className="min-h-screen bg-night-950 text-slate-100 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-teal-950 border border-teal-500/80 text-teal-200 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <i className="fa-solid fa-circle-check text-teal-400 text-sm"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        currentWorkspace={
          workspace
            ? {
                id: workspace.id,
                title: workspace.title,
                settings: workspace.settings,
              }
            : undefined
        }
        workspaces={allWorkspaces}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Summary Statistics Bar */}
      {columns.length > 0 && (
        <SummaryStatsBar
          columns={columns.map((c) => ({ id: c.id, title: c.title, amount: c.amount, isArchived: c.isArchived }))}
          activeColId={activeSummaryColId || (activeCol?.id ?? "")}
          onSelectColumn={(colId) => setActiveSummaryColId(colId)}
          stats={{
            paidCount,
            totalMembers: members.length,
            collectedAmount,
            remainingAmount,
            shareAmount,
          }}
          totalExpenses={totalExpenses}
          currency={workspace?.settings?.currency || "ج.م"}
          onOpenExpenses={() => setIsExpenseOpen(true)}
        />
      )}

      {/* Interactive Matrix Table */}
      <main className="flex-1 flex flex-col">
        <MadyafaTable
          columns={displayedColumns}
          members={members}
          payments={payments}
          defaultAmount={workspace?.settings.defaultAmount ?? 100}
          currency={workspace?.settings?.currency || "ج.م"}
          autoColumnMode={workspace?.settings?.autoColumnMode || "on_complete"}
          onCycleAutoMode={handleCycleAutoMode}
          onToggleCell={handleToggleCell}
          onOpenCellDetail={(memberId, colId) => {
            setCellTarget({ memberId, colId });
            setIsCellModalOpen(true);
          }}
          onOpenMemberModal={(mem) => {
            setEditingMember(mem || null);
            setIsMemberModalOpen(true);
          }}
          onOpenColumnModal={(col) => {
            setEditingColumn(col || null);
            setIsColumnModalOpen(true);
          }}
          onOpenBulkJsonModal={() => setIsBulkJsonOpen(true)}
          onOpenWhatsAppModal={() => setIsWhatsAppOpen(true)}
          onOpenExpensesModal={() => setIsExpenseOpen(true)}
          onOpenArchivedModal={() => setIsArchivedModalOpen(true)}
          archivedCount={archivedColumns.length}
          newlyCreatedColId={newlyCreatedColId}
        />
      </main>

      <Footer />

      {/* Modals */}
      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        editingMember={editingMember}
        onSave={handleSaveMember}
        onDelete={handleDeleteMember}
        onMoveOrder={handleMoveMemberOrder}
      />

      <ColumnModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        editingColumn={editingColumn}
        onSave={handleSaveColumn}
        onDelete={handleDeleteColumn}
        onMarkAllPaid={handleMarkAllPaid}
        onToggleArchive={handleToggleArchiveColumn}
        currency={workspace?.settings?.currency || "ج.م"}
      />

      <ArchivedColumnsModal
        isOpen={isArchivedModalOpen}
        onClose={() => setIsArchivedModalOpen(false)}
        archivedColumns={archivedColumns}
        members={members}
        payments={payments}
        currency={workspace?.settings?.currency || "ج.م"}
        onRestoreColumn={(colId) => handleToggleArchiveColumn(colId, false)}
        onOpenColumnModal={(col) => {
          setEditingColumn(col);
          setIsColumnModalOpen(true);
        }}
        onDeleteColumn={handleDeleteColumn}
        autoArchiveCompleted={autoArchiveCompleted}
        onToggleAutoArchive={handleToggleAutoArchive}
        showArchivedInTable={showArchivedInTable}
        onToggleShowArchivedInTable={setShowArchivedInTable}
      />

      <CellDetailModal
        isOpen={isCellModalOpen}
        onClose={() => setIsCellModalOpen(false)}
        memberName={targetMember?.name || ""}
        columnTitle={targetCol?.title || ""}
        columnAmount={targetCol?.amount ?? workspace?.settings.defaultAmount ?? 100}
        paymentRecord={targetPayment}
        onSave={handleSaveCellDetail}
        currency={workspace?.settings?.currency || "ج.م"}
      />

      <BulkJsonModal
        isOpen={isBulkJsonOpen}
        onClose={() => setIsBulkJsonOpen(false)}
        onImport={handleBulkImport}
      />

      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        workspaceTitle={workspace?.title || ""}
        columns={columns}
        members={members}
        payments={payments}
        totalExpenses={totalExpenses}
        currency={workspace?.settings?.currency || "ج.م"}
      />

      <WorkspaceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        workspace={workspace}
        onSave={handleSaveSettings}
      />

      <ExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        expenses={expenses}
        onAddExpense={handleAddExpense}
        onDeleteExpense={handleDeleteExpense}
        currency={workspace?.settings?.currency || "ج.م"}
      />
    </div>
  );
}
