import Link from "next/link";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { title: "Cotiza en minutos", desc: "Crea cotizaciones profesionales con ítems, impuestos y descuentos, y envíalas por correo con un enlace para que tu cliente acepte." },
  { title: "Controla tus proyectos", desc: "Convierte una cotización aceptada en una orden de trabajo, asigna tareas y registra horas y materiales." },
  { title: "No pierdas ni un pago", desc: "Genera cuentas de cobro, registra pagos parciales y envía recordatorios automáticos a tus clientes." },
  { title: "Todo en tu celular", desc: "Diseñado mobile-first para que revises tus ventas, proyectos y cartera desde donde estés." },
];

const PLANS = [
  { name: "Inicial", price: "$49.000/mes", features: ["1 usuario", "Hasta 20 cotizaciones/mes", "Hasta 20 facturas/mes"] },
  { name: "Profesional", price: "$99.000/mes", features: ["Hasta 5 usuarios", "Proyectos y reportes", "Recordatorios de pago"], highlighted: true },
  { name: "Empresa", price: "$179.000/mes", features: ["Usuarios ilimitados", "Roles avanzados", "Soporte prioritario"] },
];

export default function LandingPage() {
  return (
    <div className="bg-white text-neutral-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-semibold">GestionaPro</span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-neutral-600 hover:text-neutral-900">
            Ingresar
          </Link>
          <Link href="/registro">
            <Button>Prueba gratis 14 días</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Cotiza, ejecuta y cobra, todo en un solo lugar
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-neutral-600">
          GestionaPro es el sistema de gestión comercial y cobros para pymes de servicios en
          Yopal y Casanare: consultoras, agencias, contratistas, talleres y transportadoras.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/registro">
            <Button>Empezar gratis</Button>
          </Link>
          <Link href="/precios">
            <Button variant="secondary">Ver planes</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 py-10 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-neutral-200 p-6">
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-neutral-600">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="bg-neutral-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-semibold">Planes simples, sin letra pequeña</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl border p-6 ${p.highlighted ? "border-primary shadow-md" : "border-neutral-200"}`}
              >
                <h3 className="font-semibold">{p.name}</h3>
                <p className="mt-1 text-2xl font-bold">{p.price}</p>
                <ul className="mt-4 space-y-1 text-sm text-neutral-600">
                  {p.features.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
                <Link href="/registro" className="mt-6 block">
                  <Button className="w-full" variant={p.highlighted ? "primary" : "secondary"}>
                    Elegir {p.name}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-neutral-400">
            14 días de prueba gratis en cualquier plan, sin tarjeta de crédito.
          </p>
        </div>
      </section>

      <footer className="border-t border-neutral-200 py-8 text-center text-sm text-neutral-400">
        GestionaPro — Yopal, Casanare, Colombia
      </footer>
    </div>
  );
}
