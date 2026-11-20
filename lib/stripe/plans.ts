/** Precios configurables por variable de entorno (price_id de Stripe), como pide el prompt. */
export const PLANS = [
  { key: "inicial", label: "Plan Inicial", priceId: process.env.STRIPE_PRICE_INICIAL! },
  { key: "profesional", label: "Plan Profesional", priceId: process.env.STRIPE_PRICE_PROFESIONAL! },
  { key: "empresa", label: "Plan Empresa", priceId: process.env.STRIPE_PRICE_EMPRESA! },
] as const;

export function planByPriceId(priceId: string) {
  return PLANS.find((p) => p.priceId === priceId);
}

/**
 * Límites por plan (requisito del MVP: "Plan Inicial: 1 usuario, hasta 20
 * cotizaciones y 20 facturas por mes"). `null` = sin límite.
 * Se definen aquí, en un solo lugar, para que subscription.ts los aplique
 * en el servidor y no dependan de lo que muestre la UI.
 */
export const PLAN_LIMITS: Record<string, { maxUsers: number | null; quotationsPerMonth: number | null; invoicesPerMonth: number | null }> = {
  inicial: { maxUsers: 1, quotationsPerMonth: 20, invoicesPerMonth: 20 },
  profesional: { maxUsers: 5, quotationsPerMonth: null, invoicesPerMonth: null },
  empresa: { maxUsers: null, quotationsPerMonth: null, invoicesPerMonth: null },
};

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.inicial;
}
