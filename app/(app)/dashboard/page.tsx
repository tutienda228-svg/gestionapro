import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { formatCOP } from "@/lib/utils/currency";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";

function monthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
  return { start, end };
}

export default async function DashboardPage() {
  const current = await getCurrentOrg();
  if (!current) return null;

  const supabase = createClient();
  const orgId = current.organization.id;
  const { start: monthStart, end: monthEnd } = monthRange(0);

  const [
    { data: invoicesThisMonth },
    { data: quotationCounts },
    { count: activeProjects },
    { data: receivableInvoices },
    { count: overdueCount },
    { data: payments6m },
    { data: upcomingFollowUps },
    { data: upcomingDue },
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select("total")
      .eq("organization_id", orgId)
      .gte("issue_date", monthStart.toISOString().slice(0, 10))
      .lt("issue_date", monthEnd.toISOString().slice(0, 10)),
    supabase.from("quotations").select("status").eq("organization_id", orgId),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .in("status", ["pending", "in_progress", "paused"]),
    supabase
      .from("invoices")
      .select("balance_due")
      .eq("organization_id", orgId)
      .in("status", ["sent", "partially_paid", "overdue"]),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "overdue"),
    supabase
      .from("payments")
      .select("amount, payment_date")
      .eq("organization_id", orgId)
      .gte("payment_date", monthRange(5).start.toISOString().slice(0, 10)),
    supabase
      .from("leads")
      .select("id, name, next_follow_up_at")
      .eq("organization_id", orgId)
      .not("next_follow_up_at", "is", null)
      .gte("next_follow_up_at", new Date().toISOString())
      .order("next_follow_up_at")
      .limit(5),
    supabase
      .from("invoices")
      .select("id, invoice_number, due_date, balance_due, clients(name)")
      .eq("organization_id", orgId)
      .gt("balance_due", 0)
      .not("due_date", "is", null)
      .order("due_date")
      .limit(5),
  ]);

  const ventasDelMes = (invoicesThisMonth ?? []).reduce((acc, i: any) => acc + Number(i.total), 0);
  const enviadas = (quotationCounts ?? []).filter((q: any) => q.status === "sent").length;
  const aceptadas = (quotationCounts ?? []).filter((q: any) => q.status === "accepted").length;
  const rechazadas = (quotationCounts ?? []).filter((q: any) => q.status === "rejected").length;
  const totalPorCobrar = (receivableInvoices ?? []).reduce((acc, i: any) => acc + Number(i.balance_due), 0);

  const monthLabels = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
  });
  const chartData = monthLabels.map((label, i) => {
    const { start, end } = monthRange(5 - i);
    const total = (payments6m ?? [])
      .filter((p: any) => {
        const d = new Date(p.payment_date);
        return d >= start && d < end;
      })
      .reduce((acc: number, p: any) => acc + Number(p.amount), 0);
    return { month: label, total };
  });

  return (
    <div>
      <h1 className="text-xl font-semibold">Panel</h1>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Ventas del mes" value={formatCOP(ventasDelMes)} />
        <KpiCard label="Cotizaciones enviadas" value={String(enviadas)} />
        <KpiCard label="Cotizaciones aceptadas" value={String(aceptadas)} accent="green" />
        <KpiCard label="Cotizaciones rechazadas" value={String(rechazadas)} accent="red" />
        <KpiCard label="Proyectos activos" value={String(activeProjects ?? 0)} />
        <KpiCard label="Total por cobrar" value={formatCOP(totalPorCobrar)} />
      </div>

      {(overdueCount ?? 0) > 0 && (
        <p className="mt-3 text-sm text-red-600">
          Tienes {overdueCount} factura{overdueCount === 1 ? "" : "s"} vencida{overdueCount === 1 ? "" : "s"}.{" "}
          <Link href="/facturacion?status=overdue" className="underline">
            Ver facturas vencidas
          </Link>
        </p>
      )}

      <div className="mt-6">
        <RevenueChart data={chartData} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="mb-2 text-sm font-medium text-neutral-700">Próximos seguimientos</p>
          {!upcomingFollowUps || upcomingFollowUps.length === 0 ? (
            <p className="text-sm text-neutral-400">Sin seguimientos programados.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {upcomingFollowUps.map((l: any) => (
                <li key={l.id} className="flex justify-between">
                  <Link href={`/prospectos/${l.id}`} className="text-primary hover:underline">
                    {l.name}
                  </Link>
                  <span className="text-neutral-500">{new Date(l.next_follow_up_at).toLocaleDateString("es-CO")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="mb-2 text-sm font-medium text-neutral-700">Próximos cobros</p>
          {!upcomingDue || upcomingDue.length === 0 ? (
            <p className="text-sm text-neutral-400">Sin cobros próximos.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {upcomingDue.map((inv: any) => (
                <li key={inv.id} className="flex justify-between">
                  <Link href={`/facturacion/${inv.id}`} className="text-primary hover:underline">
                    {inv.invoice_number} — {inv.clients?.name}
                  </Link>
                  <span className="text-neutral-500">{formatCOP(inv.balance_due)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
