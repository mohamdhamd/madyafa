"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "@/components/layout/Footer";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceTitle, setWorkspaceTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          phone,
          password,
          initialWorkspaceTitle: workspaceTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "فشل إنشاء الحساب");
        return;
      }

      // Redirect to the newly created workspace or dashboard
      if (data.initialWorkspaceId) {
        router.push(`/workspace/${data.initialWorkspaceId}`);
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (e: any) {
      setErrorMsg("تعذر الاتصال بالسيرفر: " + (e.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-night-950 text-slate-100 flex flex-col justify-between items-center relative selection:bg-teal-600 selection:text-white">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-950/80 border border-teal-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-950/60">
            <img src="/favicon.svg" alt="المضيافة" className="w-10 h-10 object-contain drop-shadow" />
          </div>
          <h1 className="font-black text-xl sm:text-2xl text-slate-100 tracking-tight">
            إنشاء حساب مدير جديد
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            ابدأ بإدارة مضايفك وجمعياتك الخدمية بكفاءة واحترافية
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-rose-400 text-sm shrink-0"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              اسم المدير الثلاثي أو الرباعي <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: محمد السيد عبد الفتاح"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                اسم المستخدم <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="mohamed_2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                رقم الهاتف (اختياري)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              كلمة المرور <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              اسم أول مضيافة أو جمعية تنشئها
            </label>
            <input
              type="text"
              value={workspaceTitle}
              onChange={(e) => setWorkspaceTitle(e.target.value)}
              placeholder="مثال: مضيافة آل عبد الفتاح / صندوق الصيانة"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-l from-emerald-600 via-teal-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black py-3.5 rounded-xl shadow-lg shadow-teal-950/60 text-sm transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-circle-notch animate-spin text-sm"></i>
                <span>جاري إنشاء الحساب والمضيافة...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-user-check text-sm"></i>
                <span>تسجيل وبدء العمل فوراً</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-400">
            لديك حساب بالفعل؟{" "}
            <Link
              href="/login"
              className="font-bold text-teal-400 hover:text-teal-300 underline underline-offset-4"
            >
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>

    <div className="w-full relative z-10">
      <Footer />
    </div>
  </div>
);
}
