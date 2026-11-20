import { ClientForm } from "../client-form";
import { createClientRecord } from "../actions";

export default function NuevoClientePage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold">Nuevo cliente</h1>
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <ClientForm action={createClientRecord} submitLabel="Crear cliente" pendingLabel="Creando..." />
      </div>
    </div>
  );
}
