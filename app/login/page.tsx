"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "فشل تسجيل الدخول");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      setErrorMsg("تعذر الاتصال بالسيرفر: " + (e.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-night-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative selection:bg-teal-600 selection:text-white">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-950/80 border border-teal-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-950/60">
            <img src="/favicon.svg" alt="المضيافة" className="w-10 h-10 object-contain drop-shadow" />
          </div>
          <h1 className="font-black text-xl sm:text-2xl text-slate-100 tracking-tight">
            دفتر المضيافة الذكي
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            تسجيل دخول المديرين والمشرفين
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-shake">
            <i className="fa-solid fa-triangle-exclamation text-rose-400 text-sm shrink-0"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              اسم المستخدم
            </label>
            <div className="relative">
              <i className="fa-solid fa-user absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="اسم المستخدم الخاص بك"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3.5 py-3 text-sm font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              كلمة المرور
            </label>
            <div className="relative">
              <i className="fa-solid fa-lock absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-10 py-3 text-sm font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-xs`}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-l from-teal-600 via-teal-500 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black py-3.5 rounded-xl shadow-lg shadow-teal-950/60 text-sm transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-circle-notch animate-spin text-sm"></i>
                <span>جاري تسجيل الدخول...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-right-to-bracket text-sm"></i>
                <span>دخول النظام</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-400">
            ليس لديك حساب بعد؟{" "}
            <Link
              href="/register"
              className="font-bold text-teal-400 hover:text-teal-300 underline underline-offset-4"
            >
              إنشاء حساب مدير جديد
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
