"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProjectStatus } from "../actions";
import { Select } from "@/components/ui/select";

const LABEL: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  paused: "Pausado",
  completed: "Completado",
  cancelled: "Cancelado",
};

export function StatusSelect({
  projectId,
  status,
  canOperate,
}: {
  projectId: string;
  status: string;
  canOperate: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!canOperate) {
    return <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs">{LABEL[status]}</span>;
  }

  return (
    <Select
      defaultValue={status}
      disabled={isPending}
      className="w-44"
      onChange={(e) =>
        startTransition(async () => {
          await updateProjectStatus(projectId, e.target.value);
          router.refresh();
        })
      }
    >
      {Object.entries(LABEL).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </Select>
  );
}
