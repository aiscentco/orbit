"use server";

import {
  updateProduct,
  createProduct,
  createAction,
  updateAction,
  getProduct,
  type GateStage,
  type Product,
  type ActionStatus,
} from "@/lib/notion";
import { revalidatePath } from "next/cache";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function createNewProduct(fields: {
  name: string;
  clientId: string;
  productCode?: string;
  campaign?: string;
  gateStage?: GateStage;
  launchType?: string;
}) {
  const product = await createProduct(fields);
  revalidatePath("/pipeline");
  revalidatePath("/");
  return product;
}

export async function moveProductStage(productId: string, stage: GateStage) {
  const current = await getProduct(productId);
  if (current.gateStage === stage) return current;

  const updated = await updateProduct(productId, { gateStage: stage, stageEntered: today() });

  await createAction({
    productId,
    note: `Stage changed: ${current.gateStage ?? "no stage"} → ${stage}`,
    status: "Done",
    source: "History",
  });

  revalidatePath("/pipeline");
  revalidatePath("/");
  revalidatePath(`/products/${productId}`);
  return updated;
}

export async function saveProductFields(productId: string, fields: Partial<Product>) {
  const current = await getProduct(productId);
  const updated = await updateProduct(productId, fields);

  if (fields.gateDecision !== undefined && fields.gateDecision !== current.gateDecision) {
    await createAction({
      productId,
      note: `Gate decision set to ${fields.gateDecision || "—"}`,
      status: "Done",
      source: "History",
    });
  }

  revalidatePath(`/products/${productId}`);
  revalidatePath("/pipeline");
  revalidatePath("/");
  return updated;
}

export async function addProductAction(fields: {
  productId: string;
  note: string;
  owner?: string;
}) {
  const action = await createAction({ ...fields, source: "Manual" });
  revalidatePath(`/products/${fields.productId}`);
  return action;
}

export async function launchSkill(productId: string, skillName: string) {
  const action = await createAction({
    productId,
    note: `Launched skill: ${skillName}`,
    status: "Done",
    source: "Skill trigger",
  });
  revalidatePath(`/products/${productId}`);
  revalidatePath("/");
  return action;
}

const NEXT_STATUS: Record<ActionStatus, ActionStatus> = {
  "To do": "Waiting",
  Waiting: "Done",
  Done: "To do",
};

export async function cycleActionStatus(actionId: string, productId: string, current: ActionStatus) {
  const action = await updateAction(actionId, { status: NEXT_STATUS[current] });
  revalidatePath(`/products/${productId}`);
  revalidatePath("/");
  return action;
}
