"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCOP } from "@/lib/utils/currency";
import { computeInvoiceTotals, type InvoiceInput } from "@/lib/validations/invoices";

type ItemRow = { description: string; quantity: number; unit: string; unitPrice: number };
type Option = { id: string; name: string };

const emptyItem: ItemRow = { description: "", quantity: 1, unit: "", unitPrice: 0 };

export function InvoiceForm({
  clients,
  projects,
  defaultValues,
  onSubmit,
  submitLabel,
}: {
  clients: Option[];
  projects: Option[];
  defaultValues?: Partial<InvoiceInput> & { items?: ItemRow[] };
  onSubmit: (input: InvoiceInput) => Promise<void>;
  submitLabel: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState(defaultValues?.clientId ?? clients[0]?.id ?? "");
  const [projectId, setProjectId] = useState(defaultValues?.projectId ?? "");
  const [issueDate, setIssueDate] = useState(defaultValues?.issueDate ?? new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(defaultValues?.dueDate ?? "");
  const [taxRate, setTaxRate] = useState(defaultValues?.taxRate ?? 0);
  const [paymentTerms, setPaymentTerms] = useState(defaultValues?.paymentTerms ?? "");
  const [notes, setNotes] = useState(defaultValues?.notes ?? "");
  const [items, setItems] = useState<ItemRow[]>(defaultValues?.items?.length ? defaultValues.items : [emptyItem]);

  const totals = computeInvoiceTotals(items as any, taxRate);

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await onSubmit({
          clientId,
          projectId: projectId || null,
          issueDate,
          dueDate,
          taxRate: Number(taxRate),
          paymentTerms,
          notes,
          items: items.map((it) => ({ ...it, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
        } as InvoiceInput);
      } catch (err: any) {
        setError(err.message ?? "Ocurrió un error inesperado.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Cliente *</Label>
          <Select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
            <option value="" disabled>
              Selecciona un cliente
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Proyecto (opcional)</Label>
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">Sin proyecto asociado</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Fecha de emisión *</Label>
          <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
        </div>
        <div>
          <Label>Fecha de vencimiento</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div>
          <Label>IVA (%)</Label>
          <Input type="number" min={0} max={100} value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
        </div>
        <div>
          <Label>Términos de pago</Label>
          <Input placeholder="Ej: contado, 30 días..." value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
        </div>
      </div>

      <div>
        <Label>Notas</Label>
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Ítems</Label>
          <Button type="button" variant="secondary" onClick={() => setItems((p) => [...p, { ...emptyItem }])}>
            + Agregar ítem
          </Button>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 rounded-lg border border-neutral-200 p-2">
              <Input
                className="col-span-5"
                placeholder="Descripción"
                value={item.description}
                onChange={(e) => updateItem(i, { description: e.target.value })}
              />
              <Input
                className="col-span-2"
                type="number"
                min={0}
                placeholder="Cant."
                value={item.quantity}
                onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
              />
              <Input
                className="col-span-2"
                placeholder="Unidad"
                value={item.unit}
                onChange={(e) => updateItem(i, { unit: e.target.value })}
              />
              <Input
                className="col-span-2"
                type="number"
                min={0}
                placeholder="Precio"
                value={item.unitPrice}
                onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })}
              />
              <button
                type="button"
                onClick={() => setItems((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))}
                className="col-span-1 text-sm text-red-600 hover:underline"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-500">Subtotal</span>
          <span>{formatCOP(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">IVA</span>
          <span>{formatCOP(totals.taxAmount)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatCOP(totals.total)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
