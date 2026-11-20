import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { createProject } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default async function NuevoProyectoPage({ searchParams }: { searchParams: { error?: string } }) {
  const current = await getCurrentOrg();
  if (!current) return null;

  const supabase = createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("organization_id", current.organization.id)
    .order("name");

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold">Nuevo proyecto</h1>
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        {searchParams.error && <p className="mb-4 text-sm text-red-600">{searchParams.error}</p>}
        <form action={createProject} className="space-y-4">
          <div>
            <Label htmlFor="clientId">Cliente *</Label>
            <Select id="clientId" name="clientId" defaultValue="" required>
              <option value="" disabled>
                Selecciona un cliente
              </option>
              {(clients ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="name">Nombre del proyecto *</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Fecha de inicio</Label>
              <Input id="startDate" name="startDate" type="date" />
            </div>
            <div>
              <Label htmlFor="dueDate">Fecha de entrega</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
          </div>
          <div>
            <Label htmlFor="budget">Presupuesto (COP)</Label>
            <Input id="budget" name="budget" type="number" min={0} />
          </div>
          <Button type="submit">Crear proyecto</Button>
        </form>
      </div>
    </div>
  );
}
