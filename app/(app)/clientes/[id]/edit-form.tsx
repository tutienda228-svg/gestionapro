"use client";

import { ClientForm } from "../client-form";
import { updateClientRecord } from "../actions";

export function EditClientForm({ clientId, client }: { clientId: string; client: any }) {
  const boundAction = updateClientRecord.bind(null, clientId);
  return (
    <ClientForm
      action={boundAction}
      defaultValues={client}
      submitLabel="Guardar cambios"
      pendingLabel="Guardando..."
    />
  );
}
