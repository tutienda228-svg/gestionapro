import { Button } from "@/components/ui/button";

export default function ReportesPage() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const label = now.toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold">Reportes</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Las cotizaciones, órdenes de trabajo y facturas se descargan en PDF desde su propio
        detalle. Aquí puedes generar el reporte mensual consolidado.
      </p>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
        <p className="font-medium">Reporte mensual — {label}</p>
        <p className="mt-1 text-sm text-neutral-500">Ventas, costos de proyectos y estado de cartera del mes en curso.</p>
        <a href={`/api/pdf/monthly-report?month=${currentMonth}`} target="_blank" rel="noreferrer" className="mt-4 inline-block">
          <Button>Descargar reporte del mes actual</Button>
        </a>
      </div>
    </div>
  );
}
