import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getLocaleFromHost, type Locale } from "@/lib/i18n";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

const COPY: Record<Locale, {
  missingSessionId: string;
  paymentNotConfirmed: string;
  invalidMetadata: string;
  stripeError: string;
}> = {
  fr: {
    missingSessionId: "sessionId manquant",
    paymentNotConfirmed: "Paiement non confirmé",
    invalidMetadata: "Metadata invalides",
    stripeError: "Erreur Stripe",
  },
  en: {
    missingSessionId: "Missing sessionId",
    paymentNotConfirmed: "Payment not confirmed",
    invalidMetadata: "Invalid metadata",
    stripeError: "Stripe error",
  },
};

export async function POST(req: Request) {
  const locale = getLocaleFromHost(req.headers.get("host"));
  const c = COPY[locale];

  try {
    const { sessionId } = (await req.json()) as { sessionId?: string };

    if (!sessionId) {
      return NextResponse.json({ error: c.missingSessionId }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: c.paymentNotConfirmed }, { status: 400 });
    }

    const id_bijou = session.metadata?.id_bijou;
    const credits = parseInt(session.metadata?.credits || "0", 10);
    const kind = session.metadata?.kind === "lectures" ? "lectures" : "credits";

    if (!id_bijou || !credits) {
      return NextResponse.json({ error: c.invalidMetadata }, { status: 400 });
    }

    // Idempotency: if this session was already processed, return current value without updating
    const { data: existing } = await supabase
      .from("transactions")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Already processed — just return current state
      if (kind === "lectures") {
        const { data: voix } = await supabase
          .from("voix_enregistrees")
          .select("lectures_restantes")
          .eq("id_bijou", id_bijou)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        return NextResponse.json({ ok: true, kind, total: voix?.lectures_restantes ?? 0, idempotent: true });
      }
      const { data: bijou } = await supabase
        .from("bijoux")
        .select("credits_restants")
        .eq("id_bijou", id_bijou)
        .maybeSingle();
      return NextResponse.json({ ok: true, kind, total: bijou?.credits_restants ?? 0, idempotent: true });
    }

    if (kind === "lectures") {
      const { data: voix, error: fetchError } = await supabase
        .from("voix_enregistrees")
        .select("id,lectures_restantes")
        .eq("id_bijou", id_bijou)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (fetchError) throw fetchError;

      const nouvellesLectures = (voix?.lectures_restantes || 0) + credits;

      const { error: updateError } = await supabase
        .from("voix_enregistrees")
        .update({ lectures_restantes: nouvellesLectures })
        .eq("id", voix.id);

      if (updateError) throw updateError;

      await supabase.from("transactions").insert({
        id_bijou,
        type: "recharge_lectures",
        credits,
        stripe_session_id: sessionId,
        stripe_payment_status: session.payment_status,
      }).then(() => {/* log only, errors non-blocking */});

      await supabase
        .from("bijou_usage_events")
        .insert({
          bijou_id: id_bijou,
          event_type: "recharge",
          delta: credits,
          metadata: {
            kind,
            source: "stripe_confirm",
            stripe_session_id: sessionId,
          },
        })
        .then(() => {/* log only, errors non-blocking */});

      return NextResponse.json({ ok: true, kind, total: nouvellesLectures });
    }

    const { data: bijou, error: fetchError } = await supabase
      .from("bijoux")
      .select("credits_restants")
      .eq("id_bijou", id_bijou)
      .single();

    if (fetchError) throw fetchError;

    const nouveauxCredits = (bijou?.credits_restants || 0) + credits;

    const { error: updateError } = await supabase
      .from("bijoux")
      .update({ credits_restants: nouveauxCredits, actif: true })
      .eq("id_bijou", id_bijou);

    if (updateError) throw updateError;

    await supabase.from("transactions").insert({
      id_bijou,
      type: "recharge_credits",
      credits,
      stripe_session_id: sessionId,
      stripe_payment_status: session.payment_status,
    }).then(() => {/* log only, errors non-blocking */});

    await supabase
      .from("bijou_usage_events")
      .insert({
        bijou_id: id_bijou,
        event_type: "recharge",
        delta: credits,
        metadata: {
          kind,
          source: "stripe_confirm",
          stripe_session_id: sessionId,
        },
      })
      .then(() => {/* log only, errors non-blocking */});

    return NextResponse.json({ ok: true, kind, total: nouveauxCredits });
  } catch (error: unknown) {
    console.error("Stripe confirm error:", error);
    return NextResponse.json({ error: c.stripeError }, { status: 500 });
  }
}