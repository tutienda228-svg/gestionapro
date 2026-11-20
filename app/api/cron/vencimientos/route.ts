import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Job diario (Vercel Cron) que marca como "overdue" las facturas enviadas o
 * con pago parcial cuya fecha de vencimiento ya pasó. Protegido con un
 * secreto para que no sea invocable públicamente.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("mark_overdue_invoices");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
