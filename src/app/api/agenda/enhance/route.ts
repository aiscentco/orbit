import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT =
  "You are an NPD project manager assistant for a beauty consultancy. For each product, write exactly one sentence (max 12 words) naming the single most important decision needed at today's gate meeting. Be specific, no filler, no markdown.";

type EnhanceRequestProduct = {
  name: string;
  stage: string;
  risk: string;
  latestAction: string | null;
};

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function parseNotes(text: string, expectedCount: number): string[] {
  const stripped = stripMarkdownFences(text);

  try {
    const parsed = JSON.parse(stripped);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim());
  } catch {
    // Not JSON - fall back to line-based parsing below.
  }

  return stripped
    .split("\n")
    .map((line) => line.replace(/^\d+[.)]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, expectedCount);
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set in .env.local." },
      { status: 500 }
    );
  }

  let products: EnhanceRequestProduct[];
  try {
    const body = await request.json();
    products = body.products;
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "No products supplied." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const userContent = products
    .map(
      (p, i) =>
        `${i + 1}. ${p.name} — stage: ${p.stage}, risk: ${p.risk}${
          p.latestAction ? `, latest action: ${p.latestAction}` : ""
        }`
    )
    .join("\n");

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    const notes = parseNotes(text, products.length);
    return NextResponse.json({ notes });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed." },
      { status: 500 }
    );
  }
}
