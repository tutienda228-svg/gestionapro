/**
 * Datos semilla de ejemplo. Usa el cliente admin (service_role) porque crea
 * un usuario real en auth.users (no se puede hacer con SQL plano de forma
 * segura). Ejecutar con: npm run seed
 *
 * Requiere las mismas variables de NEXT_PUBLIC_SUPABASE_URL y
 * SUPABASE_SERVICE_ROLE_KEY que usa la app (cárgalas desde .env.local).
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_EMAIL = "demo@gestionapro.local";
const DEMO_PASSWORD = "DemoPass123!";

async function main() {
  console.log("Creando usuario demo...");
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Usuario Demo" },
  });
  if (createError && !createError.message.includes("already registered")) throw createError;

  const userId =
    created?.user?.id ??
    (await admin.auth.admin.listUsers()).data.users.find((u) => u.email === DEMO_EMAIL)?.id;
  if (!userId) throw new Error("No se pudo determinar el usuario demo.");

  console.log("Creando organización demo...");
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name: "Soluciones Llanero SAS", slug: `llanero-${Date.now()}`, email: DEMO_EMAIL, phone: "3001234567" })
    .select("id")
    .single();
  if (orgError) throw orgError;

  await admin.from("organization_members").insert({
    organization_id: org.id,
    user_id: userId,
    role: "owner",
    status: "active",
    joined_at: new Date().toISOString(),
  });

  console.log("Creando clientes de ejemplo...");
  const { data: clients } = await admin
    .from("clients")
    .insert([
      { organization_id: org.id, name: "Transportes del Llano SAS", email: "contacto@transporteslallano.co", phone: "3111111111" },
      { organization_id: org.id, name: "Ferretería Casanare", email: "ventas@ferreteriacasanare.co", phone: "3222222222" },
    ])
    .select("id, name");

  console.log("Creando prospecto de ejemplo...");
  await admin.from("leads").insert({
    organization_id: org.id,
    name: "Hotel Bosques de Yopal",
    company: "Hotel Bosques de Yopal",
    stage: "contactado",
    expected_value: 3500000,
    next_follow_up_at: new Date(Date.now() + 3 * 86400000).toISOString(),
  });

  if (clients && clients[0]) {
    console.log("Creando cotización de ejemplo...");
    const { data: numberData } = await admin.rpc("next_quotation_number", { org: org.id });
    const { data: quotation } = await admin
      .from("quotations")
      .insert({
        organization_id: org.id,
        client_id: clients[0].id,
        quotation_number: numberData,
        title: "Mantenimiento preventivo de flota",
        subtotal: 1500000,
        tax_rate: 19,
        tax_amount: 285000,
        total: 1785000,
        status: "sent",
      })
      .select("id")
      .single();

    if (quotation) {
      await admin.from("quotation_items").insert({
        quotation_id: quotation.id,
        description: "Mantenimiento preventivo (3 vehículos)",
        quantity: 3,
        unit: "vehículo",
        unit_price: 500000,
        total: 1500000,
      });
    }
  }

  console.log("\nListo. Inicia sesión con:");
  console.log(`  correo: ${DEMO_EMAIL}`);
  console.log(`  contraseña: ${DEMO_PASSWORD}`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
