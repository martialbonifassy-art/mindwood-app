import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

type RequestBody = {
  id_bijou: string;
  credits: number; // nombre de crédits à acheter
};

// Prix par crédit (en centimes)
const PRICE_PER_CREDIT = 100; // 1€ par crédit

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;

    if (!body.id_bijou) {
      return NextResponse.json(
        { error: "id_bijou manquant" },
        { status: 400 }
      );
    }

    if (!body.credits || body.credits <= 0) {
      return NextResponse.json(
        { error: "Nombre de crédits invalide" },
        { status: 400 }
      );
    }

    const amount = body.credits * PRICE_PER_CREDIT;

    // Créer une session Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${body.credits} message${body.credits > 1 ? "s" : ""} Mindwood`,
              description: `Recharge de ${body.credits} murmure${body.credits > 1 ? "s" : ""} personnalisé${body.credits > 1 ? "s" : ""}`,
              images: ["https://mindwood.art/logo.png"], // à remplacer par votre logo
            },
            unit_amount: PRICE_PER_CREDIT,
          },
          quantity: body.credits,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/listen/${body.id_bijou}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/setup/${body.id_bijou}?payment=cancelled`,
      metadata: {
        id_bijou: body.id_bijou,
        credits: body.credits.toString(),
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
