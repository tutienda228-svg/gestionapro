"use client";

import { useTransition } from "react";
import { deleteLead } from "../actions";
import { Button } from "@/components/ui/button";

export function DeleteLeadButton({ leadId }: { leadId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="danger"
      disabled={isPending}
      onClick={() => {
        if (confirm("¿Eliminar este prospecto? Esta acción no se puede deshacer.")) {
          startTransition(() => deleteLead(leadId));
        }
      }}
    >
      {isPending ? "Eliminando..." : "Eliminar prospecto"}
    </Button>
  );
}
