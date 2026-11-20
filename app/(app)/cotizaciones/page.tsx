import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { formatCOP } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/shared/search-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";

const PAGE_SIZE = 10;
const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
  expired: "Expirada",
};
const STATUS_COLOR: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-amber-100 text-amber-700",
};

export default async function CotizacionesPage({
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
    .from("quotations")
    .select("id, quotation_number, title, total, status, clients(name)", { count: "exact" })
    .eq("organization_id", current.organization.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (searchParams.q) query = query.ilike("title", `%${searchParams.q}%`);
  if (searchParams.status) query = query.eq("status", searchParams.status);

  const { data: quotations, count } = await query;
  const canCreate = ["owner", "admin", "comercial"].includes(current.role);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Cotizaciones</h1>
        {canCreate && (
          <Link href="/cotizaciones/nuevo">
            <Button>Nueva cotización</Button>
          </Link>
        )}
      </div>

      <div className="mt-4">
        <SearchBar
          placeholder="Buscar por título..."
          filterOptions={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
        />
      </div>

      <div className="mt-6">
        {!quotations || quotations.length === 0 ? (
          <EmptyState
            title="Aún no tienes cotizaciones"
            description="Crea tu primera cotización en 2 minutos."
            actionHref={canCreate ? "/cotizaciones/nuevo" : undefined}
            actionLabel="Crear mi primera cotización"
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">N°</th>
                  <th className="px-4 py-3 font-medium">Título</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {quotations.map((q: any) => (
                  <tr key={q.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-neutral-600">{q.quotation_number}</td>
                    <td className="px-4 py-3">
                      <Link href={`/cotizaciones/${q.id}`} className="font-medium text-primary hover:underline">
                        {q.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{q.clients?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-600">{formatCOP(q.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLOR[q.status]}`}>
                        {STATUS_LABEL[q.status] ?? q.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} basePath="/cotizaciones" searchParams={searchParams} />
    </div>
  );
}
