"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg, requireRole } from "@/lib/auth/get-current-org";
import { assertSubscriptionActive, assertWithinPlanLimits } from "@/lib/auth/subscription";
import { quotationSchema, computeTotals, type QuotationInput } from "@/lib/validations/quotations";
import { sendEmail } from "@/lib/email/resend";

export type ActionState = { error?: string; success?: string } | null;

async function saveItems(supabase: any, quotationId: string, items: QuotationInput["items"]) {
  await supabase.from("quotation_items").delete().eq("quotation_id", quotationId);
  const rows = items.map((it, i) => ({
    quotation_id: quotationId,
    description: it.description,
    quantity: it.quantity,
    unit: it.unit || null,
    unit_price: it.unitPrice,
    total: it.quantity * it.unitPrice,
    position: i,
  }));
  const { error } = await supabase.from("quotation_items").insert(rows);
  if (error) throw new Error("No pudimos guardar los ítems de la cotización.");
}

export async function createQuotation(input: QuotationInput) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin", "comercial"]);
  assertSubscriptionActive(current.organization.subscription_status);
  await assertWithinPlanLimits(current.organization.id, current.organization.plan, "quotation");

  const parsed = quotationSchema.parse(input);
  const { subtotal, taxAmount, total } = computeTotals(parsed.items, parsed.taxRate, parsed.discountAmount);

  const supabase = createClient();
  const { data: numberData } = await supabase.rpc("next_quotation_number", {
    org: current.organization.id,
  });

  const { data: quotation, error } = await supabase
    .from("quotations")
    .insert({
      organization_id: current.organization.id,
      client_id: parsed.clientId,
      lead_id: parsed.leadId || null,
      quotation_number: numberData,
      title: parsed.title,
      description: parsed.description || null,
      subtotal,
      tax_rate: parsed.taxRate,
      tax_amount: taxAmount,
      discount_amount: parsed.discountAmount,
      total,
      status: "draft",
      valid_until: parsed.validUntil || null,
      created_by: null,
    })
    .select("id")
    .single();

  if (error || !quotation) throw new Error("No pudimos crear la cotización.");

  await saveItems(supabase, quotation.id, parsed.items);

  await supabase.from("activity_logs").insert({
    organization_id: current.organization.id,
    entity_type: "quotations",
    entity_id: quotation.id,
    action: "quotation_created",
    description: `Cotización ${numberData} creada (${parsed.title})`,
  });

  revalidatePath("/cotizaciones");
  redirect(`/cotizaciones/${quotation.id}`);
}

export async function updateQuotation(quotationId: string, input: QuotationInput) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin", "comercial"]);

  const parsed = quotationSchema.parse(input);
  const { subtotal, taxAmount, total } = computeTotals(parsed.items, parsed.taxRate, parsed.discountAmount);

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("quotations")
    .select("status")
    .eq("id", quotationId)
    .eq("organization_id", current.organization.id)
    .single();
  if (!existing) throw new Error("Cotización no encontrada.");
  if (existing.status !== "draft") {
    throw new Error("Solo se pueden editar cotizaciones en borrador.");
  }

  const { error } = await supabase
    .from("quotations")
    .update({
      client_id: parsed.clientId,
      lead_id: parsed.leadId || null,
      title: parsed.title,
      description: parsed.description || null,
      subtotal,
      tax_rate: parsed.taxRate,
      tax_amount: taxAmount,
      discount_amount: parsed.discountAmount,
      total,
      valid_until: parsed.validUntil || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quotationId)
    .eq("organization_id", current.organization.id);

  if (error) throw new Error("No pudimos actualizar la cotización.");

  await saveItems(supabase, quotationId, parsed.items);

  revalidatePath(`/cotizaciones/${quotationId}`);
  redirect(`/cotizaciones/${quotationId}`);
}

