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
    const message =
      err instanceof Error
        ? err.message
        : "Webhook signature verification failed";

    console.error("Webhook error:", message);

    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Priorité au client_reference_id envoyé depuis le lien Stripe
    const id_bijou =
      session.client_reference_id || session.metadata?.id_bijou || null;

    // Si metadata.credits absent, on recharge 10 par défaut
    const credits = Number.parseInt(session.metadata?.credits || "10", 10);

    if (!id_bijou || !credits || credits <= 0) {
      console.error("Metadata/session invalides dans la session Stripe:", {
        sessionId: session.id,
        id_bijou,
        credits,
        client_reference_id: session.client_reference_id,
        metadata: session.metadata,
      });

      return NextResponse.json(
        { error: "Metadata invalides" },
        { status: 400 }
      );
    }

    try {
      const kind = session.metadata?.kind === "lectures" ? "lectures" : "credits";

      if (kind === "lectures") {
        // Recharge voix_enregistrees.lectures_restantes
        const { data: voix, error: fetchError } = await supabase
          .from("voix_enregistrees")
          .select("id, lectures_restantes")
          .eq("id_bijou", id_bijou)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!voix) throw new Error(`Aucune voix trouvée pour le bijou ${id_bijou}`);

        const nouvellesLectures = (voix.lectures_restantes || 0) + credits;

        const { error: updateError } = await supabase
          .from("voix_enregistrees")
          .update({ lectures_restantes: nouvellesLectures })
          .eq("id", voix.id);

        if (updateError) throw updateError;

        console.log(
          `✅ Paiement confirmé: ${credits} lectures ajoutées au bijou ${id_bijou} (total: ${nouvellesLectures})`
        );
      } else {
        // Recharge bijoux.credits_restants (murmures IA)
        const { data: bijou, error: fetchError } = await supabase
          .from("bijoux")
          .select("id_bijou, credits_restants, actif, est_active")
          .eq("id_bijou", id_bijou)
          .single();

        if (fetchError) throw fetchError;

        const nouveauxCredits = (bijou?.credits_restants || 0) + credits;

        const { error: updateError } = await supabase
          .from("bijoux")
          .update({
            credits_restants: nouveauxCredits,
            actif: true,
            est_active: true,
          })
          .eq("id_bijou", id_bijou);

        if (updateError) throw updateError;

        console.log(
          `✅ Paiement confirmé: ${credits} crédits ajoutés au bijou ${id_bijou} (total: ${nouveauxCredits})`
        );
      }

      // Optionnel : enregistrer la transaction
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          id_bijou,
          type: "recharge_ecoutes",
          credits,
          montant: session.amount_total ? session.amount_total / 100 : 0,
          stripe_session_id: session.id,
          stripe_payment_status: session.payment_status,
        });

      if (transactionError) {
        console.warn(
          "Transaction log failed (table may not exist):",
          transactionError
        );
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