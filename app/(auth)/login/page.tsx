"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { signIn } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Ingresando..." : "Ingresar"}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(signIn, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">Ingresa a tu cuenta</h1>
        <p className="mb-6 text-sm text-neutral-500">Gestiona tus cotizaciones, proyectos y cartera.</p>

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <SubmitButton />
        </form>

        <div className="mt-4 flex justify-between text-sm">
          <Link href="/recuperar" className="text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
          <Link href="/registro" className="text-primary hover:underline">
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
