import type { Metadata, Viewport } from "next";
import { Geist_Mono, Heebo } from "next/font/google";

import { ApiKeyGate } from "@/components/ApiKeyGate";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { ToastProvider } from "@/components/Toast";

import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BlackOpps | Election Intelligence Platform",
  description: "מנוע מודיעין פסיכולוגי, העשרת בוחרים והמלצות אופרטיביות בזמן אמת",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1a1a2e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <ToastProvider>
          <ApiKeyGate>
            <TopNavbar />
            <main className="mx-auto min-h-[calc(100vh-3.5rem)] w-full max-w-[1440px] flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:min-h-[calc(100vh-4rem)] lg:px-8 lg:py-8 xl:px-10 xl:py-10">
              {children}
            </main>
          </ApiKeyGate>
        </ToastProvider>
      </body>
    </html>
  );
}
