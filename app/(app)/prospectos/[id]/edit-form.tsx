"use client";

import { LeadForm } from "../lead-form";
import { updateLead } from "../actions";

export function EditLeadForm({ leadId, lead }: { leadId: string; lead: any }) {
  const boundAction = updateLead.bind(null, leadId);
  return (
    <LeadForm action={boundAction} defaultValues={lead} submitLabel="Guardar cambios" pendingLabel="Guardando..." />
  );
}
