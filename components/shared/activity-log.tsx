import { createClient } from "@/lib/supabase/server";

/** Últimas entradas de activity_logs para una entidad puntual (cliente, lead, etc). */
export async function ActivityLog({
  organizationId,
  entityType,
  entityId,
}: {
  organizationId: string;
  entityType: string;
  entityId: string;
}) {
  const supabase = createClient();
  const { data: logs } = await supabase
    .from("activity_logs")
    .select("description, action, created_at")
    .eq("organization_id", organizationId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!logs || logs.length === 0) {
    return <p className="text-sm text-neutral-400">Sin actividad registrada todavía.</p>;
  }

  return (
    <ul className="space-y-2">
      {logs.map((log, i) => (
        <li key={i} className="text-sm">
          <span className="text-neutral-700">{log.description}</span>{" "}
          <span className="text-neutral-400">
            · {new Date(log.created_at as string).toLocaleString("es-CO")}
          </span>
        </li>
      ))}
    </ul>
  );
}
