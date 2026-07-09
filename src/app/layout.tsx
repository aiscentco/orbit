import type { Metadata } from "next";
import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { DM_Sans, Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { getClients, getClient } from "@/lib/notion";
import { getAuthContext } from "@/lib/auth";

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
  const ctx = await getAuthContext();

  let clients: Awaited<ReturnType<typeof getClients>> = [];
  if (ctx.status === "consultant") {
    clients = await getClients().catch(() => []);
  } else if (ctx.status === "client") {
    const own = await getClient(ctx.clientId).catch(() => null);
    clients = own ? [own] : [];
  }

  const role = ctx.status === "consultant" || ctx.status === "client" ? ctx.status : null;

  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${dmSans.variable} ${inter.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-white text-ink md:flex-row">
          {ctx.status === "unconfigured" ? (
            <div className="flex min-h-screen w-full items-center justify-center p-8">
              <div className="max-w-md text-center">
                <p className="font-heading text-2xl text-brand-primary">Orbit</p>
                <p className="mt-4 text-sm text-ink/70">
                  Your account isn&apos;t linked to a client yet. Contact your AIscent Co. consultant to
                  finish setting up access.
                </p>
              </div>
            </div>
          ) : (
            <>
              <Suspense
                fallback={
                  <div className="h-14 border-b border-black/5 bg-white md:h-auto md:w-60 md:shrink-0 md:border-b-0 md:border-r" />
                }
              >
                <Sidebar clients={clients} role={role} />
              </Suspense>
              <main className="min-w-0 flex-1">{children}</main>
            </>
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}
