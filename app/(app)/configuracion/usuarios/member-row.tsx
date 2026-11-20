"use client";

import { useTransition } from "react";
import { updateMemberRole, removeMember } from "./actions";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ROLE_LABEL: Record<string, string> = {
  owner: "Propietario",
  admin: "Administrador",
  comercial: "Comercial",
  operativo: "Operativo",
  readonly: "Solo lectura",
};

export function MemberRow({
  userId,
  name,
  email,
  role,
  status,
  canManage,
  isSelfOwner,
}: {
  userId: string;
  name?: string;
  email?: string;
  role: string;
  status: string;
  canManage: boolean;
  isSelfOwner: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div>
        <p className="text-sm font-medium">{name || email}</p>
        <p className="text-xs text-neutral-500">
          {email} · {status === "invited" ? "Invitación pendiente" : "Activo"}
        </p>
      </div>

      {canManage && !isSelfOwner ? (
        <div className="flex items-center gap-2">
          <Select
            defaultValue={role}
            disabled={isPending}
            onChange={(e) => startTransition(() => updateMemberRole(userId, e.target.value))}
            className="w-40"
          >
            <option value="admin">Administrador</option>
            <option value="comercial">Comercial</option>
            <option value="operativo">Operativo</option>
            <option value="readonly">Solo lectura</option>
          </Select>
          <Button
            variant="danger"
            disabled={isPending}
            onClick={() => startTransition(() => removeMember(userId))}
          >
            Quitar
          </Button>
        </div>
      ) : (
        <span className="text-xs uppercase tracking-wide text-neutral-400">
          {ROLE_LABEL[role] ?? role}
        </span>
      )}
    </div>
  );
}
