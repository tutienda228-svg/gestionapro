"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg, requireRole } from "@/lib/auth/get-current-org";
import { assertWithinPlanLimits } from "@/lib/auth/subscription";
import { inviteMemberSchema } from "@/lib/validations/auth";

export type ActionState = { error?: string; success?: string } | null;

export async function inviteMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const current = await getCurrentOrg();
  if (!current) return { error: "No autenticado." };

  try {
    requireRole(current.role, ["owner", "admin"]);
  } catch (e: any) {
    return { error: e.message };
  }

  const parsed = inviteMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    await assertWithinPlanLimits(current.organization.id, current.organization.plan, "member");
  } catch (e: any) {
    return { error: e.message };
  }

  const admin = createAdminClient();
  const orgId = current.organization.id;

  // 1) Crea (o reutiliza) el usuario en auth.users y le envía el correo de
  //    invitación con enlace para definir su contraseña. El trigger de
  //    auth.users -> public.users crea el perfil espejo automáticamente.
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    parsed.data.email,
    { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard` }
  );

  let userId = invited?.user?.id;

  if (inviteError) {
    // Si el usuario ya existe, lo buscamos para poder agregarlo a esta organización.
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list?.users.find((u) => u.email === parsed.data.email);
    if (!existing) {
      return { error: "No pudimos invitar a este usuario. " + inviteError.message };
    }
    userId = existing.id;
  }

  if (!userId) return { error: "No se pudo determinar el usuario invitado." };

  // 2) Lo agrega como miembro de ESTA organización con el rol elegido.
  //    Se usa el cliente normal (RLS) porque members_insert exige owner/admin,
  //    lo que ya validamos arriba con requireRole como defensa adicional en capas.
  const supabase = createClient();
  const { error: memberError } = await supabase.from("organization_members").insert({
    organization_id: orgId,
    user_id: userId,
    role: parsed.data.role,
    status: "invited",
    invited_at: new Date().toISOString(),
  });

  if (memberError) {
    return { error: "No pudimos vincular al usuario a tu organización: " + memberError.message };
  }

  await supabase.from("activity_logs").insert({
    organization_id: orgId,
    entity_type: "organization_members",
    entity_id: userId,
    action: "member_invited",
    description: `Invitación enviada a ${parsed.data.email} con rol ${parsed.data.role}`,
  });

  revalidatePath("/configuracion/usuarios");
  return { success: `Invitación enviada a ${parsed.data.email}.` };
}

export async function updateMemberRole(memberUserId: string, role: string) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin"]);

  const supabase = createClient();
  const { error } = await supabase
    .from("organization_members")
    .update({ role })
    .eq("organization_id", current.organization.id)
    .eq("user_id", memberUserId);

  if (error) throw new Error(error.message);
  revalidatePath("/configuracion/usuarios");
}

export async function removeMember(memberUserId: string) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner"]); // solo el owner elimina miembros

  const supabase = createClient();
  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", current.organization.id)
    .eq("user_id", memberUserId);

  if (error) throw new Error(error.message);
  revalidatePath("/configuracion/usuarios");
}
