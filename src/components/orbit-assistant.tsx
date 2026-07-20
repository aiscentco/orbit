"use client";

import { useState } from "react";
import Link from "next/link";

type ProductRef = { id: string; name: string };
type Message = { role: "user" | "assistant"; text: string; products?: ProductRef[] };

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function linkify(text: string, products: ProductRef[]) {
  if (products.length === 0) return text;
  const sorted = [...products].sort((a, b) => b.name.length - a.name.length);
  const pattern = new RegExp(`(${sorted.map((p) => escapeRegExp(p.name)).join("|")})`, "g");
  return text.split(pattern).map((part, i) => {
    const match = sorted.find((p) => p.name === part);
    if (match) {
      return (
        <Link
          key={i}
          href={`/products/${match.id}`}
          className="font-medium text-brand-primary underline decoration-dotted"
        >
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function OrbitAssistant({ clientId }: { clientId: string | null }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);

  if (!clientId) return null;

  async function handleSend() {
    const q = question.trim();
    if (!q || pending) return;
    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setPending(true);
    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, question: q }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer ?? data.error ?? "Something went wrong.",
          products: data.products,
        },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Something went wrong." }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 flex h-96 w-80 flex-col rounded-card border border-black/10 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-black/5 p-3">
            <p className="font-heading text-sm text-ink">Orbit Assistant</p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-ink/40 hover:text-ink"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
            {messages.length === 0 && (
              <p className="text-xs text-ink/40">
                Ask about this client&apos;s pipeline — e.g. &quot;which products are late?&quot;
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`text-sm ${m.role === "user" ? "font-medium text-ink" : "text-ink/80"}`}>
                {m.role === "assistant" ? linkify(m.text, m.products ?? []) : m.text}
              </div>
            ))}
            {pending && <p className="text-xs text-ink/40">Thinking…</p>}
          </div>
          <div className="flex gap-2 border-t border-black/5 p-3">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask a question…"
              className="flex-1 rounded-lg border border-black/10 px-2 py-1.5 text-sm text-ink"
            />
            <button
              onClick={handleSend}
              disabled={pending || !question.trim()}
              className="rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
            >
              Ask
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Orbit Assistant"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-sm font-medium text-white shadow-lg hover:opacity-90"
      >
        Ask
      </button>
    </div>
  );
}