export async function deleteQuotation(quotationId: string) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin"]);

  const supabase = createClient();
  const { error } = await supabase
    .from("quotations")
    .delete()
    .eq("id", quotationId)
    .eq("organization_id", current.organization.id);

  if (error) throw new Error("No se pudo eliminar la cotización.");
  revalidatePath("/cotizaciones");
  redirect("/cotizaciones");
}

export async function sendQuotation(quotationId: string) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin", "comercial"]);

  const supabase = createClient();
  const { data: quotation, error } = await supabase
    .from("quotations")
    .update({ status: "sent" })
    .eq("id", quotationId)
    .eq("organization_id", current.organization.id)
    .select("id, quotation_number, title, public_token, clients(email, name)")
    .single();

  if (error || !quotation) throw new Error("No pudimos marcar la cotización como enviada.");

  const client = Array.isArray(quotation.clients) ? quotation.clients[0] : quotation.clients;
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/p/${quotation.public_token}`;

  if (client?.email) {
    await sendEmail({
      to: client.email,
      subject: `Cotización ${quotation.quotation_number} — ${current.organization.name}`,
      html: `<p>Hola ${client.name ?? ""},</p>
             <p>${current.organization.name} te ha enviado la cotización <b>${quotation.quotation_number}: ${quotation.title}</b>.</p>
             <p><a href="${link}">Ver y responder la cotización</a></p>`,
    });
  }

  await supabase.from("activity_logs").insert({
    organization_id: current.organization.id,
    entity_type: "quotations",
    entity_id: quotationId,
    action: "quotation_sent",
    description: `Cotización ${quotation.quotation_number} enviada${client?.email ? ` a ${client.email}` : ""}`,
  });

  revalidatePath(`/cotizaciones/${quotationId}`);
}

export async function setQuotationStatusInternal(quotationId: string, status: "accepted" | "rejected") {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin", "comercial"]);

  const supabase = createClient();
  const { data: quotation, error } = await supabase
    .from("quotations")
    .update({ status })
    .eq("id", quotationId)
    .eq("organization_id", current.organization.id)
    .select("quotation_number")
    .single();

  if (error || !quotation) throw new Error("No pudimos actualizar el estado de la cotización.");

  await supabase.from("activity_logs").insert({
    organization_id: current.organization.id,
    entity_type: "quotations",
    entity_id: quotationId,
    action: `quotation_${status}_manual`,
    description: `Cotización ${quotation.quotation_number} marcada como ${status === "accepted" ? "aceptada" : "rechazada"} manualmente`,
  });

  revalidatePath(`/cotizaciones/${quotationId}`);
}

export async function convertQuotationToProject(quotationId: string) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin", "comercial"]);

  const supabase = createClient();
  const { data: quotation } = await supabase
    .from("quotations")
    .select("id, title, description, total, client_id, status")
    .eq("id", quotationId)
    .eq("organization_id", current.organization.id)
    .single();

  if (!quotation) throw new Error("Cotización no encontrada.");
  if (quotation.status !== "accepted") {
    throw new Error("Solo una cotización aceptada puede convertirse en proyecto.");
  }

  const { data: existingProject } = await supabase
    .from("projects")
    .select("id")
    .eq("quotation_id", quotationId)
    .maybeSingle();
  if (existingProject) {
    redirect(`/proyectos/${existingProject.id}`);
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      organization_id: current.organization.id,
      client_id: quotation.client_id,
      quotation_id: quotation.id,
      name: quotation.title,
      description: quotation.description,
      status: "pending",
      budget: quotation.total,
    })
    .select("id")
    .single();

  if (error || !project) throw new Error("No pudimos crear el proyecto.");

  await supabase.from("activity_logs").insert({
    organization_id: current.organization.id,
    entity_type: "projects",
    entity_id: project.id,
    action: "project_created_from_quotation",
    description: `Proyecto creado a partir de la cotización ${quotationId}`,
  });

  redirect(`/proyectos/${project.id}`);
}
