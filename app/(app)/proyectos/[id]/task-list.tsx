"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTask, updateTaskStatus, deleteTask } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  done: "Hecha",
  blocked: "Bloqueada",
};

export function TaskList({
  projectId,
  tasks,
  canOperate,
}: {
  projectId: string;
  tasks: any[];
  canOperate: boolean;
}) {
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      await addTask(projectId, { title });
      setTitle("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      {tasks.length === 0 ? (
        <p className="p-4 text-sm text-neutral-500">Aún no hay tareas.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 p-3">
              <div>
                <p className={`text-sm ${t.status === "done" ? "text-neutral-400 line-through" : ""}`}>{t.title}</p>
              </div>
              {canOperate ? (
                <div className="flex items-center gap-2">
                  <select
                    defaultValue={t.status}
                    className="rounded-lg border border-neutral-300 px-2 py-1 text-xs"
                    onChange={(e) =>
                      startTransition(async () => {
                        await updateTaskStatus(projectId, t.id, e.target.value);
                        router.refresh();
                      })
                    }
                  >
                    {Object.entries(STATUS_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <button
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => startTransition(async () => { await deleteTask(projectId, t.id); router.refresh(); })}
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <span className="text-xs text-neutral-500">{STATUS_LABEL[t.status]}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {canOperate && (
        <form onSubmit={handleAdd} className="flex gap-2 border-t border-neutral-100 p-3">
          <Input
            placeholder="Nueva tarea..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isPending} variant="secondary">
            Agregar
          </Button>
        </form>
      )}
    </div>
  );
}
