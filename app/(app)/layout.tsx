import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/dashboard", label: "Panel" },
  { href: "/clientes", label: "Clientes" },
  { href: "/prospectos", label: "Prospectos" },
  { href: "/cotizaciones", label: "Cotizaciones" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/facturacion", label: "Facturación" },
  { href: "/reportes", label: "Reportes" },
  { href: "/configuracion", label: "Configuración" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentOrg();
  if (!current) redirect("/onboarding");

  const trialOrPastDue =
    current.organization.subscription_status === "past_due" ||
    current.organization.subscription_status === "canceled";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar escritorio */}
      <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white p-4 md:flex md:flex-col">
        <div className="mb-6 px-2">
          <p className="font-semibold">{current.organization.name}</p>
          <p className="text-xs uppercase tracking-wide text-neutral-400">{current.role}</p>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={signOut}>
          <Button variant="ghost" className="w-full justify-start" type="submit">
            Cerrar sesión
          </Button>
        </form>
      </aside>

      {/* Topbar móvil */}
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white p-4 md:hidden">
        <p className="font-semibold">{current.organization.name}</p>
        <form action={signOut}>
          <Button variant="ghost" type="submit">
            Salir
          </Button>
        </form>
      </header>

      <main className="flex-1 pb-20 md:pb-0">
        {trialOrPastDue && (
          <div className="bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Tu suscripción está vencida o suspendida. Puedes consultar tus datos, pero no crear
            nuevas cotizaciones o facturas. <Link href="/configuracion/suscripcion" className="underline">Regularizar</Link>
          </div>
        )}
        <div className="p-4 md:p-8">{children}</div>
      </main>

      {/* Nav inferior móvil */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-neutral-200 bg-white py-2 md:hidden">
        {NAV.slice(0, 5).map((item) => (
          <Link key={item.href} href={item.href} className="px-2 py-1 text-xs text-neutral-600">
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
