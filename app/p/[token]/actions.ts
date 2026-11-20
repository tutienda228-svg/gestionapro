"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Acciones de la vista PÚBLICA de una cotización (sin sesión de usuario).
 * El "token" (public_token, un UUID impredecible) hace las veces de
 * autorización: solo quien tiene el enlace puede aceptar o rechazar.
 * Se usa el cliente admin porque no hay sesión de Supabase Auth aquí,
 * pero las operaciones están acotadas estrictamente por ese token y por
 * status = 'sent' (no se puede reabrir una ya aceptada/rechazada).
 */

export async function acceptQuotationPublic(token: string) {
  const admin = createAdminClient();

  const { data: quotation } = await admin
    .from("quotations")
    .select("id, organization_id, status, quotation_number")
    .eq("public_token", token)
    .single();

  if (!quotation || quotation.status !== "sent") {
    throw new Error("Este enlace ya no está disponible para responder.");
  }

  await admin.from("quotations").update({ status: "accepted" }).eq("id", quotation.id);
  await admin.from("activity_logs").insert({
    organization_id: quotation.organization_id,
    entity_type: "quotations",
    entity_id: quotation.id,
    action: "quotation_accepted",
    description: `Cotización ${quotation.quotation_number} aceptada por el cliente`,
  });

  revalidatePath(`/p/${token}`);
}

export async function rejectQuotationPublic(token: string) {
  const admin = createAdminClient();

  const { data: quotation } = await admin
    .from("quotations")
    .select("id, organization_id, status, quotation_number")
    .eq("public_token", token)
    .single();

  if (!quotation || quotation.status !== "sent") {
    throw new Error("Este enlace ya no está disponible para responder.");
  }

  await admin.from("quotations").update({ status: "rejected" }).eq("id", quotation.id);
  await admin.from("activity_logs").insert({
    organization_id: quotation.organization_id,
    entity_type: "quotations",
    entity_id: quotation.id,
    action: "quotation_rejected",
    description: `Cotización ${quotation.quotation_number} rechazada por el cliente`,
  });

  revalidatePath(`/p/${token}`);
}
