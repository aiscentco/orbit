import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getProducts, getActionsForProducts } from "@/lib/notion";
import { assertClientAccess } from "@/lib/auth";
import { computeRisk } from "@/lib/gates";

const SYSTEM_PROMPT =
  "You are Orbit's assistant for a beauty NPD consultancy. Answer only using the pipeline snapshot provided below - never invent products, dates, or actions that aren't in it. Be concise and specific (a few sentences at most, no markdown). If the data doesn't cover what's asked, say so plainly rather than guessing. Always refer to products by their exact name as given, so they can be turned into links.";

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set in .env.local." },
      { status: 500 }
    );
  }

  let clientId: string;
  let question: string;
  try {
    const body = await request.json();
    clientId = body.clientId;
    question = body.question;
    if (!clientId || !question?.trim()) {
      return NextResponse.json({ error: "clientId and question are required." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    await assertClientAccess(clientId);
  } catch {
    return NextResponse.json({ error: "Not authorized to view this client's pipeline." }, { status: 403 });
  }

  const products = await getProducts(clientId);
  const visibleProducts = products.filter(
    (p) => p.projectStatus !== "Cancelled" && p.projectStatus !== "Completed"
  );
  const actions = await getActionsForProducts(visibleProducts.map((p) => p.id));
  const openActions = actions.filter((a) => a.source !== "History" && a.status !== "Done");

  const snapshot = {
    products: visibleProducts.map((p) => {
      const risk = computeRisk(p.nextGateDate);
      return {
        name: p.name,
        stage: p.gateStage,
        campaign: p.campaign,
        brandManager: p.brandManager,
        nextGateDate: p.nextGateDate,
        risk: risk.level,
        daysUntilGate: risk.daysUntil,
      };
    }),
    openActions: openActions.map((a) => {
      const product = visibleProducts.find((p) => p.id === a.productId);
      return {
        product: product?.name ?? "Unknown product",
        note: a.note,
        owner: a.owner,
        status: a.status,
      };
    }),
  };

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Pipeline snapshot:\n${JSON.stringify(snapshot)}\n\nQuestion: ${question}`,
        },
      ],
    });

    const answer = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return NextResponse.json({
      answer,
      products: visibleProducts.map((p) => ({ id: p.id, name: p.name })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed." },
      { status: 500 }
    );
  }
}
