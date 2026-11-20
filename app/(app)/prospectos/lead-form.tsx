"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LEAD_STAGES } from "@/lib/validations/leads";

type Lead = {
  name: string;
  company?: string | null;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  interest?: string | null;
  stage: string;
  expected_value?: number | null;
  next_follow_up_at?: string | null;
  notes?: string | null;
};

const STAGE_LABEL: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  cotizado: "Cotizado",
  ganado: "Ganado",
  perdido: "Perdido",
};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function LeadForm({
  action,
  defaultValues,
  submitLabel,
  pendingLabel,
}: {
  action: (prevState: any, formData: FormData) => Promise<any>;
  defaultValues?: Partial<Lead>;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nombre *</Label>
          <Input id="name" name="name" defaultValue={defaultValues?.name} required />
        </div>
        <div>
          <Label htmlFor="company">Empresa</Label>
          <Input id="company" name="company" defaultValue={defaultValues?.company ?? ""} />
        </div>
        <div>
          <Label htmlFor="contactName">Persona de contacto</Label>
          <Input id="contactName" name="contactName" defaultValue={defaultValues?.contact_name ?? ""} />
        </div>
        <div>
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" defaultValue={defaultValues?.email ?? ""} />
        </div>
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" defaultValue={defaultValues?.phone ?? ""} />
        </div>
        <div>
          <Label htmlFor="source">Fuente</Label>
          <Input id="source" name="source" placeholder="Referido, redes, llamada..." defaultValue={defaultValues?.source ?? ""} />
        </div>
        <div>
          <Label htmlFor="stage">Etapa</Label>
          <Select id="stage" name="stage" defaultValue={defaultValues?.stage ?? "nuevo"}>
            {LEAD_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="expectedValue">Valor estimado (COP)</Label>
          <Input id="expectedValue" name="expectedValue" type="number" min={0} defaultValue={defaultValues?.expected_value ?? ""} />
        </div>
        <div>
          <Label htmlFor="nextFollowUpAt">Próximo seguimiento</Label>
          <Input
            id="nextFollowUpAt"
            name="nextFollowUpAt"
            type="date"
            defaultValue={defaultValues?.next_follow_up_at?.slice(0, 10) ?? ""}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="interest">Interés / necesidad</Label>
        <Textarea id="interest" name="interest" rows={2} defaultValue={defaultValues?.interest ?? ""} />
      </div>

      <div>
        <Label htmlFor="notes">Notas de seguimiento</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={defaultValues?.notes ?? ""} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}
