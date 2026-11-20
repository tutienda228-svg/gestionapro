import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type MemberRole = "owner" | "admin" | "comercial" | "operativo" | "readonly";

export type CurrentOrg = {
  organization: {
    id: string;
    name: string;
    slug: string;
    subscription_status: string;
    plan: string;
  };
  role: MemberRole;
  memberships: { organization_id: string; name: string; role: MemberRole }[];
};

/**
 * Resuelve en el SERVIDOR la organización activa del usuario autenticado.
 * Nunca confía en un organization_id enviado por el cliente: lee la cookie
 * "active_org_id" solo como preferencia de UI y SIEMPRE valida que el usuario
 * sea miembro activo de esa organización antes de usarla (y si no, cae a la
 * primera organización disponible). RLS además garantiza el aislamiento aunque
 * esta función tuviera un error.
 */
export async function getCurrentOrg(): Promise<CurrentOrg | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships, error } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(id, name, slug, subscription_status, plan)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error || !memberships || memberships.length === 0) return null;

  const preferredId = cookies().get("active_org_id")?.value;
  const active =
    memberships.find((m) => m.organization_id === preferredId) ?? memberships[0];

  const org = Array.isArray(active.organizations) ? active.organizations[0] : active.organizations;
  if (!org) return null;

  return {
    organization: org as CurrentOrg["organization"],
    role: active.role as MemberRole,
    memberships: memberships.map((m) => {
      const o = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations;
      return { organization_id: m.organization_id, name: (o as any)?.name ?? "", role: m.role as MemberRole };
    }),
  };
}

export function requireRole(role: MemberRole, allowed: MemberRole[]) {
  if (!allowed.includes(role)) {
    throw new Error("No tienes permisos para realizar esta acción.");
  }
}
