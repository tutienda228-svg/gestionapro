import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { PROJECT_STATUSES } from "@/lib/validations/projects";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/shared/search-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";

const PAGE_SIZE = 10;
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  paused: "Pausado",
  completed: "Completado",
  cancelled: "Cancelado",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-neutral-100 text-neutral-600",
  in_progress: "bg-blue-100 text-blue-700",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default async function ProyectosPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string };
}) {
  const current = await getCurrentOrg();
  if (!current) return null;

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createClient();
  let query = supabase
    .from("projects")
    .select("id, name, status, budget, due_date, clients(name)", { count: "exact" })
    .eq("organization_id", current.organization.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (searchParams.q) query = query.ilike("name", `%${searchParams.q}%`);
  if (searchParams.status) query = query.eq("status", searchParams.status);

  const { data: projects, count } = await query;
  const canCreate = ["owner", "admin", "comercial"].includes(current.role);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Proyectos</h1>
        {canCreate && (
          <Link href="/proyectos/nuevo">
            <Button>Nuevo proyecto</Button>
          </Link>
        )}
      </div>

      <div className="mt-4">
        <SearchBar
          placeholder="Buscar por nombre..."
          filterOptions={PROJECT_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
        />
      </div>

      <div className="mt-6">
        {!projects || projects.length === 0 ? (
          <EmptyState
            title="Aún no tienes proyectos"
            description="Los proyectos se crean manualmente o al convertir una cotización aceptada."
            actionHref={canCreate ? "/proyectos/nuevo" : undefined}
            actionLabel="Crear mi primer proyecto"
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Entrega</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {projects.map((p: any) => (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link href={`/proyectos/${p.id}`} className="font-medium text-primary hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{p.clients?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {p.due_date ? new Date(p.due_date).toLocaleDateString("es-CO") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLOR[p.status]}`}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} basePath="/proyectos" searchParams={searchParams} />
    </div>
  );
}
