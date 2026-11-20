"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg, requireRole } from "@/lib/auth/get-current-org";
import { assertSubscriptionActive, assertWithinPlanLimits } from "@/lib/auth/subscription";
import { invoiceSchema, computeInvoiceTotals, paymentSchema, type InvoiceInput } from "@/lib/validations/invoices";
import { sendEmail } from "@/lib/email/resend";

async function saveItems(supabase: any, invoiceId: string, items: InvoiceInput["items"]) {
  await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);
  const rows = items.map((it, i) => ({
    invoice_id: invoiceId,
    description: it.description,
    quantity: it.quantity,
    unit: it.unit || null,
    unit_price: it.unitPrice,
    total: it.quantity * it.unitPrice,
    position: i,
  }));
  const { error } = await supabase.from("invoice_items").insert(rows);
  if (error) throw new Error("No pudimos guardar los ítems de la factura.");
}

export async function createInvoice(input: InvoiceInput) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin", "comercial"]);
  assertSubscriptionActive(current.organization.subscription_status);
  await assertWithinPlanLimits(current.organization.id, current.organization.plan, "invoice");

  const parsed = invoiceSchema.parse(input);
  const { subtotal, taxAmount, total } = computeInvoiceTotals(parsed.items, parsed.taxRate);

  const supabase = createClient();
  const { data: numberData } = await supabase.rpc("next_invoice_number", { org: current.organization.id });

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      organization_id: current.organization.id,
      client_id: parsed.clientId,
      project_id: parsed.projectId || null,
      invoice_number: numberData,
      issue_date: parsed.issueDate,
      due_date: parsed.dueDate || null,
      subtotal,
      tax_rate: parsed.taxRate,
      tax_amount: taxAmount,
      total,
      status: "draft",
      payment_terms: parsed.paymentTerms || null,
      notes: parsed.notes || null,
    })
    .select("id")
    .single();

  if (error || !invoice) throw new Error("No pudimos crear la factura.");

  await saveItems(supabase, invoice.id, parsed.items);

  await supabase.from("activity_logs").insert({
    organization_id: current.organization.id,
    entity_type: "invoices",
    entity_id: invoice.id,
    action: "invoice_created",
    description: `Factura ${numberData} creada`,
  });

  revalidatePath("/facturacion");
  redirect(`/facturacion/${invoice.id}`);
}

export async function updateInvoice(invoiceId: string, input: InvoiceInput) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin", "comercial"]);

  const parsed = invoiceSchema.parse(input);
  const { subtotal, taxAmount, total } = computeInvoiceTotals(parsed.items, parsed.taxRate);

  const supabase = createClient();
  const { data: existing } = await supabase
    .from("invoices")
    .select("status")
    .eq("id", invoiceId)
    .eq("organization_id", current.organization.id)
    .single();
  if (!existing) throw new Error("Factura no encontrada.");
  if (existing.status !== "draft") throw new Error("Solo se pueden editar facturas en borrador.");

  const { error } = await supabase
    .from("invoices")
    .update({
      client_id: parsed.clientId,
      project_id: parsed.projectId || null,
      issue_date: parsed.issueDate,
      due_date: parsed.dueDate || null,
      subtotal,
      tax_rate: parsed.taxRate,
      tax_amount: taxAmount,
      total,
      payment_terms: parsed.paymentTerms || null,
      notes: parsed.notes || null,
    })
    .eq("id", invoiceId)
    .eq("organization_id", current.organization.id);

  if (error) throw new Error("No pudimos actualizar la factura.");
  await saveItems(supabase, invoiceId, parsed.items);

  revalidatePath(`/facturacion/${invoiceId}`);
  redirect(`/facturacion/${invoiceId}`);
}

export async function deleteInvoice(invoiceId: string) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin"]);

  const supabase = createClient();
  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoiceId)
    .eq("organization_id", current.organization.id);
  if (error) throw new Error("No se pudo eliminar la factura.");

  revalidatePath("/facturacion");
  redirect("/facturacion");
}

