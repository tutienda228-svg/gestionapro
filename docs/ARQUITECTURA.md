# GestionaPro (nombre temporal) — Arquitectura del MVP

## 1. Arquitectura del sistema

```
┌─────────────────────────────┐
│        Navegador (PWA)       │
│  Next.js App Router + React  │
│  Tailwind + shadcn/ui        │
└───────────────┬──────────────┘
                │ fetch / Server Actions
┌───────────────▼──────────────┐
│   Next.js (Vercel) - Server  │
│  - Server Components          │
│  - Route Handlers (/api/*)    │
│  - Server Actions (mutaciones)│
│  - Middleware (sesión/org)    │
└───────┬───────────────┬──────┘
        │               │
┌───────▼──────┐  ┌─────▼───────────┐
│   Supabase    │  │     Stripe       │
│ - Postgres    │  │ - Checkout       │
│ - Auth        │  │ - Webhooks       │
│ - Storage     │  │ - Customer Portal│
│ - RLS         │  └─────────────────┘
└───────┬───────┘
        │
┌───────▼───────┐
│  Resend/Postmark│  (correos: invitaciones, cotizaciones, recordatorios)
└────────────────┘
```

**Principios clave**
- Toda consulta a Supabase pasa por RLS: el aislamiento por `organization_id` se garantiza en la base de datos, no solo en el código de la app (defensa en profundidad).
- El cliente Supabase en el navegador usa la clave `anon`; nunca se expone la `service_role`. La `service_role` solo se usa en Route Handlers del servidor para tareas puntuales (webhooks de Stripe, jobs de vencimiento de facturas).
- El `organization_id` activo se resuelve en el servidor (sesión + membresía), nunca se confía en un valor enviado desde el cliente.
- Multi-tenant "pooled": una sola base de datos, aislamiento lógico vía RLS (no schema-per-tenant), adecuado para el volumen esperado de pymes.

## 2. Modelo de base de datos

Ver `schema.sql` para el script completo (tablas, índices, triggers, políticas RLS). Resumen de relaciones:

```
organizations 1─N organization_members N─1 users
organizations 1─N clients
organizations 1─N leads
clients 1─N quotations N─1 leads (opcional)
quotations 1─N quotation_items
quotations 1─1 projects (al convertir)
projects 1─N project_tasks
projects 1─N project_time_entries
projects 1─N project_materials
organizations 1─N invoices N─1 clients / projects (opcional)
invoices 1─N invoice_items
invoices 1─N payments
invoices 1─N reminders
organizations 1─N activity_logs
```

**Decisiones de diseño del esquema**
- Todas las tablas "de negocio" llevan `organization_id` (incluso cuando también se pueda inferir por una relación, para que el RLS sea directo y barato de evaluar).
- `organization_members.role` usa un `enum`: `owner`, `admin`, `comercial`, `operativo`, `readonly`.
- Los saldos (`balance_due`) y estados derivados (`overdue`) se recalculan con *triggers*, no se confían al cliente.
- `quotation_number` e `invoice_number` se generan con una función + secuencia por organización (para que cada empresa vea su propia numeración consecutiva: COT-0001, FAC-0001).

## 3. Estructura de carpetas

```
gestionapro/
├─ app/
│  ├─ (marketing)/
│  │  ├─ page.tsx                  # landing
│  │  └─ precios/page.tsx
│  ├─ (auth)/
│  │  ├─ login/page.tsx
│  │  ├─ registro/page.tsx
│  │  ├─ recuperar/page.tsx
│  │  └─ callback/route.ts         # OAuth/verify callback de Supabase
│  ├─ onboarding/page.tsx          # crear organización
│  ├─ (app)/                        # rutas protegidas, requieren sesión + org activa
│  │  ├─ layout.tsx                 # sidebar/topbar, selector de organización
│  │  ├─ dashboard/page.tsx
│  │  ├─ clientes/
│  │  │  ├─ page.tsx
│  │  │  └─ [id]/page.tsx
│  │  ├─ prospectos/
│  │  │  ├─ page.tsx
│  │  │  └─ [id]/page.tsx
│  │  ├─ cotizaciones/
│  │  │  ├─ page.tsx
│  │  │  ├─ nueva/page.tsx
│  │  │  └─ [id]/page.tsx
│  │  ├─ proyectos/
│  │  │  ├─ page.tsx
│  │  │  └─ [id]/page.tsx
│  │  ├─ facturacion/
│  │  │  ├─ page.tsx
│  │  │  └─ [id]/page.tsx
│  │  ├─ reportes/page.tsx
│  │  └─ configuracion/
│  │     ├─ empresa/page.tsx
│  │     ├─ usuarios/page.tsx
│  │     ├─ plantillas/page.tsx
│  │     └─ suscripcion/page.tsx
│  ├─ p/[token]/page.tsx           # vista pública de cotización (sin login)
│  └─ api/
│     ├─ stripe/webhook/route.ts
│     ├─ cron/vencimientos/route.ts
│     └─ cron/recordatorios/route.ts
├─ components/
│  ├─ ui/                           # shadcn/ui
│  ├─ dashboard/
│  ├─ quotations/
│  ├─ invoices/
│  └─ shared/
├─ lib/
│  ├─ supabase/
│  │  ├─ client.ts                  # cliente browser
│  │  ├─ server.ts                  # cliente server (cookies)
│  │  └─ admin.ts                   # service_role, solo server
│  ├─ stripe/
│  │  ├─ client.ts
│  │  └─ plans.ts
│  ├─ pdf/
│  │  ├─ quotation-pdf.tsx
│  │  ├─ invoice-pdf.tsx
│  │  └─ work-order-pdf.tsx
│  ├─ validations/                  # esquemas Zod
│  ├─ auth/
│  │  └─ get-current-org.ts
│  └─ utils/
│     └─ currency.ts                # formato COP
├─ supabase/
│  ├─ migrations/
│  │  └─ 0001_init.sql
│  └─ seed.sql
├─ emails/                          # plantillas React Email
├─ middleware.ts                    # refresca sesión Supabase
├─ .env.example
└─ package.json
```

## 4. Plan de implementación por fases

| Fase | Contenido | Entregable |
|---|---|---|
| 1 | Auth, organizaciones, invitaciones, roles, RLS | SQL + middleware + onboarding + gestión de usuarios |
| 2 | Clientes y prospectos (CRM simple) | CRUD + etapas de venta |
| 3 | Cotizaciones | CRUD, ítems, PDF, link público, aceptar/rechazar, convertir a proyecto |
| 4 | Proyectos / órdenes de trabajo | Tareas, horas, materiales, avance |
| 5 | Facturas, pagos, cartera | CRUD, pagos parciales, vencidos automáticos |
| 6 | Dashboard | KPIs + gráficos Recharts |
| 7 | PDF y recordatorios | Generación PDF + cron de recordatorios + Resend |
| 8 | Suscripciones Stripe | Checkout, webhook, bloqueo por vencimiento |
| 9 | Reportes y pulido UX | Reporte mensual, estados vacíos, accesibilidad móvil |

**Siguiente paso recomendado:** generar la Fase 1 completa (SQL de `organizations`, `users`, `organization_members`, políticas RLS, middleware de sesión/organización activa, onboarding y pantalla de usuarios/roles).
