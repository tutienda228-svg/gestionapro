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

export type InvoicePdfData = {
  organization: { name: string; nit_or_tax_id?: string | null; phone?: string | null; email?: string | null };
  invoice: {
    invoice_number: string;
    issue_date: string;
    due_date?: string | null;
    subtotal: number;
    tax_amount: number;
    total: number;
    amount_paid: number;
    balance_due: number;
    payment_terms?: string | null;
  };
  client: { name: string };
  items: { description: string; quantity: number; unit?: string | null; unit_price: number; total: number }[];
};

function InvoiceDocument({ organization, invoice, client, items }: InvoicePdfData) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.orgName}>{organization.name}</Text>
            {organization.nit_or_tax_id && <Text style={styles.muted}>NIT: {organization.nit_or_tax_id}</Text>}
            {organization.phone && <Text style={styles.muted}>{organization.phone}</Text>}
          </View>
          <View>
            <Text style={styles.title}>Cuenta de cobro {invoice.invoice_number}</Text>
            <Text style={styles.muted}>Emisión: {invoice.issue_date}</Text>
            {invoice.due_date && <Text style={styles.muted}>Vence: {invoice.due_date}</Text>}
          </View>
        </View>

        <Text style={styles.muted}>Cliente: {client.name}</Text>
        {invoice.payment_terms && <Text style={styles.muted}>Términos: {invoice.payment_terms}</Text>}

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
            <Text>{formatCOP(invoice.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA</Text>
            <Text>{formatCOP(invoice.tax_amount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalBold}>Total</Text>
            <Text style={styles.totalBold}>{formatCOP(invoice.total)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Pagado</Text>
            <Text>{formatCOP(invoice.amount_paid)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalBold}>Saldo</Text>
            <Text style={styles.totalBold}>{formatCOP(invoice.balance_due)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument {...data} />);
}
