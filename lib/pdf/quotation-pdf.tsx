import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { formatCOP } from "@/lib/utils/currency";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  orgName: { fontSize: 14, fontWeight: 700 },
  title: { fontSize: 16, marginBottom: 4 },
  muted: { color: "#666" },
  table: { marginTop: 16, borderWidth: 1, borderColor: "#e5e5e5" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e5e5" },
  cellHeader: { padding: 6, fontWeight: 700, backgroundColor: "#f5f5f5" },
  cell: { padding: 6 },
  colDesc: { width: "46%" },
  colQty: { width: "14%" },
  colPrice: { width: "20%" },
  colTotal: { width: "20%" },
  totals: { marginTop: 16, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", width: 200, marginBottom: 2 },
  totalLabel: { color: "#666" },
  totalBold: { fontWeight: 700 },
});

export type QuotationPdfData = {
  organization: { name: string; nit_or_tax_id?: string | null; phone?: string | null; email?: string | null };
  quotation: {
    quotation_number: string;
    title: string;
    description?: string | null;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total: number;
    valid_until?: string | null;
  };
  client: { name: string; email?: string | null };
  items: { description: string; quantity: number; unit?: string | null; unit_price: number; total: number }[];
};

function QuotationDocument({ organization, quotation, client, items }: QuotationPdfData) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.orgName}>{organization.name}</Text>
            {organization.nit_or_tax_id && <Text style={styles.muted}>NIT: {organization.nit_or_tax_id}</Text>}
            {organization.phone && <Text style={styles.muted}>{organization.phone}</Text>}
            {organization.email && <Text style={styles.muted}>{organization.email}</Text>}
          </View>
          <View>
            <Text style={styles.title}>Cotización {quotation.quotation_number}</Text>
            {quotation.valid_until && <Text style={styles.muted}>Válida hasta: {quotation.valid_until}</Text>}
          </View>
        </View>

        <Text style={{ marginBottom: 4 }}>{quotation.title}</Text>
        <Text style={styles.muted}>Cliente: {client.name}</Text>
        {quotation.description && <Text style={{ marginTop: 8 }}>{quotation.description}</Text>}

        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.cellHeader, styles.colDesc]}>Descripción</Text>
            <Text style={[styles.cellHeader, styles.colQty]}>Cant.</Text>
            <Text style={[styles.cellHeader, styles.colPrice]}>Precio unit.</Text>
            <Text style={[styles.cellHeader, styles.colTotal]}>Total</Text>
          </View>
          {items.map((it, i) => (
            <View style={styles.row} key={i}>
              <Text style={[styles.cell, styles.colDesc]}>{it.description}</Text>
              <Text style={[styles.cell, styles.colQty]}>
                {it.quantity} {it.unit ?? ""}
              </Text>
              <Text style={[styles.cell, styles.colPrice]}>{formatCOP(it.unit_price)}</Text>
              <Text style={[styles.cell, styles.colTotal]}>{formatCOP(it.total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text>{formatCOP(quotation.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Descuento</Text>
            <Text>- {formatCOP(quotation.discount_amount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA</Text>
            <Text>{formatCOP(quotation.tax_amount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalBold}>Total</Text>
            <Text style={styles.totalBold}>{formatCOP(quotation.total)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function renderQuotationPdf(data: QuotationPdfData): Promise<Buffer> {
  return renderToBuffer(<QuotationDocument {...data} />);
}
