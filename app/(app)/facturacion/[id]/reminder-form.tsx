"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendReminderNow, scheduleReminder } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ReminderForm({ invoiceId }: { invoiceId: string }) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [message, setMessage] = useState("Te recordamos tu saldo pendiente. ¡Gracias por tu pago oportuno!");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => startTransition(async () => { await sendReminderNow(invoiceId); router.refresh(); })}
        >
          Enviar recordatorio ahora
        </Button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        <Textarea rows={1} value={message} onChange={(e) => setMessage(e.target.value)} className="flex-1" />
        <Button
          type="button"
          disabled={isPending || !scheduledAt}
          onClick={() =>
            startTransition(async () => {
              await scheduleReminder(invoiceId, new Date(scheduledAt).toISOString(), message);
              setScheduledAt("");
              router.refresh();
            })
          }
        >
          Programar
        </Button>
      </div>
    </div>
  );
}
