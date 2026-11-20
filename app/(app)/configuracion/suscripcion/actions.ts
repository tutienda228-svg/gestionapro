"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg, requireRole } from "@/lib/auth/get-current-org";
import { stripe } from "@/lib/stripe/client";

export async function startCheckout(priceId: string) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner"]); // solo el owner administra la suscripción

  const supabase = createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_customer_id, email")
    .eq("id", current.organization.id)
    .single();

  let customerId = org?.stripe_customer_id as string | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: org?.email || undefined,
      metadata: { organization_id: current.organization.id },
    });
    customerId = customer.id;
    await supabase.from("organizations").update({ stripe_customer_id: customerId }).eq("id", current.organization.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { trial_period_days: 14 },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/configuracion/suscripcion?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/configuracion/suscripcion?checkout=cancelled`,
    metadata: { organization_id: current.organization.id },
  });

  redirect(session.url!);
}

export async function openBillingPortal() {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No autenticado.");
  requireRole(current.role, ["owner"]);

  const supabase = createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", current.organization.id)
    .single();

  if (!org?.stripe_customer_id) throw new Error("Esta organización aún no tiene una suscripción en Stripe.");

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/configuracion/suscripcion`,
  });

  redirect(session.url);
}
