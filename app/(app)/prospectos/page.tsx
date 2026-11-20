import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { formatCOP } from "@/lib/utils/currency";
import { LEAD_STAGES } from "@/lib/validations/leads";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/shared/search-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";

const PAGE_SIZE = 10;
const STAGE_LABEL: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  cotizado: "Cotizado",
  ganado: "Ganado",
  perdido: "Perdido",
};
const STAGE_COLOR: Record<string, string> = {
  nuevo: "bg-neutral-100 text-neutral-600",
  contactado: "bg-blue-100 text-blue-700",
  cotizado: "bg-amber-100 text-amber-700",
  ganado: "bg-green-100 text-green-700",
  perdido: "bg-red-100 text-red-700",
};

export default async function ProspectosPage({
  searchParams,
}: {
  searchParams: { q?: string; stage?: string; page?: string };
}) {
  const current = await getCurrentOrg();
  if (!current) return null;

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createClient();
  let query = supabase
    .from("leads")
    .select("id, name, company, stage, expected_value, next_follow_up_at", { count: "exact" })
    .eq("organization_id", current.organization.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (searchParams.q) query = query.ilike("name", `%${searchParams.q}%`);
  if (searchParams.stage) query = query.eq("stage", searchParams.stage);

  const { data: leads, count } = await query;
  const canCreate = ["owner", "admin", "comercial"].includes(current.role);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Prospectos</h1>
        {canCreate && (
          <Link href="/prospectos/nuevo">
            <Button>Nuevo prospecto</Button>
          </Link>
        )}
      </div>

      <div className="mt-4">
        <SearchBar
          placeholder="Buscar por nombre..."
          filterParam="stage"
          filterOptions={LEAD_STAGES.map((s) => ({ value: s, label: STAGE_LABEL[s] }))}
        />
      </div>

      <div className="mt-6">
        {!leads || leads.length === 0 ? (
          <EmptyState
            title="Aún no tienes prospectos"
            description="Registra tu primer prospecto para empezar a darle seguimiento."
            actionHref={canCreate ? "/prospectos/nuevo" : undefined}
            actionLabel="Crear mi primer prospecto"
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">Etapa</th>
                  <th className="px-4 py-3 font-medium">Valor estimado</th>
                  <th className="px-4 py-3 font-medium">Próximo seguimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link href={`/prospectos/${l.id}`} className="font-medium text-primary hover:underline">
                        {l.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{l.company || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${STAGE_COLOR[l.stage]}`}>
                        {STAGE_LABEL[l.stage] ?? l.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {l.expected_value ? formatCOP(l.expected_value) : "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {l.next_follow_up_at
                        ? new Date(l.next_follow_up_at).toLocaleDateString("es-CO")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={count ?? 0}
        basePath="/prospectos"
        searchParams={searchParams}
      />
    </div>
  );
}
