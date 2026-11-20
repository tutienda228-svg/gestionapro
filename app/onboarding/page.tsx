"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createOrganization } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creando..." : "Crear mi empresa"}
    </Button>
  );
}

export default function OnboardingPage() {
  const [state, formAction] = useFormState(createOrganization, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">Crea tu empresa</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Así identificaremos tus clientes, cotizaciones y proyectos.
        </p>

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre de tu empresa</Label>
            <Input id="name" name="name" placeholder="Ej: Soluciones Llanero SAS" required />
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
