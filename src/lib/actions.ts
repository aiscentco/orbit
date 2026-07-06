"use server";

import {
  updateProduct,
  createProduct,
  createAction,
  updateAction,
  type GateStage,
  type Product,
  type ActionStatus,
} from "@/lib/notion";
import { revalidatePath } from "next/cache";

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
  await updateProduct(productId, { gateStage: stage });
  revalidatePath("/pipeline");
  revalidatePath("/");
  revalidatePath(`/products/${productId}`);
}

export async function saveProductFields(productId: string, fields: Partial<Product>) {
  const updated = await updateProduct(productId, fields);
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
