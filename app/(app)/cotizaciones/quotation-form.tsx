"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCOP } from "@/lib/utils/currency";
import { computeTotals, type QuotationInput } from "@/lib/validations/quotations";

type ItemRow = { description: string; quantity: number; unit: string; unitPrice: number };
type ClientOption = { id: string; name: string };

const emptyItem: ItemRow = { description: "", quantity: 1, unit: "", unitPrice: 0 };

export function QuotationForm({
  clients,
  defaultValues,
  onSubmit,
  submitLabel,
}: {
  clients: ClientOption[];
  defaultValues?: Partial<QuotationInput> & { items?: ItemRow[] };
  onSubmit: (input: QuotationInput) => Promise<void>;
  submitLabel: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState(defaultValues?.clientId ?? clients[0]?.id ?? "");
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [taxRate, setTaxRate] = useState(defaultValues?.taxRate ?? 19);
  const [discountAmount, setDiscountAmount] = useState(defaultValues?.discountAmount ?? 0);
  const [validUntil, setValidUntil] = useState(defaultValues?.validUntil ?? "");
  const [items, setItems] = useState<ItemRow[]>(defaultValues?.items?.length ? defaultValues.items : [emptyItem]);

  const totals = computeTotals(items as any, taxRate, discountAmount);

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }
  function removeItem(index: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await onSubmit({
          clientId,
          title,
          description,
          taxRate: Number(taxRate),
          discountAmount: Number(discountAmount),
          validUntil,
          items: items.map((it) => ({ ...it, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
        } as QuotationInput);
      } catch (err: any) {
        setError(err.message ?? "Ocurrió un error inesperado.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="clientId">Cliente *</Label>
          <Select id="clientId" value={clientId} onChange={(e) => setClientId(e.target.value)} required>
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
          <Label htmlFor="title">Título *</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="taxRate">IVA (%)</Label>
          <Input
            id="taxRate"
            type="number"
            min={0}
            max={100}
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="discountAmount">Descuento global (COP)</Label>
          <Input
            id="discountAmount"
            type="number"
            min={0}
            value={discountAmount}
            onChange={(e) => setDiscountAmount(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="validUntil">Válida hasta</Label>
          <Input id="validUntil" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Ítems</Label>
          <Button type="button" variant="secondary" onClick={addItem}>
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
                onClick={() => removeItem(i)}
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
          <span className="text-neutral-500">Descuento</span>
          <span>- {formatCOP(discountAmount)}</span>
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
