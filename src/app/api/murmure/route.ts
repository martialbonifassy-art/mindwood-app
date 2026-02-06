import { NextResponse } from "next/server";
import crypto from "crypto";

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

function sha1(input: string) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

function pickStable<T>(arr: T[], seed: string) {
  const h = sha1(seed);
  const n = parseInt(h.slice(0, 2), 16);
  return arr[n % arr.length];
}

function normalizeLang(langue: string) {
  const l = clean(langue).toLowerCase();
  return l.startsWith("en") ? "en" : "fr";
}

function normalizeVoice(voix: string) {
  const v = clean(voix).toLowerCase();
  return v.includes("masc") ? "masculin" : "feminin";
}

function buildFr(p: {
  prenom: string;
  theme: string;
  sous_theme: string;
  lieu: string;
  souvenir: string;
  voice: "masculin" | "feminin";
  seed: string;
}) {
  const { prenom, theme, sous_theme, lieu, souvenir, voice, seed } = p;

  const lines: string[] = [];

  // Ouverture personnalisée
  const openings = [
    `${prenom},`,
    `${prenom}, écoute.`,
    `${prenom}, un instant.`,
    `${prenom}, juste toi et moi.`,
  ];
  const opening = pickStable(openings, seed + "::opening");
  lines.push(opening);

  // Construction du message principal basée sur les paramètres
  const mainLines: string[] = [];

  // Intégrer le thème
  if (theme) {
    const themeConnectors = [
      `Ce que tu traverses avec ${theme}, tu le portes bien.`,
      `${theme} : c'est ce qui te traverse en ce moment.`,
      `Avec ${theme}, tu trouves ton chemin.`,
      `${theme} te fait avancer, même doucement.`,
    ];
    mainLines.push(pickStable(themeConnectors, seed + "::theme"));
  }

  // Intégrer le sous-thème
  if (sous_theme) {
    const subConnectors = [
      `Spécialement pour ${sous_theme}.`,
      `${sous_theme} — c'est précis, c'est toi.`,
      `Car ${sous_theme} compte vraiment.`,
    ];
    mainLines.push(pickStable(subConnectors, seed + "::subtheme"));
  }

  // Intégrer le lieu
  if (lieu) {
    const placeLines = [
      `À ${lieu}, tu es à ta place.`,
      `${lieu} : c'est là que ça devient clair pour toi.`,
      `Dans ${lieu}, tu trouveras ce qu'il te faut.`,
      `${lieu}. Oui, là. C'est le bon endroit.`,
    ];
    mainLines.push(pickStable(placeLines, seed + "::place"));
  }

  // Intégrer le souvenir
  if (souvenir) {
    const memoryLines = [
      `Rappelle-toi "${souvenir}". Ça te revient, n'est-ce pas ?`,
      `"${souvenir}" : tu sais que tu l'as en toi.`,
      `Tu gardes "${souvenir}" comme preuve que tu peux avancer.`,
      `Pense à "${souvenir}". C'est ton point d'appui.`,
    ];
    mainLines.push(pickStable(memoryLines, seed + "::memory"));
  }

  // Message de fermeture (dépend de la voix)
  const closings =
    voice === "masculin"
      ? [
          `Voilà ce que je voulais te dire.`,
          `C'est simplement ça.`,
          `Tu le sais déjà, au fond.`,
          `Rien de plus à ajouter.`,
        ]
      : [
          `Je te le dis avec le cœur.`,
          `C'est ça, la vérité pour toi.`,
          `Rappelle-toi ça, d'accord ?`,
          `C'est doux, c'est toi.`,
        ];
  const closing = pickStable(closings, seed + "::closing");

  lines.push(...mainLines);
  lines.push(closing);

  return lines.join(" ").replace(/\s+/g, " ").trim();
}

function buildEn(p: {
  prenom: string;
  theme: string;
  sous_theme: string;
  lieu: string;
  souvenir: string;
  voice: "masculin" | "feminin";
  seed: string;
}) {
  const { prenom, theme, sous_theme, lieu, souvenir, voice, seed } = p;

  const lines: string[] = [];

  const openings = [
    `${prenom},`,
    `${prenom}, listen.`,
    `${prenom}, for a moment.`,
    `${prenom}, just you and me.`,
  ];
  const opening = pickStable(openings, seed + "::opening");
  lines.push(opening);

  const mainLines: string[] = [];

  if (theme) {
    const themeConnectors = [
      `What you're living with ${theme}, you're carrying it well.`,
      `${theme} — that's what moves through you now.`,
      `With ${theme}, you find your way.`,
      `${theme} pushes you forward, even slowly.`,
    ];
    mainLines.push(pickStable(themeConnectors, seed + "::theme"));
  }

  if (sous_theme) {
    const subConnectors = [
      `Especially for ${sous_theme}.`,
      `${sous_theme} — that's specific, that's you.`,
      `Because ${sous_theme} truly matters.`,
    ];
    mainLines.push(pickStable(subConnectors, seed + "::subtheme"));
  }

  if (lieu) {
    const placeLines = [
      `In ${lieu}, you are in your place.`,
      `${lieu} — that's where it becomes clear for you.`,
      `In ${lieu}, you'll find what you need.`,
      `${lieu}. Yes, there. That's the right place.`,
    ];
    mainLines.push(pickStable(placeLines, seed + "::place"));
  }

  if (souvenir) {
    const memoryLines = [
      `Remember "${souvenir}". It comes back to you, doesn't it?`,
      `"${souvenir}" — you know you carry it.`,
      `You hold "${souvenir}" as proof you can move forward.`,
      `Think of "${souvenir}". It's your anchor.`,
    ];
    mainLines.push(pickStable(memoryLines, seed + "::memory"));
  }

  const closings =
    voice === "masculin"
      ? [
          `That's what I wanted to tell you.`,
          `That's simply it.`,
          `You already know it, deep down.`,
          `Nothing more to add.`,
        ]
      : [
          `I tell you this from the heart.`,
          `That's the truth for you.`,
          `Remember it, okay?`,
          `It's gentle, it's you.`,
        ];
  const closing = pickStable(closings, seed + "::closing");

  lines.push(...mainLines);
  lines.push(closing);

  return lines.join(" ").replace(/\s+/g, " ").trim();
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
    const voix = normalizeVoice(body.voix || "feminin");

    // Seed includes timestamp so messages vary on each call
    const timestamp = Math.floor(Date.now() / 1000);
    const seed = `${langue}::${voix}::${prenom}::${theme}::${sous_theme}::${lieu}::${souvenir}::${timestamp}`;

    const text =
      langue === "en"
        ? buildEn({ prenom, theme, sous_theme, lieu, souvenir, voice: voix as any, seed })
        : buildFr({ prenom, theme, sous_theme, lieu, souvenir, voice: voix as any, seed });

    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur génération texte." }, { status: 500 });
  }
}
