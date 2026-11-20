import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { formatCOP } from "@/lib/utils/currency";
import { ActivityLog } from "@/components/shared/activity-log";
import { Button } from "@/components/ui/button";
import { StatusSelect } from "./status-select";
import { TaskList } from "./task-list";
import { TimeEntries } from "./time-entries";
import { Materials } from "./materials";

export default async function ProyectoDetallePage({ params }: { params: { id: string } }) {
  const current = await getCurrentOrg();
  if (!current) return null;

  const supabase = createClient();
  const { data: project } = await supabase
    .from("projects")
    .select(
      "*, clients(name), project_tasks(*), project_time_entries(*), project_materials(*)"
    )
    .eq("id", params.id)
    .eq("organization_id", current.organization.id)
    .single();

  if (!project) notFound();

  const tasks = project.project_tasks ?? [];
  const timeEntries = project.project_time_entries ?? [];
  const materials = project.project_materials ?? [];

  const doneTasks = tasks.filter((t: any) => t.status === "done").length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const laborCost = timeEntries.reduce((acc: number, t: any) => acc + Number(t.total_cost ?? 0), 0);
  const materialsCost = materials.reduce((acc: number, m: any) => acc + Number(m.total_cost ?? 0), 0);
  const realCost = laborCost + materialsCost;

  const canOperate = ["owner", "admin", "operativo"].includes(current.role);
  const canManage = ["owner", "admin"].includes(current.role);

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <p className="text-sm text-neutral-500">Cliente: {project.clients?.name ?? "—"}</p>
        </div>
        <StatusSelect projectId={project.id} status={project.status} canOperate={canOperate} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Avance</p>
          <p className="text-lg font-semibold">{progress}%</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Presupuesto</p>
          <p className="text-lg font-semibold">{formatCOP(project.budget ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Costo real</p>
          <p className="text-lg font-semibold">{formatCOP(realCost)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Margen estimado</p>
          <p className={`text-lg font-semibold ${(project.budget ?? 0) - realCost < 0 ? "text-red-600" : ""}`}>
            {formatCOP((project.budget ?? 0) - realCost)}
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">Tareas</h2>
        <TaskList projectId={project.id} tasks={tasks} canOperate={canOperate} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">Horas registradas</h2>
        <TimeEntries projectId={project.id} entries={timeEntries} canOperate={canOperate} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">Materiales</h2>
        <Materials projectId={project.id} materials={materials} canOperate={canOperate} />
      </section>

      {canManage && (
        <div className="mt-8">
          <a href={`/api/pdf/work-order/${project.id}`} target="_blank" rel="noreferrer">
            <Button variant="secondary">Descargar orden de trabajo (PDF)</Button>
          </a>
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">Actividad</h2>
        <ActivityLog organizationId={current.organization.id} entityType="projects" entityId={project.id} />
      </div>
    </div>
  );
}
