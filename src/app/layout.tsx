import type { Metadata } from "next";
import { Suspense } from "react";
import { DM_Sans, Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { getClients } from "@/lib/notion";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orbit | AIscent Co.",
  description: "NPD gate pipeline orchestrator for AIscent Co.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clients = await getClients().catch(() => []);

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-white text-ink">
        <Suspense fallback={<div className="w-60 shrink-0 border-r border-black/5 bg-white" />}>
          <Sidebar clients={clients} />
        </Suspense>
        <main className="flex-1 min-w-0">{children}</main>
      </body>
    </html>
  );
}
