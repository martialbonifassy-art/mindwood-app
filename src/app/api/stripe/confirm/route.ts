import { NextResponse } from "next/server";
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
  try {
    const { sessionId } = (await req.json()) as { sessionId?: string };

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId manquant" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Paiement non confirmé" }, { status: 400 });
    }

    const id_bijou = session.metadata?.id_bijou;
    const credits = parseInt(session.metadata?.credits || "0", 10);
    const kind = session.metadata?.kind === "lectures" ? "lectures" : "credits";

    if (!id_bijou || !credits) {
      return NextResponse.json({ error: "Metadata invalides" }, { status: 400 });
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

    return NextResponse.json({ ok: true, kind, total: nouveauxCredits });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur Stripe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}