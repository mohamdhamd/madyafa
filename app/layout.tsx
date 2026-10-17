import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "دفتر المضيافة الذكي | متابعة التحصيل والصناديق الخدمية",
  description: "نظام متكامل لإدارة المضايف وصناديق الخير ومتابعة التحصيل والمصروفات أوفلاين مع مزامنة سحابية",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "المضيافة",
  },
};

export const viewport: Viewport = {
  themeColor: "#070a13",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function isExtensionError(msg, stack, file) {
                  return (
                    (file && (file.indexOf('chrome-extension://') !== -1 || file.indexOf('moz-extension://') !== -1)) ||
                    (stack && (stack.indexOf('chrome-extension://') !== -1 || stack.indexOf('moz-extension://') !== -1)) ||
                    (msg && (msg.indexOf('chrome: call method') !== -1 || msg.indexOf('Window message') !== -1))
                  );
                }
                if (typeof window !== 'undefined') {
                  window.addEventListener('unhandledrejection', function(event) {
                    var r = event.reason;
                    var msg = r ? (r.message || String(r)) : '';
                    var stack = r ? (r.stack || '') : '';
                    if (isExtensionError(msg, stack, '')) {
                      event.stopImmediatePropagation();
                      event.preventDefault();
                    }
                  }, true);
                  window.addEventListener('error', function(event) {
                    var msg = event.message || '';
                    var file = event.filename || '';
                    var stack = event.error ? (event.error.stack || '') : '';
                    if (isExtensionError(msg, stack, file)) {
                      event.stopImmediatePropagation();
                      event.preventDefault();
                    }
                  }, true);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="bg-night-950 text-slate-100 min-h-screen flex flex-col selection:bg-teal-600 selection:text-white">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW registration note:', err.message);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
