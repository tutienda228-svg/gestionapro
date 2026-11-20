import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { renderMonthlyReportPdf } from "@/lib/pdf/monthly-report-pdf";

export async function GET(req: NextRequest) {
  const current = await getCurrentOrg();
  if (!current) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const monthParam = req.nextUrl.searchParams.get("month"); // YYYY-MM
  const now = monthParam ? new Date(`${monthParam}-01T00:00:00`) : new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthLabel = start.toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  const supabase = createClient();
  const orgId = current.organization.id;

  const [
    { data: invoicesThisMonth },
    { data: quotationsCount },
    { data: receivable },
    { count: overdueCount },
    { data: timeEntries },
    { data: materials },
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select("total")
      .eq("organization_id", orgId)
      .gte("issue_date", start.toISOString().slice(0, 10))
      .lt("issue_date", end.toISOString().slice(0, 10)),
    supabase.from("quotations").select("status").eq("organization_id", orgId),
    supabase.from("invoices").select("balance_due").eq("organization_id", orgId).in("status", ["sent", "partially_paid", "overdue"]),
    supabase.from("invoices").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "overdue"),
    supabase
      .from("project_time_entries")
      .select("total_cost, date, projects!inner(organization_id)")
      .eq("projects.organization_id", orgId)
      .gte("date", start.toISOString().slice(0, 10))
      .lt("date", end.toISOString().slice(0, 10)),
    supabase
      .from("project_materials")
      .select("total_cost, projects!inner(organization_id, created_at)")
      .eq("projects.organization_id", orgId),
  ]);

  const ventasTotales = (invoicesThisMonth ?? []).reduce((acc, i: any) => acc + Number(i.total), 0);
  const cotizacionesEnviadas = (quotationsCount ?? []).filter((q: any) => q.status === "sent").length;
  const cotizacionesAceptadas = (quotationsCount ?? []).filter((q: any) => q.status === "accepted").length;
  const totalPorCobrar = (receivable ?? []).reduce((acc, i: any) => acc + Number(i.balance_due), 0);
  const costosManoObra = (timeEntries ?? []).reduce((acc: number, t: any) => acc + Number(t.total_cost ?? 0), 0);
  const costosMateriales = (materials ?? []).reduce((acc: number, m: any) => acc + Number(m.total_cost ?? 0), 0);

  const pdf = await renderMonthlyReportPdf({
    organization: current.organization as any,
    monthLabel,
    ventasTotales,
    costosMateriales,
    costosManoObra,
    totalPorCobrar,
    facturasVencidas: overdueCount ?? 0,
    cotizacionesEnviadas,
    cotizacionesAceptadas,
  });

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="reporte-${monthParam ?? "actual"}.pdf"`,
    },
  });
}
