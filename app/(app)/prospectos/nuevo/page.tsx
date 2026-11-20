import { LeadForm } from "../lead-form";
import { createLead } from "../actions";

export default function NuevoProspectoPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold">Nuevo prospecto</h1>
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <LeadForm action={createLead} submitLabel="Crear prospecto" pendingLabel="Creando..." />
      </div>
    </div>
  );
}
