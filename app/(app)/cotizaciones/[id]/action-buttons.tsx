"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  sendQuotation,
  setQuotationStatusInternal,
  convertQuotationToProject,
  deleteQuotation,
} from "../actions";
import { Button } from "@/components/ui/button";

export function QuotationActionButtons({ quotationId, status }: { quotationId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function run(fn: () => Promise<any>) {
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e: any) {
        alert(e.message ?? "Ocurrió un error.");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "draft" && (
        <Button disabled={isPending} onClick={() => run(() => sendQuotation(quotationId))}>
          Enviar por correo
        </Button>
      )}
      {status === "sent" && (
        <>
          <Button disabled={isPending} onClick={() => run(() => setQuotationStatusInternal(quotationId, "accepted"))}>
            Marcar como aceptada
          </Button>
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={() => run(() => setQuotationStatusInternal(quotationId, "rejected"))}
          >
            Marcar como rechazada
          </Button>
        </>
      )}
      {status === "accepted" && (
        <Button disabled={isPending} onClick={() => run(() => convertQuotationToProject(quotationId))}>
          Convertir en proyecto
        </Button>
      )}
      {status === "draft" && (
        <Button
          variant="danger"
          disabled={isPending}
          onClick={() => {
            if (confirm("¿Eliminar esta cotización?")) run(() => deleteQuotation(quotationId));
          }}
        >
          Eliminar
        </Button>
      )}
    </div>
  );
}
