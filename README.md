# GestionaPro — MVP completo

SaaS multiempresa de gestión comercial y cobros para pymes de servicios
(Yopal, Casanare). Construido con Next.js (App Router + TypeScript),
Supabase (Postgres + Auth + Storage + RLS), Stripe, Resend y Tailwind.

> Nombre temporal: puedes renombrar el proyecto a algo más cercano al mercado
> (ej. CobraYa, ServiGest, Cotiza y Cobra) cambiando `package.json`,
> `app/layout.tsx` y la landing en `app/(marketing)/page.tsx`.

## Qué incluye este MVP

| Módulo | Contenido |
|---|---|
| Auth y organizaciones | Registro, login, recuperación de contraseña, onboarding, invitación de usuarios, roles, RLS |
| CRM | Clientes y prospectos con etapas de venta, búsqueda, filtros, paginación |
| Cotizaciones | Ítems, IVA, descuentos, PDF, enlace público para aceptar/rechazar, conversión a proyecto |
| Proyectos | Tareas, horas, materiales, avance y costo real vs. presupuesto, PDF de orden de trabajo |
| Facturación y cartera | Ítems, pagos parciales/totales, saldo automático, vencimiento automático, recordatorios, PDF |
| Dashboard | KPIs de ventas, cotizaciones, proyectos, cartera; gráfico de ingresos; próximos seguimientos y cobros |
| Reportes | Reporte mensual (ventas, costos, cartera) en PDF |
| Suscripciones | 3 planes vía Stripe Checkout, portal de cliente, webhook verificado, bloqueo por vencimiento |
| Landing | Página comercial en español con planes |

## 1. Requisitos
- Node.js 20+
- Cuenta de Supabase
- Cuenta de Stripe (modo test sirve para todo el desarrollo)
- Cuenta de Resend (opcional en desarrollo: si no se configura, los correos solo se registran en consola)

## 2. Instalación local

```bash
npm install
cp .env.example .env.local
```

## 3. Conectar Supabase
1. Crea un proyecto en supabase.com.
2. Copia `Project URL`, `anon public` y `service_role` a `.env.local`.
3. Ejecuta la migración:
   ```bash
   npx supabase link --project-ref TU_PROJECT_REF
   npx supabase db push
   ```
   (o pega `supabase/migrations/0001_init.sql` en el SQL Editor del panel).
4. En **Authentication → URL Configuration**, agrega `http://localhost:3000/auth/callback`
   como Redirect URL.

