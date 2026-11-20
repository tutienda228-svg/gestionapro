import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderQuotationPdf } from "@/lib/pdf/quotation-pdf";

/** PDF público de una cotización, accesible solo con su token impredecible. */
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const admin = createAdminClient();

  const { data: quotation } = await admin
    .from("quotations")
    .select("*, clients(name, email), quotation_items(*), organizations(name, nit_or_tax_id, phone, email)")
    .eq("public_token", params.token)
    .single();

  if (!quotation) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const pdf = await renderQuotationPdf({
    organization: quotation.organizations,
    quotation,
    client: quotation.clients,
    items: quotation.quotation_items,
  });

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quotation.quotation_number}.pdf"`,
    },
  });
}
