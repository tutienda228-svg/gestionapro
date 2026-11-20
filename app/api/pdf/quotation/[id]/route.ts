import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { renderQuotationPdf } from "@/lib/pdf/quotation-pdf";

/** PDF de una cotización para un usuario autenticado de la organización (RLS aplica). */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const current = await getCurrentOrg();
  if (!current) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const supabase = createClient();
  const { data: quotation } = await supabase
    .from("quotations")
    .select("*, clients(name, email), quotation_items(*)")
    .eq("id", params.id)
    .eq("organization_id", current.organization.id)
    .single();

  if (!quotation) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const pdf = await renderQuotationPdf({
    organization: current.organization as any,
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
