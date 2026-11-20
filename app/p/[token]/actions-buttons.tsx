"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { acceptQuotationPublic, rejectQuotationPublic } from "./actions";
import { Button } from "@/components/ui/button";

export function PublicQuotationActions({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function run(fn: () => Promise<any>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e: any) {
        setError(e.message ?? "Ocurrió un error.");
      }
    });
  }

  return (
    <div>
      <div className="flex gap-3">
        <Button disabled={isPending} onClick={() => run(() => acceptQuotationPublic(token))}>
          Aceptar cotización
        </Button>
        <Button
          variant="secondary"
          disabled={isPending}
          onClick={() => run(() => rejectQuotationPublic(token))}
        >
          Rechazar
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
