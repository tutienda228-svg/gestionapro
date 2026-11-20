"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg, requireRole } from "@/lib/auth/get-current-org";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2),
  nitOrTaxId: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  logoUrl: z.string().trim().optional().or(z.literal("")),
});

export type ActionState = { error?: string; success?: string } | null;

export async function updateCompany(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const current = await getCurrentOrg();
  if (!current) return { error: "No autenticado." };
  try {
    requireRole(current.role, ["owner", "admin"]);
  } catch (e: any) {
    return { error: e.message };
  }

  const parsed = schema.safeParse({
    name: formData.get("name"),
    nitOrTaxId: formData.get("nitOrTaxId"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    logoUrl: formData.get("logoUrl"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      name: parsed.data.name,
      nit_or_tax_id: parsed.data.nitOrTaxId || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      logo_url: parsed.data.logoUrl || null,
    })
    .eq("id", current.organization.id);

  if (error) return { error: "No pudimos guardar los datos de la empresa." };

  revalidatePath("/configuracion/empresa");
  return { success: "Datos guardados." };
}
