import { NextResponse } from "next/server";
import OpenAI from "openai";

type Body = {
  prenom?: string;
  theme?: string;
  sous_theme?: string;
  lieu?: string;
  souvenir?: string;
  langue?: "fr" | "en" | string;
  voix?: "masculin" | "feminin" | string;
};

function clean(v: any) {
  return String(v ?? "").trim();
}

function normalizeLang(langue: string) {
  const l = clean(langue).toLowerCase();
  return l.startsWith("en") ? "en" : "fr";
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateMessage(params: {
  prenom: string;
  theme: string;
  sous_theme: string;
  lieu: string;
  souvenir: string;
  langue: string;
}): Promise<string> {
  const { prenom, theme, sous_theme, lieu, souvenir, langue } = params;

  const systemPrompt =
    langue === "en"
      ? `You are a poetic and wise message creator. Generate a short, elegant, personal message (5-7 sentences) that suggests meaning without being literal. The message should be:
- Poetic and evocative
- Never mention the theme/subtheme by name
- Use "you" to address the person
- Be authentic and touching
- 5-7 concise sentences maximum`
      : `Tu es un créateur de messages poétiques et sages. Génère un message court, élégant et personnel (5-7 phrases) qui suggère le sens sans être littéral. Le message doit :
- Être poétique et évocateur
- Ne jamais citer le thème/sous-thème par leur nom
- Utiliser le tutoiement
- Être authentique et touchant
- 5-7 phrases concises maximum`;

  const userPrompt =
    langue === "en"
      ? `Create a personal message for ${prenom}.
Theme context (do not mention explicitly): ${theme}
Subtheme (do not mention explicitly): ${sous_theme}
${lieu ? `Place of significance: ${lieu}` : ""}
${souvenir ? `Memory context: ${souvenir}` : ""}

Generate an elegant, poetic message that captures the essence of these themes without naming them directly. Start with "${prenom},"`
      : `Crée un message personnel pour ${prenom}.
Contexte thématique (ne pas mentionner explicitement) : ${theme}
Sous-thème (ne pas mentionner explicitement) : ${sous_theme}
${lieu ? `Lieu significatif : ${lieu}` : ""}
${souvenir ? `Contexte de souvenir : ${souvenir}` : ""}

Génère un message élégant et poétique qui capture l'essence de ces thèmes sans les nommer directement. Commence par "${prenom},"`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.9,
      max_tokens: 300,
    });

    const text = completion.choices[0]?.message?.content?.trim() || "";
    
    // Ensure it starts with the prenom
    if (!text.startsWith(prenom)) {
      return `${prenom}, ${text}`;
    }
    
    return text;
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    // Fallback message
    return langue === "en"
      ? `${prenom}, you are exactly where you need to be. Trust the path ahead.`
      : `${prenom}, tu es exactement là où tu dois être. Fais confiance au chemin devant toi.`;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    const prenom = clean(body.prenom) || "toi";
    const theme = clean(body.theme) || "";
    const sous_theme = clean(body.sous_theme) || "";
    const lieu = clean(body.lieu) || "";
    const souvenir = clean(body.souvenir) || "";
    const langue = normalizeLang(body.langue || "fr");

    const text = await generateMessage({
      prenom,
      theme,
      sous_theme,
      lieu,
      souvenir,
      langue,
    });

    return NextResponse.json({ text });
  } catch (e: any) {
    console.error("Error in murmure route:", e);
    return NextResponse.json(
      { error: e?.message ?? "Erreur génération texte." },
      { status: 500 }
    );
  }
}
