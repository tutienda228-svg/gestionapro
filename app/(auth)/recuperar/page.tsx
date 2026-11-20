"use client";

import { useFormState, useFormStatus } from "react-dom";
import { requestPasswordReset } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Enviando..." : "Enviar instrucciones"}
    </Button>
  );
}

export default function RecuperarPage() {
  const [state, formAction] = useFormState(requestPasswordReset, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">Recupera tu contraseña</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Te enviaremos un enlace a tu correo para crear una nueva contraseña.
        </p>

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" name="email" type="email" required />
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state?.success && <p className="text-sm text-green-700">{state.success}</p>}

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