## 4. Conectar Stripe
1. Crea 3 productos con precio recurrente mensual: Inicial, Profesional, Empresa.
2. Copia cada `price_id` a `STRIPE_PRICE_INICIAL` / `_PROFESIONAL` / `_EMPRESA`.
3. Copia tu `Secret key` a `STRIPE_SECRET_KEY`.
4. Para probar el webhook en local:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copia el `whsec_...` que te entrega a `STRIPE_WEBHOOK_SECRET`.
5. En producción, crea el webhook en el panel de Stripe apuntando a
   `https://tu-dominio.com/api/stripe/webhook`, escuchando al menos:
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.payment_failed`.

## 5. Conectar Resend
1. Verifica un dominio en resend.com.
2. Copia tu API key a `RESEND_API_KEY` y define `EMAIL_FROM` con ese dominio.

## 6. Cron jobs (vencimientos y recordatorios)
Ya están declarados en `vercel.json` (`/api/cron/vencimientos` diario,
`/api/cron/recordatorios` cada hora). Define `CRON_SECRET` con un valor
aleatorio largo; Vercel lo envía automáticamente como
`Authorization: Bearer <CRON_SECRET>` en cada invocación.

## 7. Correr el proyecto

```bash
npm run dev
```

## 8. Datos de ejemplo

```bash
npm run seed
```

Crea una organización demo con clientes, un prospecto y una cotización de
ejemplo, e imprime las credenciales de acceso en la consola.

## 9. Desplegar en Vercel
1. Sube el repo a GitHub e impórtalo en vercel.com.
2. Agrega todas las variables de `.env.local` en **Environment Variables**
   (marca `SUPABASE_SERVICE_ROLE_KEY` y `STRIPE_SECRET_KEY` como *sensitive*).
3. Actualiza `NEXT_PUBLIC_APP_URL` a tu dominio y agrégalo como Redirect URL
   adicional en Supabase Auth.

## 10. Lista de pruebas funcionales

### Auth, organizaciones y roles
- [ ] Registro, confirmación de correo, login y recuperación de contraseña funcionan.
- [ ] Un usuario sin organización cae en `/onboarding`; crear una lo deja como `owner`.
- [ ] Invitar usuarios con distintos roles funciona; `readonly` no ve botones de edición.
- [ ] **Aislamiento**: datos de la Organización A no son accesibles desde una sesión de la Organización B, ni por URL directa.

### CRM
- [ ] Crear/editar/eliminar clientes y prospectos respeta los roles (`comercial` no elimina).
- [ ] Búsqueda, filtros y paginación funcionan en ambos listados.
- [ ] Cambiar la etapa de un prospecto queda en su bitácora de actividad.

### Cotizaciones
- [ ] Crear una cotización calcula bien subtotal, descuento, IVA y total.
- [ ] Enviarla cambia su estado a "Enviada" y (si Resend está configurado) llega el correo con el enlace público.
- [ ] El enlace público permite aceptar o rechazar una sola vez; no se puede reabrir después.
- [ ] Una cotización aceptada se convierte en proyecto con un clic, sin duplicar el proyecto si se intenta dos veces.
- [ ] El PDF (interno y público) se descarga correctamente.

### Proyectos
- [ ] Se puede crear un proyecto manualmente o por conversión desde una cotización.
- [ ] Tareas, horas y materiales se registran y el avance (%) y costo real se recalculan.
- [ ] La orden de trabajo en PDF incluye tareas, horas y materiales.

### Facturación y cartera
- [ ] Crear una factura calcula bien subtotal, IVA y total; el saldo pendiente se actualiza solo al registrar pagos (parciales o totales).
- [ ] El estado pasa automáticamente a "Pagada" cuando el saldo llega a cero.
- [ ] El job de vencimientos marca como "Vencida" una factura enviada cuya fecha de vencimiento ya pasó (puedes invocarlo manualmente con `curl -H "Authorization: Bearer $CRON_SECRET" https://tu-dominio/api/cron/vencimientos`).
- [ ] "Enviar recordatorio ahora" y programar uno a futuro funcionan; el cron de recordatorios los envía y los marca como enviados.
- [ ] El PDF de factura muestra correctamente total, pagado y saldo.

### Dashboard y reportes
- [ ] Los KPIs del panel coinciden con los datos reales (ventas del mes, cartera, vencidas, proyectos activos).
- [ ] El gráfico de ingresos refleja los pagos registrados en los últimos 6 meses.
- [ ] El reporte mensual en PDF coincide con los números del dashboard para el mismo mes.

### Suscripciones
- [ ] Iniciar Checkout desde cada plan lleva a Stripe y, al completarse, el webhook actualiza `plan` y `subscription_status` de la organización.
- [ ] Cancelar la suscripción en el portal de Stripe deja la organización en `canceled` y bloquea la creación de nuevas cotizaciones/facturas (pero no el acceso de lectura).
- [ ] Solo el `owner` puede iniciar Checkout o abrir el portal de facturación.
- [ ] Con el Plan Inicial, al llegar a 20 cotizaciones o 20 facturas creadas en el mes, la aplicación rechaza crear una más con un mensaje claro (y lo permite de nuevo al cambiar a un plan superior). Lo mismo con el tope de 1 usuario del Plan Inicial / 5 del Plan Profesional al invitar.

## 11. Roadmap de la versión 2
Ver `ROADMAP_V2.md`.
