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

  // Phrases directes et authentiques selon le thème
  const directPhrases: Record<string, string[]> = {
    amour: [
      "Tu fais rayonner mes journées davantage chaque jour.",
      "Je t'aime plus que les mots ne peuvent l'exprimer.",
      "Tu me manques, même quand tu es près de moi.",
      "Être avec toi, c'est rentrer à la maison.",
      "Tu as changé ma vie simplement en existant.",
    ],
    famille: [
      "Vous êtes ma fierté et mon inspiration.",
      "Cette connexion entre nous est sacrée.",
      "Je suis reconnaissant pour chaque moment avec toi.",
      "Tu es ma racine, mon fondement.",
      "Mon cœur bat plus fort quand je pense à toi.",
    ],
    amitié: [
      "Tu rends mes jours plus vibrants.",
      "Ton rire résonne dans mon âme.",
      "Tu me vois vraiment, et c'est un cadeau rare.",
      "Avec toi, je suis moi-même, totalement.",
      "Tu es le genre de personne qu'on garde à vie.",
    ],
    accomplissement: [
      "Je suis fier de ce que nous avons créé.",
      "Cette réussite nous appartient.",
      "Nous avons su nous élever plus haut.",
      "Ce moment marque un tournant magnifique.",
      "Nous avons fait preuve de force et de vision.",
    ],
    guérison: [
      "Je reprends doucement ma respiration.",
      "Chaque jour, je me sens un peu plus entier.",
      "Mon cœur cicatrise avec grâce.",
      "Je retrouve la lumière progressivement.",
      "La paix s'installe en moi, doucement mais sûrement.",
    ],
    deuil: [
      "Ton absence me rend encore plus conscient de ce que tu représentais.",
      "Je garde chaque moment précieux vivant en moi.",
      "Ton héritage respire à travers mes actes.",
      "Le temps passe, mais tu restes gravé dans mon cœur.",
      "Tu m'as façonné, et ça continuera à jamais.",
    ],
  };

  // Sélectionner une phrase appropriée selon le thème
  const getDirectPhrase = (): string => {
    const themeKey = theme.toLowerCase();
    for (const [key, phrases] of Object.entries(directPhrases)) {
      if (themeKey.includes(key)) {
        return phrases[Math.floor(Math.random() * phrases.length)];
      }
    }
    // Défaut universel
    return "Tu comptes vraiment pour moi.";
  };

  const parts: string[] = [];
  parts.push(`✨ ${prenom},`);
  parts.push(`ce message s'inspire de **${theme}${sous ? " / " + sous : ""}**.`);
  if (lieu) parts.push(`Il t'accompagne dans ce lieu : **${lieu}**.`);
  if (souvenir) parts.push(`Il porte ce souvenir avec toi : "${souvenir}".`);
  parts.push(getDirectPhrase());
  parts.push(`Prends un moment pour respirer et sentir cette connexion. Tu es exactement où tu dois être.`);
  parts.push(`(Tonalité : ${tone}.)`);

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

  // Direct and authentic phrases based on theme
  const directPhrases: Record<string, string[]> = {
    love: [
      "You light up my days more with each passing moment.",
      "I love you more than words could ever express.",
      "I miss you, even when you're right beside me.",
      "Being with you is coming home.",
      "You've changed my life simply by existing.",
    ],
    family: [
      "You are my pride and my inspiration.",
      "This connection between us is sacred.",
      "I'm grateful for every moment with you.",
      "You are my roots, my foundation.",
      "My heart beats stronger when I think of you.",
    ],
    friendship: [
      "You make my days more vibrant.",
      "Your laughter resonates in my soul.",
      "You see me truly, and that's a rare gift.",
      "With you, I'm completely myself.",
      "You're the kind of person I keep for life.",
    ],
    achievement: [
      "I'm proud of what we've created together.",
      "This success belongs to us.",
      "We've managed to rise higher.",
      "This moment marks a beautiful turning point.",
      "We showed strength and vision.",
    ],
    healing: [
      "I'm slowly catching my breath again.",
      "Each day, I feel a little more whole.",
      "My heart heals with grace.",
      "I'm finding the light progressively.",
      "Peace is settling within me, slowly but surely.",
    ],
    grief: [
      "Your absence makes me even more aware of what you meant to me.",
      "I keep every precious moment alive within me.",
      "Your legacy breathes through my actions.",
      "Time passes, but you remain engraved in my heart.",
      "You've shaped me, and that will continue forever.",
    ],
  };

  // Select an appropriate phrase based on theme
  const getDirectPhrase = (): string => {
    const themeKey = theme.toLowerCase();
    for (const [key, phrases] of Object.entries(directPhrases)) {
      if (themeKey.includes(key)) {
        return phrases[Math.floor(Math.random() * phrases.length)];
      }
    }
    // Default universal
    return "You truly matter to me.";
  };

  const parts: string[] = [];
  parts.push(`✨ ${prenom},`);
  parts.push(`this message is inspired by **${theme}${sous ? " / " + sous : ""}**.`);
  if (lieu) parts.push(`It accompanies you in this place: **${lieu}**.`);
  if (souvenir) parts.push(`It carries this memory with you: "${souvenir}".`);
  parts.push(getDirectPhrase());
  parts.push(`Take a moment to breathe and feel this connection. You are exactly where you need to be.`);
  parts.push(`(Tone: ${tone}.)`);

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur API";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}