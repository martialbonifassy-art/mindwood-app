import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getLocaleFromHost, type Locale } from "@/lib/i18n";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

const COPY: Record<Locale, {
  missingId: string;
  invalidPackage: string;
  stripeError: string;
}> = {
  fr: {
    missingId: "id_bijou manquant",
    invalidPackage: "Package invalide. Choisir 10 ou 20 messages.",
    stripeError: "Erreur Stripe",
  },
  en: {
    missingId: "Missing id_bijou",
    invalidPackage: "Invalid package. Choose 10 or 20 messages.",
    stripeError: "Stripe error",
  },
};

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
  const locale = getLocaleFromHost(req.headers.get("host"));
  const c = COPY[locale];

  try {
    const body = (await req.json()) as RequestBody;

    if (!body.id_bijou) {
      return NextResponse.json(
        { error: c.missingId },
        { status: 400 }
      );
    }

    if (!body.credits || ![10, 20].includes(body.credits)) {
      return NextResponse.json(
        { error: c.invalidPackage },
        { status: 400 }
      );
    }

    const kind = body.kind === "lectures" ? "lectures" : "credits";

    const amount = PACKAGES[body.credits as 10 | 20];

    const requestOrigin = new URL(req.url).origin;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : requestOrigin);

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
      success_url: `${baseUrl}/recharge/success/${body.id_bijou}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: kind === "lectures"
        ? `${baseUrl}/recharge/${body.id_bijou}?payment=cancelled`
        : `${baseUrl}/listen/${body.id_bijou}/murmure?payment=cancelled`,
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
    return NextResponse.json({ error: c.stripeError }, { status: 500 });
  }
}
