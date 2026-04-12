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
  lecturesLabel: string;
  messagesLabel: string;
  lecturesDescription: (credits: number) => string;
  messagesDescription: (credits: number) => string;
}> = {
  fr: {
    missingId: "id_bijou manquant",
    invalidPackage: "Package invalide. Choisir 10 ou 20 messages.",
    stripeError: "Erreur Stripe",
    lecturesLabel: "lectures",
    messagesLabel: "messages",
    lecturesDescription: (credits: number) =>
      `Recharge de ${credits} lectures pour message enregistre`,
    messagesDescription: (credits: number) =>
      `Recharge de ${credits} murmures personnalises`,
  },
  en: {
    missingId: "Missing id_bijou",
    invalidPackage: "Invalid package. Choose 10 or 20 messages.",
    stripeError: "Stripe error",
    lecturesLabel: "listens",
    messagesLabel: "messages",
    lecturesDescription: (credits: number) =>
      `${credits} listens top-up for recorded message`,
    messagesDescription: (credits: number) =>
      `${credits} custom whispers top-up`,
  },
};

type RequestBody = {
  id_bijou: string;
  credits: number; // nombre d'unités à acheter
  kind?: "credits" | "lectures";
  locale?: Locale;
};

// Prices per package in minor units (cents)
const PACKAGES = {
  10: 500,
  20: 1000,
};

const LECTURES_10_PRICE_IDS: Record<Locale, string> = {
  fr: "price_1TLOKSGvq1rLwXShAP1eJs3e",
  en: "price_1TLOKxGvq1rLwXShrJGHgbm6",
};

export async function POST(req: Request) {
  const baseHeaderHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
  let locale: Locale = getLocaleFromHost(baseHeaderHost);
  let c = COPY[locale];

  try {
    const body = (await req.json()) as RequestBody;

    const headerHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const originHost = req.headers.get("origin") ? new URL(req.headers.get("origin")!).host : null;
    const refererHost = req.headers.get("referer") ? new URL(req.headers.get("referer")!).host : null;
    const requestHost = new URL(req.url).host;

    const localeFromBody = body.locale === "en" || body.locale === "fr" ? body.locale : null;
    const localeFromHeaders =
      getLocaleFromHost(headerHost) === "en" ||
      getLocaleFromHost(originHost) === "en" ||
      getLocaleFromHost(refererHost) === "en" ||
      getLocaleFromHost(requestHost) === "en"
        ? "en"
        : "fr";

    locale = localeFromBody ?? localeFromHeaders;
    c = COPY[locale];

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

    const reqUrl = new URL(req.url);
    const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const forwardedProto = req.headers.get("x-forwarded-proto") || reqUrl.protocol.replace(":", "");
    const requestOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : reqUrl.origin;
    const baseUrl = requestOrigin || process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : reqUrl.origin);

    const stripeLocale: Stripe.Checkout.SessionCreateParams.Locale =
      locale === "en" ? "en" : "fr";
    const stripeCurrency: "usd" | "eur" =
      locale === "en" ? "usd" : "eur";

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem =
      kind === "lectures" && body.credits === 10
        ? {
            price: LECTURES_10_PRICE_IDS[locale],
            quantity: 1,
          }
        : {
            price_data: {
              currency: stripeCurrency,
              product_data: {
                name: kind === "lectures"
                  ? `${body.credits} ${c.lecturesLabel} Mindwood`
                  : `${body.credits} ${c.messagesLabel} Mindwood`,
                description: kind === "lectures"
                  ? c.lecturesDescription(body.credits)
                  : c.messagesDescription(body.credits),
                images: ["https://mindwood.art/logo.png"],
              },
              unit_amount: amount,
            },
            quantity: 1,
          };

    // Créer une session Checkout
    const session = await stripe.checkout.sessions.create({
      locale: stripeLocale,
      payment_method_types: ["card"],
      line_items: [lineItem],
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
