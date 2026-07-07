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
      <body className="min-h-full flex flex-col bg-white text-ink md:flex-row">
        <Suspense
          fallback={
            <div className="h-14 border-b border-black/5 bg-white md:h-auto md:w-60 md:shrink-0 md:border-b-0 md:border-r" />
          }
        >
          <Sidebar clients={clients} />
        </Suspense>
        <main className="min-w-0 flex-1">{children}</main>
      </body>
    </html>
  );
}
