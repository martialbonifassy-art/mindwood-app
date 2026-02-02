import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const prenom = String(body?.prenom ?? "toi");
  const theme = String(body?.theme ?? "un joli thème");
  const sous = String(body?.sous_theme ?? "");
  const lieu = String(body?.lieu ?? "");
  const souvenir = String(body?.souvenir ?? "");
  const langue = String(body?.langue ?? "fr");
  const voix = String(body?.voix ?? "feminin");

  const voiceTone =
    voix === "masculin"
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
}