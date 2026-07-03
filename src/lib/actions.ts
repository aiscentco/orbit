"use server";

import { updateProduct, type GateStage } from "@/lib/notion";
import { revalidatePath } from "next/cache";

export async function moveProductStage(productId: string, stage: GateStage) {
  await updateProduct(productId, { gateStage: stage });
  revalidatePath("/pipeline");
  revalidatePath("/");
}
