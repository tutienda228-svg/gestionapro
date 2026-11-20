"use client";

import { useFormState, useFormStatus } from "react-dom";
import { inviteMember } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enviando..." : "Invitar"}
    </Button>
  );
}

export function InviteForm() {
  const [state, formAction] = useFormState(inviteMember, null);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" placeholder="persona@empresa.com" required />
      </div>
      <div className="sm:w-48">
        <Label htmlFor="role">Rol</Label>
        <Select id="role" name="role" defaultValue="operativo">
          <option value="admin">Administrador</option>
          <option value="comercial">Comercial</option>
          <option value="operativo">Operativo</option>
          <option value="readonly">Solo lectura</option>
        </Select>
      </div>
      <SubmitButton />

      {state?.error && <p className="text-sm text-red-600 sm:basis-full">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700 sm:basis-full">{state.success}</p>}
    </form>
  );
}
