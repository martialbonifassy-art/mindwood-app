import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Signature manquante" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error("Webhook error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Gérer l'événement
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const id_bijou = session.metadata?.id_bijou;
    const credits = parseInt(session.metadata?.credits || "0", 10);

    if (!id_bijou || !credits) {
      console.error("Metadata manquantes dans la session Stripe:", session.id);
      return NextResponse.json(
        { error: "Metadata invalides" },
        { status: 400 }
      );
    }

    // Ajouter les crédits au bijou
    try {
      const { data: bijou, error: fetchError } = await supabase
        .from("bijoux")
        .select("credits_restants")
        .eq("id_bijou", id_bijou)
        .single();

      if (fetchError) throw fetchError;

      const nouveauxCredits = (bijou?.credits_restants || 0) + credits;

      const { error: updateError } = await supabase
        .from("bijoux")
        .update({ 
          credits_restants: nouveauxCredits,
          actif: true // Réactiver le bijou si nécessaire
        })
        .eq("id_bijou", id_bijou);

      if (updateError) throw updateError;

      console.log(
        `✅ Paiement confirmé: ${credits} crédits ajoutés au bijou ${id_bijou} (total: ${nouveauxCredits})`
      );

      // Optionnel: Enregistrer la transaction
      const { error: transactionError } = await supabase.from("transactions").insert({
        id_bijou,
        type: "recharge",
        credits,
        montant: session.amount_total ? session.amount_total / 100 : 0,
        stripe_session_id: session.id,
        stripe_payment_status: session.payment_status,
      });
      
      if (transactionError) {
        // Ne pas faire échouer si la table transactions n'existe pas
        console.warn("Transaction log failed (table may not exist):", transactionError);
      }

    } catch (error: unknown) {
      console.error("Erreur lors de l'ajout des crédits:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'ajout des crédits" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
