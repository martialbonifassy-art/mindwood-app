// app/api/tts/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

type Lang = "fr" | "en";
type Gender = "male" | "female" | "neutral";

type VoiceProfile =
  | "murmure_intime"
  | "souffle_meditatif"
  | "presence_charnelle"
  | "rituel_ancien"
  | "voix_complice"
  | "echo_lointain";

type TTSMeta = {
  theme?: string | null;
  subtheme?: string | null;
  // petits indices “magiques” (facultatifs)
  isGift?: boolean | null;
  isMemorial?: boolean | null;
  isNature?: boolean | null;
  isJoyfulMemory?: boolean | null;
};

type TTSRequest = {
  text: string;
  voice?: Gender; // compat: "male" | "female" | "neutral"
  lang?: Lang; // compat: "fr" | "en"
  meta?: TTSMeta; // NOUVEAU
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const bucket = process.env.SUPABASE_TTS_BUCKET || "tts";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

function sha1(input: string) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

const CACHE_VERSION = "v2";

function norm(s?: string | null) {
  return (s || "").trim().toLowerCase();
}

/**
 * 1) Choix du profil (Option C invisible)
 */
function pickVoiceProfile(meta?: TTSMeta): VoiceProfile {
  const theme = norm(meta?.theme);
  const sub = norm(meta?.subtheme);

  // “mots déclencheurs” (tu peux enrichir au fur et à mesure)
  const textSignals = `${theme} ${sub}`;

  const has = (...words: string[]) => words.some((w) => textSignals.includes(w));

  // règles fortes
  if (meta?.isMemorial || has("deuil", "absence", "adieu", "perte", "manque")) {
    return "echo_lointain";
  }
  if (has("héritage", "memoire", "mémoire", "transmission", "ancêtre", "famille")) {
    return "rituel_ancien";
  }
  if (meta?.isNature || has("nature", "forêt", "foret", "arbre", "silence", "calme", "paix", "apaisement")) {
    return "souffle_meditatif";
  }
  if (has("désir", "desir", "passion", "sensuel", "sensuelle", "peau", "charnel", "charnelle")) {
    return "presence_charnelle";
  }
  if (meta?.isJoyfulMemory || has("joie", "rire", "amitié", "complice", "fratrie", "souvenir joyeux")) {
    return "voix_complice";
  }

  // ajustement cadeau : pousse vers l’intime
  if (meta?.isGift || has("cadeau", "offert", "offerte")) {
    return "murmure_intime";
  }

  // défaut signature Mindwood
  return "murmure_intime";
}

/**
 * 2) Presets invisibles (client les applique)
 */
function profilePreset(profile: VoiceProfile) {
  switch (profile) {
    case "murmure_intime":
      return { playbackRate: 0.90, fadeInMs: 350, fadeOutMs: 550 }; // un peu plus lent pour intimité
    case "souffle_meditatif":
      return { playbackRate: 0.85, fadeInMs: 500, fadeOutMs: 800 }; // très lent, méditatif
    case "presence_charnelle":
      return { playbackRate: 0.98, fadeInMs: 250, fadeOutMs: 450 }; // quasi normal, naturel
    case "rituel_ancien":
      return { playbackRate: 0.88, fadeInMs: 450, fadeOutMs: 900 }; // lent, solennel
    case "voix_complice":
      return { playbackRate: 1.0, fadeInMs: 220, fadeOutMs: 420 }; // normal, conversationnel
    case "echo_lointain":
      return { playbackRate: 0.84, fadeInMs: 700, fadeOutMs: 1200 }; // très lent, écho
  }
}

/**
 * 3) “Respiration” du texte (la magie vient surtout d’ici)
 * On ajoute des pauses naturelles sans afficher quoi que ce soit à l’utilisateur.
 */
function shapeText(input: string, lang: Lang, profile: VoiceProfile) {
  let t = (input || "").trim();

  // nettoyage soft
  t = t.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  // unifier la ponctuation (évite les TTS trop “hachées”)
  t = t.replace(/\.{3,}/g, "…");

  // selon profil: on ajoute des respirations
  const addBreath = (s: string) => {
    // Ajoute des micro-pauses subtiles après ponctuation pour plus de naturel
    return s
      .replace(/([,;:])\s+/g, "$1 ")
      .replace(/([.!?])\s+/g, "$1\n"); // pause nette en fin de phrase
  };

  const addSpace = (s: string) => s.replace(/\n/g, "\n\n"); // plus d’air

  if (profile === "souffle_meditatif") {
    t = addBreath(t);
    t = addSpace(t);
    // encore plus d’espace
    t = t.replace(/\n{2,}/g, "\n\n").trim();
  } else if (profile === "echo_lointain") {
    t = addBreath(t);
    t = addSpace(t);
    // silences assumés
    t = t.replace(/…/g, "…\n");
  } else if (profile === "rituel_ancien") {
    t = addBreath(t);
    // rythme solennel: phrases mieux séparées
    t = t.replace(/\n/g, "\n\n");
  } else if (profile === "murmure_intime") {
    t = addBreath(t);
    // intime: un peu d’air, mais moins que méditatif
    t = t.replace(/\n/g, "\n\n");
  } else if (profile === "presence_charnelle") {
    // charnel: moins de blancs, plus “continu”
    t = addBreath(t).replace(/\n{2,}/g, "\n");
  } else if (profile === "voix_complice") {
    // complice: plus conversationnel
    t = t.replace(/([,;:])\s+/g, "$1 ");
    t = t.replace(/([.!?])\s+/g, "$1\n");
  }

  // petite touche lang (évite certains tics)
  if (lang === "en") {
    // évite les double spaces
    t = t.replace(/\s{2,}/g, " ");
  }

  return t.trim();
}

/**
 * 4) Choix de la voix OpenAI
 * On utilise un mapping stable + déterministe (hash) pour éviter de “changer de voix”
 * d’une requête à l’autre quand le profil est identique.
 *
 * Voix usuelles OpenAI TTS: alloy, echo, fable, onyx, nova, shimmer
 */
function pickOpenAIVoice(profile: VoiceProfile, gender: Gender, stableKey: string) {
  const pools: Record<VoiceProfile, { male: string[]; female: string[]; neutral: string[] }> = {
    murmure_intime: {
      male: ["onyx", "echo"],
      female: ["shimmer", "nova"],
      neutral: ["alloy"],
    },
    souffle_meditatif: {
      male: ["echo", "onyx"],
      female: ["shimmer", "nova"],
      neutral: ["alloy"],
    },
    presence_charnelle: {
      male: ["onyx"],
      female: ["nova"],
      neutral: ["alloy"],
    },
    rituel_ancien: {
      male: ["onyx", "echo"],
      female: ["nova"],
      neutral: ["alloy"],
    },
    voix_complice: {
      male: ["echo", "onyx"],
      female: ["nova", "shimmer"],
      neutral: ["alloy"],
    },
    echo_lointain: {
      male: ["echo", "onyx"],
      female: ["shimmer"],
      neutral: ["alloy"],
    },
  };

  const pool = pools[profile][gender] || pools[profile].neutral;
  const h = sha1(stableKey);
  const idx = parseInt(h.slice(0, 8), 16) % pool.length;
  return pool[idx];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TTSRequest;

    const rawText = (body.text || "").trim();
    if (!rawText) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const lang: Lang = body.lang === "en" ? "en" : "fr";
    const gender: Gender = body.voice === "male" || body.voice === "female" ? body.voice : "neutral";

    // 1) Profil auto (Option C)
    const profile = pickVoiceProfile(body.meta);

    // 2) Texte “respiré”
    const shaped = shapeText(rawText, lang, profile);

    // 3) Voix OpenAI (déterministe)
    const stableKey = `${lang}|${gender}|${profile}|${body.meta?.theme || ""}|${body.meta?.subtheme || ""}`;
    const openaiVoice = pickOpenAIVoice(profile, gender, stableKey);

    // 4) Cache key (inclut shaped + voice + model)
    const model = "gpt-4o-mini-tts";
    const cacheKey = sha1(`${CACHE_VERSION}|${model}|${openaiVoice}|${lang}|${profile}|${shaped}`);

    const objectPath = `${lang}/${profile}/${cacheKey}.mp3`;

    // 5) Si déjà en storage: renvoyer direct
    // On évite list() coûteux: on tente getPublicUrl + (optionnel) HEAD côté client.
    // Ici on assume que si le fichier existe il est accessible; si upload échoue on régénère.
    const publicUrl = supabase.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;

    // 6) Générer audio TTS
    // NB: on ne “head-check” pas ici; si tu veux, on peut l’ajouter, mais on garde simple+robuste.
    // On tente d’abord de télécharger: si ça renvoie 404, on régénère. (Supabase SDK n’expose pas HEAD facilement)
    // => stratégie: essayer download, si ok => return publicUrl
    const existing = await supabase.storage.from(bucket).download(objectPath);
    if (!existing.error && existing.data) {
      const preset = profilePreset(profile);
      return NextResponse.json({
        url: publicUrl,
        voiceProfile: profile, // interne
        ...preset,
      });
    }

    // 7) Appel OpenAI TTS avec paramètres pour plus d'humanité
    // Nous utilisons une vitesse légèrement ralentie et un format qui préserve les nuances vocales
    const ttsRes = await openai.audio.speech.create({
      model,
      voice: openaiVoice as "onyx" | "shimmer" | "alloy" | "echo" | "fable" | "nova" | "sage",
      input: shaped,
      response_format: "mp3",
      speed: 0.95, // légèrement plus lent pour plus de naturel
    });

    const arrayBuffer = await ttsRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 8) Upload Supabase (public bucket)
    const upload = await supabase.storage.from(bucket).upload(objectPath, buffer, {
      contentType: "audio/mpeg",
      upsert: true,
      cacheControl: "31536000", // 1 an
    });

    if (upload.error) {
      return NextResponse.json({ error: upload.error.message }, { status: 500 });
    }

    const preset = profilePreset(profile);

    return NextResponse.json({
      url: publicUrl,
      voiceProfile: profile, // interne
      ...preset,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "TTS error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}// rebuild
