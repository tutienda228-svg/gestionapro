"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg, requireRole } from "@/lib/auth/get-current-org";
import { clientSchema } from "@/lib/validations/clients";

export type ActionState = { error?: string } | null;

function parseForm(formData: FormData) {
  return clientSchema.safeParse({
    name: formData.get("name"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    taxId: formData.get("taxId"),
    notes: formData.get("notes"),
    status: formData.get("status") || "active",
  });
}

export async function createClientRecord(_prev: ActionState, formData: FormData): Promise<ActionState> {
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
    .from("clients")
    .insert({
      organization_id: current.organization.id,
      name: parsed.data.name,
      contact_name: parsed.data.contactName || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      tax_id: parsed.data.taxId || null,
      notes: parsed.data.notes || null,
      status: parsed.data.status,
    })
    .select("id")
    .single();

  if (error || !inserted) return { error: "No pudimos crear el cliente." };

  await supabase.from("activity_logs").insert({
    organization_id: current.organization.id,
    entity_type: "clients",
    entity_id: inserted.id,
    action: "client_created",
    description: `Cliente "${parsed.data.name}" creado`,
  });

  revalidatePath("/clientes");
  redirect(`/clientes/${inserted.id}`);
}

export async function updateClientRecord(
  clientId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
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
  const { error } = await supabase
    .from("clients")
    .update({
      name: parsed.data.name,
      contact_name: parsed.data.contactName || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      tax_id: parsed.data.taxId || null,
      notes: parsed.data.notes || null,
      status: parsed.data.status,
    })
    .eq("id", clientId)
    .eq("organization_id", current.organization.id); // defensa en capas, además de RLS

  if (error) return { error: "No pudimos actualizar el cliente." };

  await supabase.from("activity_logs").insert({
    organization_id: current.organization.id,
    entity_type: "clients",
    entity_id: clientId,
    action: "client_updated",
    description: `Cliente "${parsed.data.name}" actualizado`,
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clientId}`);
  return null;
}

export async function deleteClientRecord(clientId: string) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin"]);

  const supabase = createClient();
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("organization_id", current.organization.id);

  if (error) throw new Error("No se pudo eliminar. Puede tener cotizaciones o facturas asociadas.");

  revalidatePath("/clientes");
  redirect("/clientes");
}
