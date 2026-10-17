"use client";

import React from "react";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/90 py-3.5 px-4 text-center text-xs text-slate-400 select-none">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Blessings & Copyright */}
        <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 text-center sm:text-right">
          <span className="font-bold text-emerald-400 text-xs sm:text-sm tracking-wide flex items-center gap-1">
            <span>صلّ على النبي ﷺ</span>
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="text-slate-400 text-[11px] sm:text-xs">
            حقوق الطبع والنشر © {new Date().getFullYear()}{" "}
            <strong className="text-slate-200">محمد حمدي</strong>
          </span>
        </div>

        {/* Social Icons Bar */}
        <div className="flex items-center gap-2">
          <a
            href="https://www.facebook.com/m0hamedhamdy1/?locale=ar_AR"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 hover:bg-teal-950/50 text-slate-400 hover:text-teal-400 flex items-center justify-center transition active:scale-90 shadow-sm"
            title="فيسبوك - محمد حمدي"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-facebook"
            >
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
          </a>
          <a
            href="https://www.youtube.com/@coding-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 flex items-center justify-center transition active:scale-90 shadow-sm"
            title="يوتيوب - Coding Keys"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-youtube"
            >
              <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path>
              <path d="m10 15 5-3-5-3z"></path>
            </svg>
          </a>
          <a
            href="https://www.linkedin.com/in/mohamed-hamdey/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 hover:bg-sky-950/50 text-slate-400 hover:text-sky-400 flex items-center justify-center transition active:scale-90 shadow-sm"
            title="لينكد إن - Mohamed Hamdey"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-linkedin"
            >
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
              <rect width="4" height="12" x="2" y="9"></rect>
              <circle cx="4" cy="4" r="2"></circle>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
