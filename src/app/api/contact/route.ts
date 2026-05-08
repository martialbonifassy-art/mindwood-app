import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

type ContactPayload = {
  companyType?: string;
  quantity?: string;
  personalization?: string;
  nfcContent?: string;
  timeline?: string;
  contactDetails?: string;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function buildEmailText(payload: Required<ContactPayload>) {
  return [
    "Nouvelle demande entreprises Grain Atelier",
    "",
    `Type d'entreprise ou d'événement : ${payload.companyType}`,
    `Nombre d'objets souhaités : ${payload.quantity}`,
    `Personnalisation envisagée : ${payload.personalization}`,
    `Contenu associé à la puce NFC : ${payload.nfcContent}`,
    `Délai souhaité : ${payload.timeline}`,
    `Coordonnées : ${payload.contactDetails}`,
  ].join("\n");
}

function buildEmailHtml(payload: Required<ContactPayload>) {
  const rows = [
    ["Type d'entreprise ou d'événement", payload.companyType],
    ["Nombre d'objets souhaités", payload.quantity],
    ["Personnalisation envisagée", payload.personalization],
    ["Contenu associé à la puce NFC", payload.nfcContent],
    ["Délai souhaité", payload.timeline],
    ["Coordonnées", payload.contactDetails],
  ];

  return `
    <div style="font-family: Georgia, serif; background:#f7f0e6; padding:32px; color:#2e2019;">
      <div style="max-width:720px; margin:0 auto; background:#fffaf4; border:1px solid #dbc19f; border-radius:24px; padding:32px;">
        <p style="margin:0; font-size:12px; letter-spacing:0.28em; text-transform:uppercase; color:#a67a47;">Grain Atelier</p>
        <h1 style="margin:16px 0 8px; font-size:32px; line-height:1.2;">Nouvelle demande entreprises</h1>
        <p style="margin:0 0 24px; font-size:16px; line-height:1.7; color:#5a4638;">Une demande a été envoyée depuis la page entreprises.</p>
        <table style="width:100%; border-collapse:collapse;">
          <tbody>
            ${rows
              .map(
                ([label, value]) => `
                  <tr>
                    <td style="padding:14px 0; vertical-align:top; width:36%; border-top:1px solid #eadbc8; font-weight:700; color:#6c533f;">${label}</td>
                    <td style="padding:14px 0; vertical-align:top; border-top:1px solid #eadbc8; line-height:1.7; color:#2e2019;">${value}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as ContactPayload;

    const payload: Required<ContactPayload> = {
      companyType: clean(body.companyType),
      quantity: clean(body.quantity) || "-",
      personalization: clean(body.personalization) || "-",
      nfcContent: clean(body.nfcContent) || "-",
      timeline: clean(body.timeline) || "-",
      contactDetails: clean(body.contactDetails),
    };

    if (!payload.companyType || !payload.contactDetails) {
      return NextResponse.json(
        {
          success: false,
          error: "Merci de préciser au minimum votre projet et vos coordonnées.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.CONTACT_FROM_EMAIL || "Grain Atelier <onboarding@resend.dev>";
    const to = process.env.CONTACT_TO_EMAIL || "contact@grainatelier.fr";

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Le formulaire n'est pas encore configuré pour l'envoi des emails.",
        },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    await resend.emails.send({
      from,
      to: [to],
      subject: "Nouvelle demande entreprises - Grain Atelier",
      text: buildEmailText(payload),
      html: buildEmailHtml(payload),
    });

    return NextResponse.json({
      success: true,
      message: "Merci. Votre demande a bien été envoyée à Grain Atelier.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de l'envoi de votre demande.",
      },
      { status: 500 }
    );
  }
}