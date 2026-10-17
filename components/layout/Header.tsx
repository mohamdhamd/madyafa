"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SyncBadge from "./SyncBadge";
import PwaInstallPrompt from "./PwaInstallPrompt";

interface HeaderProps {
  currentWorkspace?: {
    id: string;
    title: string;
    settings?: {
      defaultAmount?: number;
      currency?: string;
    };
  };
  workspaces?: Array<{
    id: string;
    title: string;
  }>;
  onOpenSettings?: () => void;
  userName?: string;
}

export default function Header({
  currentWorkspace,
  workspaces = [],
  onOpenSettings,
  userName,
}: HeaderProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!confirm("هل أنت متأكد من رغبتك في تسجيل الخروج؟")) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-gradient-to-l from-slate-950 via-night-900 to-night-850 border-b border-slate-800 text-slate-100 shadow-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Brand & Workspace Switcher */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Link
            href="/dashboard"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-950/70 border border-teal-500/30 flex items-center justify-center shrink-0 shadow-md shadow-teal-950/50 hover:border-teal-400 transition"
          >
            <img src="/favicon.svg" alt="المضيافة" className="w-6 h-6 object-contain drop-shadow" />
          </Link>

          <div className="min-w-0 flex-1">
            {currentWorkspace ? (
              <div className="relative inline-block max-w-full">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 text-right group max-w-full"
                >
                  <h1 className="font-extrabold text-sm sm:text-base text-slate-100 leading-tight truncate group-hover:text-teal-400 transition">
                    {currentWorkspace.title}
                  </h1>
                  <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 group-hover:text-teal-400 shrink-0"></i>
                </button>

                {/* Dropdown for Switching Workspaces */}
                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsDropdownOpen(false)}
                    ></div>
                    <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl py-2 z-40 text-xs">
                      <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-800">
                        الجمعيات والمضايف الخاصة بك:
                      </div>
                      <div className="max-h-60 overflow-y-auto py-1">
                        {workspaces.map((ws) => (
                          <Link
                            key={ws.id}
                            href={`/workspace/${ws.id}`}
                            onClick={() => setIsDropdownOpen(false)}
                            className={`px-3 py-2 flex items-center justify-between hover:bg-slate-800/80 transition ${
                              ws.id === currentWorkspace.id
                                ? "text-teal-400 font-bold bg-teal-950/40"
                                : "text-slate-300"
                            }`}
                          >
                            <span className="truncate">{ws.title}</span>
                            {ws.id === currentWorkspace.id && (
                              <i className="fa-solid fa-check text-xs text-teal-400"></i>
                            )}
                          </Link>
                        ))}
                      </div>
                      <div className="pt-1.5 border-t border-slate-800 px-2 flex flex-col gap-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setIsDropdownOpen(false)}
                          className="px-2.5 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 font-bold flex items-center gap-2"
                        >
                          <i className="fa-solid fa-layer-group text-slate-400"></i>
                          <span>لوحة تحكم الجمعيات</span>
                        </Link>
                        {onOpenSettings && (
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              onOpenSettings();
                            }}
                            className="px-2.5 py-1.5 rounded-xl hover:bg-slate-800 text-teal-300 font-bold flex items-center gap-2 text-right"
                          >
                            <i className="fa-solid fa-gear text-teal-400"></i>
                            <span>إعدادات هذه المضيافة</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <p className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-2 truncate mt-0.5">
                  <span>الشهرية: <strong className="text-emerald-400">{currentWorkspace.settings?.defaultAmount ?? 100}</strong> {currentWorkspace.settings?.currency ?? "ج.م"}</span>
                  {onOpenSettings && (
                    <button
                      onClick={onOpenSettings}
                      className="text-teal-400 hover:text-teal-300 text-[10px] underline underline-offset-2 flex items-center gap-1"
                    >
                      <i className="fa-solid fa-pen text-[9px]"></i>
                      <span>تخصيص</span>
                    </button>
                  )}
                </p>
              </div>
            ) : (
              <div>
                <Link href="/dashboard" className="font-extrabold text-sm sm:text-base text-slate-100 hover:text-teal-400 transition">
                  دفتر المضيافة الذكي
                </Link>
                <p className="text-[10px] sm:text-[11px] text-slate-400">
                  لوحة تحكم المضايف والجمعيات الخدمية
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions: Sync Badge, PWA Install, User Profile/Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <SyncBadge />
          <PwaInstallPrompt />

          {/* User Menu / Logout */}
          <div className="flex items-center gap-1 border-r border-slate-800 pr-2 mr-1">
            {userName && (
              <span className="hidden md:inline text-xs font-bold text-slate-300 truncate max-w-[120px]">
                {userName}
              </span>
            )}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 hover:bg-rose-950/60 hover:border-rose-700/60 text-slate-400 hover:text-rose-300 flex items-center justify-center transition active:scale-90"
              title="تسجيل الخروج"
            >
              <i className="fa-solid fa-arrow-right-from-bracket text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
