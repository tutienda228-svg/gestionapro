import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/shared/search-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";

const PAGE_SIZE = 10;

export default async function ClientesPage({
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
    .from("clients")
    .select("id, name, contact_name, email, phone, status", { count: "exact" })
    .eq("organization_id", current.organization.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (searchParams.q) {
    query = query.ilike("name", `%${searchParams.q}%`);
  }
  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }

  const { data: clients, count } = await query;
  const canCreate = ["owner", "admin", "comercial"].includes(current.role);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clientes</h1>
        {canCreate && (
          <Link href="/clientes/nuevo">
            <Button>Nuevo cliente</Button>
          </Link>
        )}
      </div>

      <div className="mt-4">
        <SearchBar
          placeholder="Buscar por nombre..."
          filterOptions={[
            { value: "active", label: "Activos" },
            { value: "inactive", label: "Inactivos" },
          ]}
        />
      </div>

      <div className="mt-6">
        {!clients || clients.length === 0 ? (
          <EmptyState
            title="Aún no tienes clientes"
            description="Crea tu primer cliente en 2 minutos para empezar a cotizar."
            actionHref={canCreate ? "/clientes/nuevo" : undefined}
            actionLabel="Crear mi primer cliente"
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Contacto</th>
                  <th className="px-4 py-3 font-medium">Correo / Teléfono</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link href={`/clientes/${c.id}`} className="font-medium text-primary hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{c.contact_name || "—"}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {c.email || "—"} {c.phone ? `· ${c.phone}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          c.status === "active"
                            ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                            : "rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500"
                        }
                      >
                        {c.status === "active" ? "Activo" : "Inactivo"}
                      </span>
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
        basePath="/clientes"
        searchParams={searchParams}
      />
    </div>
  );
}
