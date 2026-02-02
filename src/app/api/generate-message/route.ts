import { NextResponse } from "next/server";

type Payload = {
  id_bijou: string;
  langue?: "fr" | "en";
  prenom?: string | null;
  lieu?: string | null;
  souvenir?: string | null;
  theme?: string | null;
  sous_theme?: string | null;
  voix?: "masculin" | "feminin" | string | null;
};

function clean(v?: string | null) {
  return (v ?? "").trim();
}

function makeMessageFR(p: Payload) {
  const prenom = clean(p.prenom) || "toi";
  const theme = clean(p.theme) || "un thème";
  const sous = clean(p.sous_theme);
  const lieu = clean(p.lieu);
  const souvenir = clean(p.souvenir);
  const voix = clean(p.voix);

  const tone =
    voix === "masculin"
      ? "posé, profond, protecteur"
      : "doux, enveloppant, lumineux";

  const parts: string[] = [];
  parts.push(`✨ ${prenom},`);
  parts.push(`un murmure inspiré par **${theme}${sous ? " / " + sous : ""}**.`);
  if (lieu) parts.push(`Je te retrouve dans ce lieu : **${lieu}**.`);
  if (souvenir) parts.push(`Et je garde ce souvenir : “${souvenir}”.`);
  parts.push(`Respire. Tu es exactement là où tu dois être.`);
  parts.push(`(Ton message a une tonalité ${tone}.)`);

  return parts.join(" ");
}

function makeMessageEN(p: Payload) {
  const prenom = clean(p.prenom) || "you";
  const theme = clean(p.theme) || "a theme";
  const sous = clean(p.sous_theme);
  const lieu = clean(p.lieu);
  const souvenir = clean(p.souvenir);
  const voix = clean(p.voix);

  const tone =
    voix === "masculin"
      ? "calm, deep, protective"
      : "soft, warm, luminous";

  const parts: string[] = [];
  parts.push(`✨ ${prenom},`);
  parts.push(`a whisper inspired by **${theme}${sous ? " / " + sous : ""}**.`);
  if (lieu) parts.push(`I find you again in this place: **${lieu}**.`);
  if (souvenir) parts.push(`And I keep this memory: “${souvenir}”.`);
  parts.push(`Breathe. You are exactly where you need to be.`);
  parts.push(`(Your message has a ${tone} tone.)`);

  return parts.join(" ");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;

    if (!body?.id_bijou) {
      return NextResponse.json(
        { error: "id_bijou manquant" },
        { status: 400 }
      );
    }

    const langue = body.langue === "en" ? "en" : "fr";

    const message = langue === "en" ? makeMessageEN(body) : makeMessageFR(body);

    return NextResponse.json({ message });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Erreur API" },
      { status: 500 }
    );
  }
}