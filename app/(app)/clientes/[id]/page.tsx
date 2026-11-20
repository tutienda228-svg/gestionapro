import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { ActivityLog } from "@/components/shared/activity-log";
import { EditClientForm } from "./edit-form";
import { DeleteClientButton } from "./delete-button";

export default async function ClienteDetallePage({ params }: { params: { id: string } }) {
  const current = await getCurrentOrg();
  if (!current) return null;

  const supabase = createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .eq("organization_id", current.organization.id)
    .single();

  if (!client) notFound();

  const canManage = ["owner", "admin", "comercial"].includes(current.role);
  const canDelete = ["owner", "admin"].includes(current.role);

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold">{client.name}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Aquí verás, en fases siguientes, sus cotizaciones, proyectos y facturas.
      </p>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        {canManage ? (
          <EditClientForm clientId={client.id} client={client} />
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-neutral-500">Contacto</dt>
            <dd>{client.contact_name || "—"}</dd>
            <dt className="text-neutral-500">Correo</dt>
            <dd>{client.email || "—"}</dd>
            <dt className="text-neutral-500">Teléfono</dt>
            <dd>{client.phone || "—"}</dd>
            <dt className="text-neutral-500">Estado</dt>
            <dd>{client.status === "active" ? "Activo" : "Inactivo"}</dd>
          </dl>
        )}
      </div>

      {canDelete && (
        <div className="mt-4">
          <DeleteClientButton clientId={client.id} />
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">Actividad</h2>
        <ActivityLog organizationId={current.organization.id} entityType="clients" entityId={client.id} />
      </div>
    </div>
  );
}