export async function sendInvoice(invoiceId: string) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin", "comercial"]);

  const supabase = createClient();
  const { data: invoice, error } = await supabase
    .from("invoices")
    .update({ status: "sent" })
    .eq("id", invoiceId)
    .eq("organization_id", current.organization.id)
    .select("id, invoice_number, total, due_date, clients(name, email)")
    .single();

  if (error || !invoice) throw new Error("No pudimos marcar la factura como enviada.");

  const client = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
  if (client?.email) {
    await sendEmail({
      to: client.email,
      subject: `Cuenta de cobro ${invoice.invoice_number} — ${current.organization.name}`,
      html: `<p>Hola ${client.name ?? ""},</p>
             <p>${current.organization.name} te ha enviado la cuenta de cobro <b>${invoice.invoice_number}</b>
             por un total de ${invoice.total}.
             ${invoice.due_date ? `Fecha límite de pago: ${invoice.due_date}.` : ""}</p>`,
    });
  }

  await supabase.from("activity_logs").insert({
    organization_id: current.organization.id,
    entity_type: "invoices",
    entity_id: invoiceId,
    action: "invoice_sent",
    description: `Factura ${invoice.invoice_number} enviada${client?.email ? ` a ${client.email}` : ""}`,
  });

  revalidatePath(`/facturacion/${invoiceId}`);
}

export async function registerPayment(invoiceId: string, input: unknown) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin", "comercial"]);

  const parsed = paymentSchema.parse(input);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("payments").insert({
    organization_id: current.organization.id,
    invoice_id: invoiceId,
    payment_date: parsed.paymentDate,
    amount: parsed.amount,
    payment_method: parsed.paymentMethod || null,
    reference: parsed.reference || null,
    notes: parsed.notes || null,
    created_by: user?.id ?? null,
  });
  // El trigger apply_payment (schema.sql) recalcula amount_paid/status y
  // registra la entrada correspondiente en activity_logs automáticamente.
  if (error) throw new Error("No pudimos registrar el pago.");

  revalidatePath(`/facturacion/${invoiceId}`);
  revalidatePath("/facturacion");
}

export async function sendReminderNow(invoiceId: string) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin", "comercial"]);

  const supabase = createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("invoice_number, balance_due, due_date, clients(name, email)")
    .eq("id", invoiceId)
    .eq("organization_id", current.organization.id)
    .single();
  if (!invoice) throw new Error("Factura no encontrada.");

  const client = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
  if (!client?.email) throw new Error("El cliente no tiene correo registrado.");

  const message = `Te recordamos que tienes un saldo pendiente de ${invoice.balance_due} en la factura ${invoice.invoice_number}${invoice.due_date ? `, con vencimiento ${invoice.due_date}` : ""}.`;

  await sendEmail({
    to: client.email,
    subject: `Recordatorio de pago — Factura ${invoice.invoice_number}`,
    html: `<p>Hola ${client.name ?? ""},</p><p>${message}</p>`,
  });

  await supabase.from("reminders").insert({
    organization_id: current.organization.id,
    invoice_id: invoiceId,
    type: "manual",
    scheduled_at: new Date().toISOString(),
    sent_at: new Date().toISOString(),
    channel: "email",
    status: "sent",
    message,
  });

  revalidatePath(`/facturacion/${invoiceId}`);
}

export async function scheduleReminder(invoiceId: string, scheduledAt: string, message: string) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin", "comercial"]);

  const supabase = createClient();
  const { error } = await supabase.from("reminders").insert({
    organization_id: current.organization.id,
    invoice_id: invoiceId,
    type: "manual",
    scheduled_at: scheduledAt,
    channel: "email",
    status: "pending",
    message,
  });
  if (error) throw new Error("No pudimos programar el recordatorio.");

  revalidatePath(`/facturacion/${invoiceId}`);
}
