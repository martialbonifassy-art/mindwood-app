import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

type RequestBody = {
  id_bijou: string;
  credits: number; // nombre d'unités à acheter
  kind?: "credits" | "lectures";
};

// Prix par package (en centimes)
const PACKAGES = {
  10: 500,  // 10 messages = 5€
  20: 1000, // 20 messages = 10€
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;

    if (!body.id_bijou) {
      return NextResponse.json(
        { error: "id_bijou manquant" },
        { status: 400 }
      );
    }

    if (!body.credits || ![10, 20].includes(body.credits)) {
      return NextResponse.json(
        { error: "Package invalide. Choisir 10 ou 20 messages." },
        { status: 400 }
      );
    }

    const kind = body.kind === "lectures" ? "lectures" : "credits";

    const amount = PACKAGES[body.credits as 10 | 20];

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    // Créer une session Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: kind === "lectures"
                ? `${body.credits} lectures Mindwood`
                : `${body.credits} messages Mindwood`,
              description: kind === "lectures"
                ? `Recharge de ${body.credits} lectures pour message enregistré`
                : `Recharge de ${body.credits} murmures personnalisés`,
              images: ["https://mindwood.art/logo.png"],
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: kind === "lectures"
        ? `${baseUrl}/recharge/success/${body.id_bijou}?session_id={CHECKOUT_SESSION_ID}`
        : `${baseUrl}/listen/${body.id_bijou}?payment=success`,
      cancel_url: `${baseUrl}/recharge/${body.id_bijou}?payment=cancelled`,
      metadata: {
        id_bijou: body.id_bijou,
        credits: body.credits.toString(),
        kind,
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error: unknown) {
    console.error("Stripe checkout error:", error);
    const message = error instanceof Error ? error.message : "Erreur Stripe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
