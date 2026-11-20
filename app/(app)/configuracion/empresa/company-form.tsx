"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateCompany } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Guardando..." : "Guardar cambios"}</Button>;
}

export function CompanyForm({ defaultValues }: { defaultValues: any }) {
  const [state, formAction] = useFormState(updateCompany, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre de la empresa *</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required />
      </div>
      <div>
        <Label htmlFor="nitOrTaxId">NIT</Label>
        <Input id="nitOrTaxId" name="nitOrTaxId" defaultValue={defaultValues?.nit_or_tax_id ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" defaultValue={defaultValues?.phone ?? ""} />
        </div>
        <div>
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" defaultValue={defaultValues?.email ?? ""} />
        </div>
      </div>
      <div>
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" name="address" defaultValue={defaultValues?.address ?? ""} />
      </div>
      <div>
        <Label htmlFor="logoUrl">URL del logo</Label>
        <Input id="logoUrl" name="logoUrl" placeholder="https://..." defaultValue={defaultValues?.logo_url ?? ""} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}

      <SubmitButton />
    </form>
  );
}
