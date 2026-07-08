import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT =
  'Extract structured action items from NPD meeting notes. Return JSON only, no markdown: {"actions":[{"owner":"name","note":"action description","status":"To do"}]}. Status is one of To do, Waiting, Done. Be specific and concise.';

const VALID_STATUSES = ["To do", "Waiting", "Done"];

type ExtractedAction = {
  owner?: string;
  note: string;
  status: "To do" | "Waiting" | "Done";
};

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set in .env.local." },
      { status: 500 }
    );
  }

  let productName: string;
  let stage: string;
  let notes: string;
  try {
    const body = await request.json();
    productName = body.productName ?? "";
    stage = body.stage ?? "";
    notes = body.notes ?? "";
    if (!notes.trim()) {
      return NextResponse.json({ error: "No notes supplied." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Product: ${productName}\nStage: ${stage}\n\nMeeting notes:\n${notes}`,
        },
      ],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    let parsed: { actions?: { owner?: string; note?: string; status?: string }[] };
    try {
      parsed = JSON.parse(stripMarkdownFences(text));
    } catch {
      return NextResponse.json(
        { error: "Could not parse the AI response as JSON." },
        { status: 500 }
      );
    }

    const actions: ExtractedAction[] = (parsed.actions ?? [])
      .filter((a) => a.note && a.note.trim())
      .map((a) => ({
        owner: a.owner?.trim() || undefined,
        note: a.note!.trim(),
        status: (VALID_STATUSES.includes(a.status ?? "") ? a.status : "To do") as ExtractedAction["status"],
      }));

    return NextResponse.json({ actions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed." },
      { status: 500 }
    );
  }
}
