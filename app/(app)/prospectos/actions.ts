"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg, requireRole } from "@/lib/auth/get-current-org";
import { leadSchema } from "@/lib/validations/leads";

export type ActionState = { error?: string } | null;

function parseForm(formData: FormData) {
  return leadSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    source: formData.get("source"),
    interest: formData.get("interest"),
    stage: formData.get("stage") || "nuevo",
    expectedValue: formData.get("expectedValue") || null,
    nextFollowUpAt: formData.get("nextFollowUpAt"),
    notes: formData.get("notes"),
  });
}

export async function createLead(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const current = await getCurrentOrg();
  if (!current) redirect("/login");
  try {
    requireRole(current.role, ["owner", "admin", "comercial"]);
  } catch (e: any) {
    return { error: e.message };
  }

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = createClient();
  const { data: inserted, error } = await supabase
    .from("leads")
    .insert({
      organization_id: current.organization.id,
      name: parsed.data.name,
      company: parsed.data.company || null,
      contact_name: parsed.data.contactName || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      source: parsed.data.source || null,
      interest: parsed.data.interest || null,
      stage: parsed.data.stage,
      expected_value: parsed.data.expectedValue || null,
      next_follow_up_at: parsed.data.nextFollowUpAt || null,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();

  if (error || !inserted) return { error: "No pudimos crear el prospecto." };

  await supabase.from("activity_logs").insert({
    organization_id: current.organization.id,
    entity_type: "leads",
    entity_id: inserted.id,
    action: "lead_created",
    description: `Prospecto "${parsed.data.name}" creado en etapa "${parsed.data.stage}"`,
  });

  revalidatePath("/prospectos");
  redirect(`/prospectos/${inserted.id}`);
}

export async function updateLead(leadId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const current = await getCurrentOrg();
  if (!current) redirect("/login");
  try {
    requireRole(current.role, ["owner", "admin", "comercial"]);
  } catch (e: any) {
    return { error: e.message };
  }

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = createClient();

  const { data: before } = await supabase.from("leads").select("stage").eq("id", leadId).single();

  const { error } = await supabase
    .from("leads")
    .update({
      name: parsed.data.name,
      company: parsed.data.company || null,
      contact_name: parsed.data.contactName || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      source: parsed.data.source || null,
      interest: parsed.data.interest || null,
      stage: parsed.data.stage,
      expected_value: parsed.data.expectedValue || null,
      next_follow_up_at: parsed.data.nextFollowUpAt || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", leadId)
    .eq("organization_id", current.organization.id);

  if (error) return { error: "No pudimos actualizar el prospecto." };

  const stageChanged = before && before.stage !== parsed.data.stage;
  await supabase.from("activity_logs").insert({
    organization_id: current.organization.id,
    entity_type: "leads",
    entity_id: leadId,
    action: stageChanged ? "lead_stage_changed" : "lead_updated",
    description: stageChanged
      ? `Etapa cambiada de "${before?.stage}" a "${parsed.data.stage}"`
      : `Prospecto "${parsed.data.name}" actualizado`,
  });

  revalidatePath("/prospectos");
  revalidatePath(`/prospectos/${leadId}`);
  return null;
}

export async function deleteLead(leadId: string) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin"]);

  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", leadId)
    .eq("organization_id", current.organization.id);

  if (error) throw new Error("No se pudo eliminar el prospecto.");

  revalidatePath("/prospectos");
  redirect("/prospectos");
}
