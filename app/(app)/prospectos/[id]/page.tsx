import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { ActivityLog } from "@/components/shared/activity-log";
import { EditLeadForm } from "./edit-form";
import { DeleteLeadButton } from "./delete-button";

export default async function ProspectoDetallePage({ params }: { params: { id: string } }) {
  const current = await getCurrentOrg();
  if (!current) return null;

  const supabase = createClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", params.id)
    .eq("organization_id", current.organization.id)
    .single();

  if (!lead) notFound();

  const canManage = ["owner", "admin", "comercial"].includes(current.role);
  const canDelete = ["owner", "admin"].includes(current.role);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold">{lead.name}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Cuando aceptes una cotización para este prospecto, podrás vincularla aquí (Fase 3).
      </p>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        {canManage ? (
          <EditLeadForm leadId={lead.id} lead={lead} />
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-neutral-500">Empresa</dt>
            <dd>{lead.company || "—"}</dd>
            <dt className="text-neutral-500">Etapa</dt>
            <dd>{lead.stage}</dd>
            <dt className="text-neutral-500">Notas</dt>
            <dd>{lead.notes || "—"}</dd>
          </dl>
        )}
      </div>

      {canDelete && (
        <div className="mt-4">
          <DeleteLeadButton leadId={lead.id} />
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">Actividad</h2>
        <ActivityLog organizationId={current.organization.id} entityType="leads" entityId={lead.id} />
      </div>
    </div>
  );
}
