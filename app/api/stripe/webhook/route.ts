import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { planByPriceId } from "@/lib/stripe/plans";

export const runtime = "nodejs"; // necesario para verificar la firma con el body crudo

/**
 * Webhook de Stripe: ÚNICA fuente de verdad para activar, renovar, suspender
 * o cancelar una suscripción. Verifica la firma con STRIPE_WEBHOOK_SECRET
 * antes de confiar en cualquier dato del payload (requisito de seguridad).
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Firma inválida: ${err.message}` }, { status: 400 });
  }

  const admin = createAdminClient();

  async function updateOrgBySubscription(subscription: Stripe.Subscription) {
    const priceId = subscription.items.data[0]?.price.id;
    const plan = priceId ? planByPriceId(priceId)?.key : undefined;

    const statusMap: Record<Stripe.Subscription.Status, string> = {
      trialing: "trialing",
      active: "active",
      past_due: "past_due",
      canceled: "canceled",
      unpaid: "past_due",
      incomplete: "incomplete",
      incomplete_expired: "canceled",
      paused: "canceled",
    };

    await admin
      .from("organizations")
      .update({
        stripe_subscription_id: subscription.id,
        subscription_status: statusMap[subscription.status] ?? "incomplete",
        ...(plan ? { plan } : {}),
      })
      .eq("stripe_customer_id", subscription.customer as string);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        await updateOrgBySubscription(subscription);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      await updateOrgBySubscription(event.data.object as Stripe.Subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await admin
        .from("organizations")
        .update({ subscription_status: "canceled" })
        .eq("stripe_customer_id", subscription.customer as string);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await admin
        .from("organizations")
        .update({ subscription_status: "past_due" })
        .eq("stripe_customer_id", invoice.customer as string);
      break;
    }
    default:
      break; // otros eventos se ignoran intencionalmente
  }

  return NextResponse.json({ received: true });
}
