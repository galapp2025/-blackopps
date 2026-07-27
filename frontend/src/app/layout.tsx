import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Heebo } from "next/font/google";

import { ApiKeyGate } from "@/components/ApiKeyGate";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ApiKeyGate>{children}</ApiKeyGate>
      </body>
    </html>
  );
}
