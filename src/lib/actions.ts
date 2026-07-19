"use server";

import {
  updateProduct,
  createProduct,
  createAction,
  updateAction,
  updateClient,
  createClient,
  getProduct,
  type GateStage,
  type Product,
  type ActionStatus,
  type Action,
  type Client,
} from "@/lib/notion";
import { revalidatePath } from "next/cache";
import { assertClientAccess, assertConsultant } from "@/lib/auth";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function saveClientFields(
  clientId: string,
  fields: Partial<Omit<Client, "id" | "labels" | "distribution">> & {
    labels?: Partial<Client["labels"]>;
    distribution?: Partial<Client["distribution"]>;
  }
) {
  await assertClientAccess(clientId);
  const updated = await updateClient(clientId, fields);
  revalidatePath("/setup");
  revalidatePath("/");
  return updated;
}

export async function createNewClient(fields: {
  name: string;
  consultingLead?: string;
  status?: string;
  engagementStart?: string;
}) {
  await assertConsultant();
  const client = await createClient(fields);
  revalidatePath("/setup");
  revalidatePath("/");
  return client;
}

export async function createNewProduct(fields: {
  name: string;
  clientId: string;
  productCode?: string;
  campaign?: string;
  gateStage?: GateStage;
  launchType?: string;
}) {
  await assertClientAccess(fields.clientId);
  const product = await createProduct(fields);
  revalidatePath("/pipeline");
  revalidatePath("/");
  return product;
}

export async function moveProductStage(productId: string, stage: GateStage) {
  const current = await getProduct(productId);
  await assertClientAccess(current.clientId);
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
  await assertClientAccess(current.clientId);
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
  const product = await getProduct(fields.productId);
  await assertClientAccess(product.clientId);
  const action = await createAction({ ...fields, source: "Manual" });
  revalidatePath(`/products/${fields.productId}`);
  return action;
}

export async function createExtractedActions(
  productId: string,
  items: { owner?: string; note: string; status?: ActionStatus }[]
): Promise<Action[]> {
  const product = await getProduct(productId);
  await assertClientAccess(product.clientId);
  const created: Action[] = [];
  for (const item of items) {
    const action = await createAction({
      productId,
      note: item.note,
      owner: item.owner,
      status: item.status,
      source: "AI-extracted",
    });
    created.push(action);
  }
  revalidatePath(`/products/${productId}`);
  revalidatePath("/actions");
  revalidatePath("/");
  return created;
}

export async function launchSkill(productId: string, skillName: string) {
  const product = await getProduct(productId);
  await assertClientAccess(product.clientId);
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
  const product = await getProduct(productId);
  await assertClientAccess(product.clientId);
  const action = await updateAction(actionId, { status: NEXT_STATUS[current] });
  revalidatePath(`/products/${productId}`);
  revalidatePath("/");
  return action;
}

export async function assignActionOwner(actionId: string, productId: string, owner: string) {
  const product = await getProduct(productId);
  await assertClientAccess(product.clientId);
  const action = await updateAction(actionId, { owner });
  revalidatePath(`/products/${productId}`);
  revalidatePath("/actions");
  revalidatePath("/");
  return action;
}
