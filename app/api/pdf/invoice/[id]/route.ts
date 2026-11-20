import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { renderInvoicePdf } from "@/lib/pdf/invoice-pdf";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const current = await getCurrentOrg();
  if (!current) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const supabase = createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, clients(name), invoice_items(*)")
    .eq("id", params.id)
    .eq("organization_id", current.organization.id)
    .single();

  if (!invoice) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const pdf = await renderInvoicePdf({
    organization: current.organization as any,
    invoice,
    client: invoice.clients,
    items: invoice.invoice_items,
  });

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoice_number}.pdf"`,
    },
  });
}
