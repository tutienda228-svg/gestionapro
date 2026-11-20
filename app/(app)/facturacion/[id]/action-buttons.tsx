"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendInvoice, deleteInvoice } from "../actions";
import { Button } from "@/components/ui/button";

export function InvoiceActionButtons({ invoiceId, status }: { invoiceId: string; status: string }) {
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
        <>
          <Button disabled={isPending} onClick={() => run(() => sendInvoice(invoiceId))}>
            Enviar por correo
          </Button>
          <Button
            variant="danger"
            disabled={isPending}
            onClick={() => {
              if (confirm("¿Eliminar esta factura?")) run(() => deleteInvoice(invoiceId));
            }}
          >
            Eliminar
          </Button>
        </>
      )}
    </div>
  );
}
