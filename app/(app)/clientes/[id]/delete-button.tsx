"use client";

import { useTransition } from "react";
import { deleteClientRecord } from "../actions";
import { Button } from "@/components/ui/button";

export function DeleteClientButton({ clientId }: { clientId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="danger"
      disabled={isPending}
      onClick={() => {
        if (confirm("¿Eliminar este cliente? Esta acción no se puede deshacer.")) {
          startTransition(() => deleteClientRecord(clientId));
        }
      }}
    >
      {isPending ? "Eliminando..." : "Eliminar cliente"}
    </Button>
  );
}
