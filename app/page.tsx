'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function RootHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      // If client is already offline, check cached authentication status
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const isAuth = localStorage.getItem('madyafa_auth') === 'true';
        router.replace(isAuth ? '/dashboard' : '/login');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            localStorage.setItem('madyafa_auth', 'true');
            if (data.user.name) {
              localStorage.setItem('madyafa_user_name', data.user.name);
            }
            router.replace('/dashboard');
            return;
          }
        }
        localStorage.removeItem('madyafa_auth');
        router.replace('/login');
      } catch (e) {
        console.warn('Auth check network warning (offline mode):', e);
        const isAuth = localStorage.getItem('madyafa_auth') === 'true';
        router.replace(isAuth ? '/dashboard' : '/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-2xl shadow-emerald-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-emerald-400" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">منصة مضيافة</h1>
          <p className="text-xs text-slate-400 mt-1">نظام إدارة المضايف والجمعيات الخدمية الذكي</p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-emerald-400 bg-slate-900/80 border border-slate-800/80 py-2.5 px-4 rounded-xl">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>جاري التحقق وتوجيهك...</span>
        </div>
      </div>
    </div>
  );
}
