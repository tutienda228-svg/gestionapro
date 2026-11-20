"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerPayment } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PaymentForm({ invoiceId, balanceDue }: { invoiceId: string; balanceDue: number }) {
  const [amount, setAmount] = useState(String(balanceDue));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await registerPayment(invoiceId, { amount: Number(amount), paymentDate: date, paymentMethod: method, reference });
        router.refresh();
      } catch (err: any) {
        setError(err.message ?? "No pudimos registrar el pago.");
      }
    });
  }

  if (balanceDue <= 0) return null;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-5">
      <div className="col-span-2 sm:col-span-1">
        <Label>Monto</Label>
        <Input type="number" min={1} max={balanceDue} value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div>
        <Label>Fecha</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div>
        <Label>Método</Label>
        <Input placeholder="Transferencia, efectivo..." value={method} onChange={(e) => setMethod(e.target.value)} />
      </div>
      <div>
        <Label>Referencia</Label>
        <Input value={reference} onChange={(e) => setReference(e.target.value)} />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Guardando..." : "Registrar pago"}
        </Button>
      </div>
      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
