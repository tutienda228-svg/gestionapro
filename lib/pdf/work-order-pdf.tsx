import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { formatCOP } from "@/lib/utils/currency";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 4 },
  muted: { color: "#666", marginBottom: 2 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  table: { borderWidth: 1, borderColor: "#e5e5e5" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e5e5" },
  cellHeader: { padding: 6, fontWeight: 700, backgroundColor: "#f5f5f5", flex: 1 },
  cell: { padding: 6, flex: 1 },
});

export type WorkOrderPdfData = {
  organization: { name: string };
  project: { name: string; description?: string | null; status: string; start_date?: string | null; due_date?: string | null; budget?: number | null };
  client: { name: string };
  tasks: { title: string; status: string }[];
  timeEntries: { date: string; hours: number; activity_description?: string | null }[];
  materials: { name: string; quantity: number; unit?: string | null }[];
};

function WorkOrderDocument({ organization, project, client, tasks, timeEntries, materials }: WorkOrderPdfData) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.muted}>{organization.name}</Text>
        <Text style={styles.title}>Orden de trabajo — {project.name}</Text>
        <Text style={styles.muted}>Cliente: {client.name}</Text>
        {project.start_date && <Text style={styles.muted}>Inicio: {project.start_date}</Text>}
        {project.due_date && <Text style={styles.muted}>Entrega: {project.due_date}</Text>}
        {project.budget != null && <Text style={styles.muted}>Presupuesto: {formatCOP(project.budget)}</Text>}
        {project.description && <Text style={{ marginTop: 8 }}>{project.description}</Text>}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tareas</Text>
          <View style={styles.table}>
            {tasks.length === 0 && <Text style={{ padding: 6 }}>Sin tareas registradas.</Text>}
            {tasks.map((t, i) => (
              <View style={styles.row} key={i}>
                <Text style={styles.cell}>{t.title}</Text>
                <Text style={styles.cell}>{t.status}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horas registradas</Text>
          <View style={styles.table}>
            {timeEntries.length === 0 && <Text style={{ padding: 6 }}>Sin horas registradas.</Text>}
            {timeEntries.map((t, i) => (
              <View style={styles.row} key={i}>
                <Text style={styles.cell}>{t.date}</Text>
                <Text style={styles.cell}>{t.hours} h</Text>
                <Text style={styles.cell}>{t.activity_description ?? ""}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Materiales</Text>
          <View style={styles.table}>
            {materials.length === 0 && <Text style={{ padding: 6 }}>Sin materiales registrados.</Text>}
            {materials.map((m, i) => (
              <View style={styles.row} key={i}>
                <Text style={styles.cell}>{m.name}</Text>
                <Text style={styles.cell}>
                  {m.quantity} {m.unit ?? ""}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function renderWorkOrderPdf(data: WorkOrderPdfData): Promise<Buffer> {
  return renderToBuffer(<WorkOrderDocument {...data} />);
}
