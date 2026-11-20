"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMaterial, deleteMaterial } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCOP } from "@/lib/utils/currency";

export function Materials({
  projectId,
  materials,
  canOperate,
}: {
  projectId: string;
  materials: any[];
  canOperate: boolean;
}) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [supplier, setSupplier] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      await addMaterial(projectId, { name, quantity: Number(quantity), unitCost: Number(unitCost || 0), supplier });
      setName("");
      setUnitCost("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      {materials.length === 0 ? (
        <p className="p-4 text-sm text-neutral-500">Sin materiales registrados.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-3 py-2 font-medium">Material</th>
              <th className="px-3 py-2 font-medium">Cant.</th>
              <th className="px-3 py-2 font-medium">Proveedor</th>
              <th className="px-3 py-2 font-medium">Costo</th>
              {canOperate && <th></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {materials.map((m) => (
              <tr key={m.id}>
                <td className="px-3 py-2">{m.name}</td>
                <td className="px-3 py-2">
                  {m.quantity} {m.unit}
                </td>
                <td className="px-3 py-2 text-neutral-600">{m.supplier || "—"}</td>
                <td className="px-3 py-2">{formatCOP(m.total_cost ?? 0)}</td>
                {canOperate && (
                  <td className="px-3 py-2 text-right">
                    <button
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => startTransition(async () => { await deleteMaterial(projectId, m.id); router.refresh(); })}
                    >
                      Quitar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {canOperate && (
        <form onSubmit={handleAdd} className="grid grid-cols-2 gap-2 border-t border-neutral-100 p-3 sm:grid-cols-5">
          <Input placeholder="Material" value={name} onChange={(e) => setName(e.target.value)} className="sm:col-span-2" />
          <Input type="number" min={0.01} step={0.01} placeholder="Cant." value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <Input type="number" min={0} placeholder="Costo unit." value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
          <Input placeholder="Proveedor" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          <Button type="submit" disabled={isPending} variant="secondary" className="sm:col-span-5">
            Agregar material
          </Button>
        </form>
      )}
    </div>
  );
}
