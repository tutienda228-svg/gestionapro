"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createOrgSchema } from "@/lib/validations/auth";

export type ActionState = { error?: string } | null;

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}

export async function createOrganization(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = createOrgSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // create_organization es SECURITY DEFINER: inserta la organización y la
  // membresía "owner" en una sola transacción (ver schema.sql). El cliente
  // nunca inserta directamente en organization_members con rol owner.
  const { data: orgId, error } = await supabase.rpc("create_organization", {
    org_name: parsed.data.name,
    org_slug: slugify(parsed.data.name),
  });

  if (error || !orgId) {
    return { error: "No pudimos crear tu empresa. Intenta de nuevo." };
  }

  cookies().set("active_org_id", orgId as string, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect("/dashboard");
}
