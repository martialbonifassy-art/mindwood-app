import { NextResponse } from "next/server";

type Body = {
  prenom?: string;
  theme?: string;
  sous_theme?: string;
  lieu?: string;
  souvenir?: string;
  langue?: "fr" | "en" | string;
  voix?: "masculin" | "feminin" | string;
};

function clean(v: unknown) {
  return String(v ?? "").trim();
}

function clamp(s: string, max = 120) {
  return s.length > max ? s.slice(0, max) : s;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    const prenom = clamp(clean(body.prenom) || "toi", 60);
    const theme = clamp(clean(body.theme) || "un joli thème", 80);
    const sous = clamp(clean(body.sous_theme), 80);
    const lieu = clamp(clean(body.lieu), 120);
    const souvenir = clamp(clean(body.souvenir), 180);
    const langue = (clean(body.langue) || "fr").toLowerCase();
    const voix = (clean(body.voix) || "feminin").toLowerCase();

    const voiceTone =
      voix.includes("masc")
        ? "Tonalité posée, profonde, protectrice."
        : "Tonalité douce, enveloppante, lumineuse.";

    const fr =
      `✨ ${prenom}, un murmure inspiré par ${theme}${sous ? " / " + sous : ""}. ` +
      (lieu ? `Je te retrouve dans ce lieu : ${lieu}. ` : "") +
      (souvenir ? `Et je garde ce souvenir : “${souvenir}”. ` : "") +
      `Respire. Tu es exactement là où tu dois être. (${voiceTone})`;

    const en =
      `✨ ${prenom}, a whisper inspired by ${theme}${sous ? " / " + sous : ""}. ` +
      (lieu ? `I find you in this place: ${lieu}. ` : "") +
      (souvenir ? `And I keep this memory: “${souvenir}”. ` : "") +
      `Breathe. You are exactly where you need to be. (${voiceTone})`;

    return NextResponse.json({ text: (langue === "en" ? en : fr).trim() });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur génération texte.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}