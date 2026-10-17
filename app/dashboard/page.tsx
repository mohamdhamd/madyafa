"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { localDb, LocalWorkspace } from "@/lib/db/localDb";
import { syncEngine } from "@/lib/sync/syncEngine";

interface WorkspaceItem {
  id: string;
  title: string;
  description: string;
  isOwner: boolean;
  memberCount: number;
  totalExpenses: number;
  settings: {
    defaultAmount: number;
    currency: string;
    publicSlug: string;
  };
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state for creating a new workspace
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAmount, setNewAmount] = useState(100);
  const [newPrefix, setNewPrefix] = useState("دفعة");
  const [createLoading, setCreateLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);

      // 1. Instant load from local Dexie (offline-first)
      try {
        const localWs = await localDb.workspaces.toArray();
        if (localWs && localWs.length > 0) {
          setWorkspaces(
            localWs.map((w: LocalWorkspace) => ({
              id: w.id,
              title: w.title,
              description: w.description || "",
              isOwner: true,
              memberCount: 0,
              totalExpenses: 0,
              settings: {
                defaultAmount: w.settings?.defaultAmount ?? 100,
                currency: w.settings?.currency || "EGP",
                publicSlug: w.settings?.publicSlug || "",
              },
              createdAt: w.createdAt || new Date().toISOString(),
            }))
          );
        }
      } catch (localErr) {
        console.warn("Local DB read warning:", localErr);
      }

      // 2. Fetch fresh data from server if online
      const res = await fetch("/api/workspaces");
      if (res.status === 401) {
        if (typeof navigator !== "undefined" && navigator.onLine) {
          localStorage.removeItem("madyafa_auth");
          router.push("/login");
          return;
        }
      }

      if (res.ok) {
        const data = await res.json();
        if (data.workspaces) {
          setWorkspaces(data.workspaces);
          // Persist workspaces to local Dexie for offline access
          try {
            await localDb.workspaces.bulkPut(
              data.workspaces.map((w: any) => ({
                id: w.id,
                title: w.title,
                description: w.description || "",
                ownerId: w.ownerId,
                settings: w.settings,
                createdAt: w.createdAt,
                updatedAt: w.updatedAt,
              }))
            );
          } catch (dbErr) {
            console.warn("Local DB persist warning:", dbErr);
          }
        }
      }
    } catch (e) {
      console.log("Offline mode: workspaces served from local storage");
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    // Load cached name instantly
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("madyafa_user_name");
      if (cached) setUserName(cached);
    }

    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user?.name) {
          setUserName(data.user.name);
          localStorage.setItem("madyafa_user_name", data.user.name);
          localStorage.setItem("madyafa_auth", "true");
        }
      }
    } catch (e) {
      console.log("Offline mode: User profile loaded from local cache");
    }
  };

  useEffect(() => {
    fetchUser();
    fetchWorkspaces();
  }, []);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreateLoading(true);
    setErrorMsg("");

    try {
      // If offline, create workspace locally in Dexie and queue sync
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const tempId = `ws_${Date.now()}`;
        const offlineWs: LocalWorkspace = {
          id: tempId,
          title: newTitle.trim(),
          description: newDescription.trim(),
          settings: {
            defaultAmount: Number(newAmount) || 100,
            defaultColPrefix: newPrefix.trim() || "دفعة",
            currency: "EGP",
            publicSlug: `offline-${Date.now()}`,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await localDb.workspaces.put(offlineWs);
        await syncEngine.queueOperation("create", "workspace", tempId, tempId, offlineWs);

        setIsCreateModalOpen(false);
        setNewTitle("");
        setNewDescription("");
        router.push(`/workspace/${tempId}`);
        return;
      }

      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          defaultAmount: Number(newAmount) || 100,
          defaultColPrefix: newPrefix.trim() || "دفعة",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "فشل إنشاء المضيافة");
        return;
      }

      // Save to local DB as well
      if (data.workspace) {
        await localDb.workspaces.put(data.workspace);
      }

      setIsCreateModalOpen(false);
      setNewTitle("");
      setNewDescription("");
      // Redirect directly to the newly created workspace
      router.push(`/workspace/${data.workspace.id}`);
    } catch (e: any) {
      setErrorMsg("حدث خطأ أثناء الإنشاء: " + e.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const totalMembersAll = workspaces.reduce((sum, w) => sum + (w.memberCount || 0), 0);
  const totalExpensesAll = workspaces.reduce((sum, w) => sum + (w.totalExpenses || 0), 0);

  return (
    <div className="min-h-screen bg-night-950 text-slate-100 flex flex-col">
      <Header userName={userName} />

      <main className="max-w-7xl w-full mx-auto px-4 py-6 flex-1">
        {/* Welcome & Global Overview Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              <span>أهلاً بك</span>
              {userName && <span className="text-teal-400">{userName}</span>}
              <span className="text-sm font-normal text-slate-400">👋</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              إدارة شاملة للمضايف وصناديق الخير ومتابعة التحصيل والمصروفات
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-l from-teal-600 via-teal-500 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-xl shadow-teal-950/60 flex items-center gap-2 active:scale-95 transition"
          >
            <i className="fa-solid fa-plus text-sm"></i>
            <span>إنشاء مضيافة / جمعية جديدة</span>
          </button>
        </div>

        {/* Global Summary Metric Cards - Ultra Compact 3-in-1 Row on Mobile */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 my-4 sm:my-6">
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-2.5 sm:p-4 shadow-lg flex flex-col items-center text-center justify-center sm:flex-row sm:justify-between sm:text-right">
            <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-xl bg-teal-950/70 border border-teal-500/30 flex items-center justify-center text-teal-400 text-xs sm:text-base mb-1.5 sm:mb-0 sm:order-2 shrink-0">
              <i className="fa-solid fa-building-columns"></i>
            </div>
            <div className="min-w-0 sm:order-1">
              <div className="text-sm sm:text-2xl font-black text-slate-100 truncate">{workspaces.length}</div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 truncate mt-0.5">المضايف</div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-2.5 sm:p-4 shadow-lg flex flex-col items-center text-center justify-center sm:flex-row sm:justify-between sm:text-right">
            <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-xl bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs sm:text-base mb-1.5 sm:mb-0 sm:order-2 shrink-0">
              <i className="fa-solid fa-users"></i>
            </div>
            <div className="min-w-0 sm:order-1">
              <div className="text-sm sm:text-2xl font-black text-emerald-400 truncate">{totalMembersAll}</div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 truncate mt-0.5">الأعضاء</div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-2.5 sm:p-4 shadow-lg flex flex-col items-center text-center justify-center sm:flex-row sm:justify-between sm:text-right">
            <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-xl bg-rose-950/70 border border-rose-500/30 flex items-center justify-center text-rose-400 text-xs sm:text-base mb-1.5 sm:mb-0 sm:order-2 shrink-0">
              <i className="fa-solid fa-receipt"></i>
            </div>
            <div className="min-w-0 sm:order-1">
              <div className="text-sm sm:text-2xl font-black text-rose-400 truncate">
                {totalExpensesAll > 9999 ? `${(totalExpensesAll / 1000).toFixed(1)}k` : totalExpensesAll.toLocaleString()}
                <span className="text-[9px] sm:text-xs font-normal text-slate-400 mr-0.5">ج.م</span>
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 truncate mt-0.5">المصروفات</div>
            </div>
          </div>
        </div>

        {/* Workspaces List / Grid */}
        <div className="mt-6 sm:mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
            <div className="flex flex-col items-start text-right">
              <h3 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
                <i className="fa-solid fa-layer-group text-teal-400"></i>
                <span>قائمة المضايف المسجلة</span>
              </h3>
              <span className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                اختر المضيافة لفتح جدول التحصيل والمتابعة
              </span>
            </div>
            {workspaces.length > 0 && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="self-start sm:self-auto bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-teal-300 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition active:scale-95"
              >
                <i className="fa-solid fa-plus text-xs"></i>
                <span>مضيافة جديدة</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <i className="fa-solid fa-circle-notch animate-spin text-2xl text-teal-400 mb-3"></i>
              <div className="text-xs text-slate-400">جاري تحميل الجمعيات...</div>
            </div>
          ) : workspaces.length === 0 ? (
            <div className="py-16 px-4 text-center bg-slate-900/60 border border-slate-800 rounded-3xl">
              <div className="w-16 h-16 rounded-2xl bg-teal-950/70 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg">
                <i className="fa-solid fa-folder-open"></i>
              </div>
              <h4 className="font-bold text-base text-slate-200">لا توجد مضايف بعد</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                ابدأ بإنشاء أول مضيافة أو جمعية لإضافة الأعضاء ومتابعة التحصيل السحابي والمحلي.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-lg active:scale-95"
              >
                + إنشاء مضيافة الآن
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-teal-950/20 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-2xl bg-teal-950/80 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold shrink-0">
                        <i className="fa-solid fa-mosque text-sm"></i>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        {ws.isOwner ? "المالك" : "مشرف"}
                      </span>
                    </div>

                    <h4 className="font-black text-base text-slate-100 group-hover:text-teal-400 transition truncate">
                      {ws.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 min-h-[32px]">
                      {ws.description || "متابعة اشتراكات الأعضاء والتحصيل الشهري والصندوق الخيري."}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">الأعضاء:</span>
                        <strong className="text-emerald-400 font-bold">{ws.memberCount} عضو</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">الشهرية:</span>
                        <strong className="text-teal-300 font-bold">
                          {ws.settings.defaultAmount} {ws.settings.currency}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <Link
                      href={`/workspace/${ws.id}`}
                      className="flex-1 bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95"
                    >
                      <i className="fa-solid fa-table-cells text-xs"></i>
                      <span>فتح دفتر التحصيل</span>
                    </Link>

                    <Link
                      href={`/view/${ws.settings.publicSlug}`}
                      target="_blank"
                      className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition border border-slate-700/80 active:scale-95"
                      title="عرض صفحة المشاهدة العامة للأعضاء"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Create Workspace Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden"></div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <i className="fa-solid fa-plus text-teal-400"></i>
                <span>إنشاء مضيافة / جمعية جديدة</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 flex items-center justify-center transition"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateWorkspace} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  اسم المضيافة أو الجمعية <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: مضيافة الحاج محمد / صندوق صيانة المسجد"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  وصف مختصر (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="وصف الهدف من المضيافة وتفاصيل المشتركين..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الشهرية الافتراضية
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    مسمى الأعمدة
                  </label>
                  <input
                    type="text"
                    value={newPrefix}
                    onChange={(e) => setNewPrefix(e.target.value)}
                    placeholder="دفعة / شهر"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg text-sm transition active:scale-95 disabled:opacity-60"
                >
                  {createLoading ? "جاري الإنشاء..." : "إنشاء المضيافة وبدء العمل"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
