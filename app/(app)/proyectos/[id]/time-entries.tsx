"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTimeEntry, deleteTimeEntry } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCOP } from "@/lib/utils/currency";

export function TimeEntries({
  projectId,
  entries,
  canOperate,
}: {
  projectId: string;
  entries: any[];
  canOperate: boolean;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");
  const [rate, setRate] = useState("");
  const [desc, setDesc] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!hours) return;
    startTransition(async () => {
      await addTimeEntry(projectId, { date, hours: Number(hours), hourlyRate: rate ? Number(rate) : null, activityDescription: desc });
      setHours("");
      setDesc("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      {entries.length === 0 ? (
        <p className="p-4 text-sm text-neutral-500">Sin horas registradas.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Horas</th>
              <th className="px-3 py-2 font-medium">Actividad</th>
              <th className="px-3 py-2 font-medium">Costo</th>
              {canOperate && <th></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="px-3 py-2">{new Date(e.date).toLocaleDateString("es-CO")}</td>
                <td className="px-3 py-2">{e.hours}</td>
                <td className="px-3 py-2 text-neutral-600">{e.activity_description || "—"}</td>
                <td className="px-3 py-2">{formatCOP(e.total_cost ?? 0)}</td>
                {canOperate && (
                  <td className="px-3 py-2 text-right">
                    <button
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => startTransition(async () => { await deleteTimeEntry(projectId, e.id); router.refresh(); })}
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
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input type="number" min={0.25} step={0.25} placeholder="Horas" value={hours} onChange={(e) => setHours(e.target.value)} />
          <Input type="number" min={0} placeholder="Valor hora" value={rate} onChange={(e) => setRate(e.target.value)} />
          <Input placeholder="Actividad" value={desc} onChange={(e) => setDesc(e.target.value)} className="sm:col-span-1" />
          <Button type="submit" disabled={isPending} variant="secondary">
            Registrar
          </Button>
        </form>
      )}
    </div>
  );
}
