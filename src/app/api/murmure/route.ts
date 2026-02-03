// app/api/murmure/route.ts
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
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

function clamp(s: string, max = 160) {
  return s.length > max ? s.slice(0, max).trim() : s;
}

function safeLang(v: string): "fr" | "en" {
  const x = (v || "").toLowerCase();
  return x.startsWith("en") ? "en" : "fr";
}

function safeVoice(v: string): "masculin" | "feminin" {
  const x = (v || "").toLowerCase();
  return x.includes("masc") ? "masculin" : "feminin";
}

// Nettoyage “anti-fuite” si jamais un champ utilisateur contient des morceaux internes
function stripInternalLeak(s: string) {
  return s
    .replace(/^✨+\s*/g, "")
    .replace(/ton message\s*:?\s*/gi, "")
    .replace(/inspir[ée]?\s+par\s+/gi, "")
    .replace(/\(.*?tonalit[eé].*?\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildFR(args: {
  prenom: string;
  theme: string;
  sous: string;
  lieu: string;
  souvenir: string;
  voix: "masculin" | "feminin";
}) {
  const { prenom, theme, sous, lieu, souvenir, voix } = args;

  // Tonalité implicite (pas affichée)
  const tone =
    voix === "masculin"
      ? {
          verbs: ["garde", "pose", "ancre"],
          close: "Tu es exactement là où tu dois être.",
        }
      : {
          verbs: ["effleure", "éclaire", "réchauffe"],
          close: "Tu es exactement là où tu dois être.",
        };

  const themePart = sous ? `${theme}, ${sous}` : theme;

  const lines: string[] = [];

  // Ligne 1: accroche
  lines.push(`${prenom}, écoute.`);

  // Ligne 2: intention (sans “inspiré par”)
  lines.push(`Ce que tu traverses avec ${themePart} te ressemble plus que tu ne le crois.`);

  // Ligne 3: lieu (si présent)
  if (lieu) {
    lines.push(`Je te retrouve là, à ${lieu} — et quelque chose en toi se ${tone.verbs[2]}.`);
  }

  // Ligne 4: souvenir (si présent)
  if (souvenir) {
    lines.push(`Je garde ce souvenir : “${souvenir}”. Il te rappelle que tu sais déjà avancer.`);
  }

  // Ligne 5: fermeture
  lines.push(`Respire. ${tone.close}`);

  return lines.join(" ");
}

function buildEN(args: {
  prenom: string;
  theme: string;
  sous: string;
  lieu: string;
  souvenir: string;
  voix: "masculin" | "feminin";
}) {
  const { prenom, theme, sous, lieu, souvenir, voix } = args;

  const tone =
    voix === "masculin"
      ? { close: "You are exactly where you need to be." }
      : { close: "You are exactly where you need to be." };

  const themePart = sous ? `${theme}, ${sous}` : theme;

  const lines: string[] = [];
  lines.push(`${prenom}, listen.`);
  lines.push(`What you’re living through with ${themePart} fits you more than you think.`);

  if (lieu) {
    lines.push(`I find you there, in ${lieu} — and something in you settles into place.`);
  }

  if (souvenir) {
    lines.push(`I keep this memory: “${souvenir}”. It reminds you that you already know how to move forward.`);
  }

  lines.push(`Breathe. ${tone.close}`);

  return lines.join(" ");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    const prenomRaw = clamp(clean(body.prenom) || "toi", 60);
    const themeRaw = clamp(clean(body.theme) || "ton chemin", 80);
    const sousRaw = clamp(clean(body.sous_theme), 80);
    const lieuRaw = clamp(clean(body.lieu), 120);
    const souvenirRaw = clamp(clean(body.souvenir), 180);

    // anti-fuite (si un champ contient du paramétrage)
    const prenom = stripInternalLeak(prenomRaw) || "toi";
    const theme = stripInternalLeak(themeRaw) || "ton chemin";
    const sous = stripInternalLeak(sousRaw);
    const lieu = stripInternalLeak(lieuRaw);
    const souvenir = stripInternalLeak(souvenirRaw);

    const langue = safeLang(clean(body.langue));
    const voix = safeVoice(clean(body.voix));

    const text = langue === "en"
      ? buildEN({ prenom, theme, sous, lieu, souvenir, voix })
      : buildFR({ prenom, theme, sous, lieu, souvenir, voix });

    // dernier garde-fou : pas de titres/emoji/parenthèses explicatives
    const finalText = stripInternalLeak(text).replace(/\s{2,}/g, " ").trim();

    return NextResponse.json({ text: finalText });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur génération texte.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}