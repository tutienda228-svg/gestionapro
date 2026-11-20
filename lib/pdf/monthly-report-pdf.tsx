import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { formatCOP } from "@/lib/utils/currency";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 4 },
  muted: { color: "#666", marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 16, marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  label: { color: "#666" },
  bold: { fontWeight: 700 },
});

export type MonthlyReportData = {
  organization: { name: string };
  monthLabel: string;
  ventasTotales: number;
  costosMateriales: number;
  costosManoObra: number;
  totalPorCobrar: number;
  facturasVencidas: number;
  cotizacionesEnviadas: number;
  cotizacionesAceptadas: number;
};

function MonthlyReportDocument(d: MonthlyReportData) {
  const costosTotales = d.costosMateriales + d.costosManoObra;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.muted}>{d.organization.name}</Text>
        <Text style={styles.title}>Reporte mensual — {d.monthLabel}</Text>

        <Text style={styles.sectionTitle}>Ventas</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Ventas totales facturadas</Text>
          <Text>{formatCOP(d.ventasTotales)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Cotizaciones enviadas</Text>
          <Text>{d.cotizacionesEnviadas}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Cotizaciones aceptadas</Text>
          <Text>{d.cotizacionesAceptadas}</Text>
        </View>

        <Text style={styles.sectionTitle}>Costos de proyectos</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Materiales</Text>
          <Text>{formatCOP(d.costosMateriales)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Mano de obra</Text>
          <Text>{formatCOP(d.costosManoObra)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.bold}>Total costos</Text>
          <Text style={styles.bold}>{formatCOP(costosTotales)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Cartera</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Total por cobrar</Text>
          <Text>{formatCOP(d.totalPorCobrar)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Facturas vencidas</Text>
          <Text>{d.facturasVencidas}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderMonthlyReportPdf(data: MonthlyReportData): Promise<Buffer> {
  return renderToBuffer(<MonthlyReportDocument {...data} />);
}
