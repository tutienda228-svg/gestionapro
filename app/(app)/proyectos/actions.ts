"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg, requireRole } from "@/lib/auth/get-current-org";
import { projectSchema, taskSchema, timeEntrySchema, materialSchema, type ProjectInput } from "@/lib/validations/projects";

export type ActionState = { error?: string } | null;

// ---------- Proyecto ----------

export async function createProject(formData: FormData): Promise<void> {
  const current = await getCurrentOrg();
  if (!current) redirect("/login");
  requireRole(current.role, ["owner", "admin", "comercial"]); // lanza si no tiene permiso

  const parsed = projectSchema.safeParse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    description: formData.get("description"),
    status: formData.get("status") || "pending",
    startDate: formData.get("startDate"),
    dueDate: formData.get("dueDate"),
    budget: formData.get("budget") || null,
    responsibleUserId: formData.get("responsibleUserId") || null,
  });
  if (!parsed.success) {
    redirect(`/proyectos/nuevo?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Datos inválidos")}`);
  }

  const supabase = createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      organization_id: current.organization.id,
      client_id: parsed.data.clientId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      status: parsed.data.status,
      start_date: parsed.data.startDate || null,
      due_date: parsed.data.dueDate || null,
      budget: parsed.data.budget || null,
      responsible_user_id: parsed.data.responsibleUserId || null,
    })
    .select("id")
    .single();

  if (error || !project) {
    redirect(`/proyectos/nuevo?error=${encodeURIComponent("No pudimos crear el proyecto.")}`);
  }

  await supabase.from("activity_logs").insert({
    organization_id: current.organization.id,
    entity_type: "projects",
    entity_id: project.id,
    action: "project_created",
    description: `Proyecto "${parsed.data.name}" creado`,
  });

  revalidatePath("/proyectos");
  redirect(`/proyectos/${project.id}`);
}

export async function updateProjectStatus(projectId: string, status: string) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin", "operativo"]);

  const supabase = createClient();
  const { error } = await supabase
    .from("projects")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("organization_id", current.organization.id);
  if (error) throw new Error("No pudimos actualizar el estado del proyecto.");

  await supabase.from("activity_logs").insert({
    organization_id: current.organization.id,
    entity_type: "projects",
    entity_id: projectId,
    action: "project_status_changed",
    description: `Estado del proyecto cambiado a "${status}"`,
  });

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/proyectos");
}

export async function deleteProject(projectId: string) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin"]);

  const supabase = createClient();
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("organization_id", current.organization.id);
  if (error) throw new Error("No se pudo eliminar. Puede tener facturas asociadas.");

  revalidatePath("/proyectos");
  redirect("/proyectos");
}

// ---------- Tareas ----------

export async function addTask(projectId: string, input: unknown) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin", "operativo", "comercial"]);

  const parsed = taskSchema.parse(input);
  const supabase = createClient();
  const { error } = await supabase.from("project_tasks").insert({
    project_id: projectId,
    title: parsed.title,
    description: parsed.description || null,
    assigned_to_user_id: parsed.assignedToUserId || null,
    due_date: parsed.dueDate || null,
  });
  if (error) throw new Error("No pudimos crear la tarea.");
  revalidatePath(`/proyectos/${projectId}`);
}

export async function updateTaskStatus(projectId: string, taskId: string, status: string) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin", "operativo", "comercial"]);

  const supabase = createClient();
  const { error } = await supabase
    .from("project_tasks")
    .update({ status, completed_at: status === "done" ? new Date().toISOString() : null })
    .eq("id", taskId);
  if (error) throw new Error("No pudimos actualizar la tarea.");
  revalidatePath(`/proyectos/${projectId}`);
}

export async function deleteTask(projectId: string, taskId: string) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin", "operativo"]);

  const supabase = createClient();
  await supabase.from("project_tasks").delete().eq("id", taskId);
  revalidatePath(`/proyectos/${projectId}`);
}

// ---------- Horas ----------

export async function addTimeEntry(projectId: string, input: unknown) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin", "operativo"]);

  const parsed = timeEntrySchema.parse(input);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("project_time_entries").insert({
    project_id: projectId,
    user_id: user?.id,
    date: parsed.date,
    hours: parsed.hours,
    activity_description: parsed.activityDescription || null,
    hourly_rate: parsed.hourlyRate ?? null,
  });
  if (error) throw new Error("No pudimos registrar las horas.");
  revalidatePath(`/proyectos/${projectId}`);
}

export async function deleteTimeEntry(projectId: string, entryId: string) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin", "operativo"]);

  const supabase = createClient();
  await supabase.from("project_time_entries").delete().eq("id", entryId);
  revalidatePath(`/proyectos/${projectId}`);
}

// ---------- Materiales ----------

export async function addMaterial(projectId: string, input: unknown) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin", "operativo"]);

  const parsed = materialSchema.parse(input);
  const supabase = createClient();
  const { error } = await supabase.from("project_materials").insert({
    project_id: projectId,
    name: parsed.name,
    quantity: parsed.quantity,
    unit: parsed.unit || null,
    unit_cost: parsed.unitCost,
    supplier: parsed.supplier || null,
    notes: parsed.notes || null,
  });
  if (error) throw new Error("No pudimos registrar el material.");
  revalidatePath(`/proyectos/${projectId}`);
}

export async function deleteMaterial(projectId: string, materialId: string) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner", "admin", "operativo"]);

  const supabase = createClient();
  await supabase.from("project_materials").delete().eq("id", materialId);
  revalidatePath(`/proyectos/${projectId}`);
}
