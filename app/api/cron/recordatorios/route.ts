import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";

/**
 * Job (Vercel Cron, ej. cada hora) que envía los recordatorios de pago
 * programados cuya fecha ya llegó y aún están en estado "pending".
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: reminders } = await admin
    .from("reminders")
    .select("id, message, invoices(invoice_number, clients(name, email))")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .limit(50);

  let sent = 0;
  for (const r of reminders ?? []) {
    const invoice = Array.isArray(r.invoices) ? r.invoices[0] : r.invoices;
    const client = invoice ? (Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients) : null;

    if (client?.email) {
      await sendEmail({
        to: client.email,
        subject: `Recordatorio de pago — Factura ${invoice?.invoice_number ?? ""}`,
        html: `<p>Hola ${client.name ?? ""},</p><p>${r.message ?? "Tienes un saldo pendiente."}</p>`,
      });
      sent++;
    }

    await admin.from("reminders").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", r.id);
  }

  return NextResponse.json({ ok: true, processed: reminders?.length ?? 0, sent });
}
