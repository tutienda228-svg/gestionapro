import Link from "next/link";

const LINKS = [
  { href: "/configuracion/empresa", label: "Datos de la empresa", desc: "Nombre, NIT, logo, contacto." },
  { href: "/configuracion/usuarios", label: "Usuarios y roles", desc: "Invita a tu equipo y controla permisos." },
  { href: "/configuracion/suscripcion", label: "Suscripción y facturación", desc: "Tu plan, método de pago y facturas." },
];

export default function ConfiguracionPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold">Configuración</h1>
      <div className="mt-6 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="block p-4 hover:bg-neutral-50">
            <p className="font-medium">{l.label}</p>
            <p className="text-sm text-neutral-500">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
