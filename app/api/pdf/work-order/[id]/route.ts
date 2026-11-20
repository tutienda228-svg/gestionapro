import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { renderWorkOrderPdf } from "@/lib/pdf/work-order-pdf";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const current = await getCurrentOrg();
  if (!current) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const supabase = createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*, clients(name), project_tasks(title, status), project_time_entries(date, hours, activity_description), project_materials(name, quantity, unit)")
    .eq("id", params.id)
    .eq("organization_id", current.organization.id)
    .single();

  if (!project) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const pdf = await renderWorkOrderPdf({
    organization: current.organization as any,
    project,
    client: project.clients,
    tasks: project.project_tasks ?? [],
    timeEntries: project.project_time_entries ?? [],
    materials: project.project_materials ?? [],
  });

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="orden-trabajo-${project.id}.pdf"`,
    },
  });
}
