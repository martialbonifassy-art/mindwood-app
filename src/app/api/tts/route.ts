import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs"; // important (pas edge) pour Buffer/stream

type Body = {
  text?: string;
  voice?: string; // "masculin" | "feminin" côté client, on map
  lang?: string; // "fr" | "en"
};

function sha1(input: string) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

function clampText(text: string) {
  const t = (text ?? "").toString().trim();
  // sécurité: limite taille (tu peux ajuster)
  return t.slice(0, 1200);
}

function mapVoice(voice?: string, lang?: string) {
  // mapping simple vers des voix OpenAI
  // (tu pourras affiner plus tard)
  const v = (voice ?? "").toLowerCase();
  const l = (lang ?? "fr").toLowerCase();

  const malePreferred = v.includes("masc");
  // voix OpenAI courantes: alloy, ash, coral, echo, fable, onyx, nova, sage, shimmer
  // On choisit juste 2 profils stables.
  if (malePreferred) return "onyx";
  return l.startsWith("en") ? "nova" : "shimmer";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    const text = clampText(body.text ?? "");
    if (!text) {
      return NextResponse.json({ error: "Texte manquant." }, { status: 400 });
    }

    const lang = (body.lang ?? "fr").toLowerCase();
    const voice = mapVoice(body.voice, lang);

    const openaiKey = process.env.OPENAI_API_KEY?.trim() || "";

    // ✅ FIX: fallback SUPABASE_URL -> NEXT_PUBLIC_SUPABASE_URL
    const supabaseUrl =
      process.env.SUPABASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
      "";

    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

    const bucket = (process.env.SUPABASE_TTS_BUCKET?.trim() || "tts").trim();

    if (!openaiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY manquante." }, { status: 500 });
    }

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: "SUPABASE_URL manquante (ou NEXT_PUBLIC_SUPABASE_URL)." },
        { status: 500 }
      );
    }

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY manquante (settings Supabase → API → service_role)." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // cache key
    const key = sha1(`${lang}::${voice}::${text}`);
    const path = `${lang}/${voice}/${key}.mp3`;

    // Si déjà uploadé, on renvoie l’URL publique
    // (pour bucket public)
    const { data: existing } = supabase.storage.from(bucket).getPublicUrl(path);

    // getPublicUrl renvoie une URL même si le fichier n'existe pas,
    // donc on check la présence via list sur le dossier exact (léger)
    const folder = `${lang}/${voice}`;
    const { data: list, error: listErr } = await supabase.storage.from(bucket).list(folder, {
      search: `${key}.mp3`,
      limit: 1,
    });

    if (!listErr && list && list.length > 0) {
      return NextResponse.json({ url: existing.publicUrl });
    }

    // Génération TTS OpenAI (mp3)
    const openai = new OpenAI({ apiKey: openaiKey });

    const audioResp = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
      input: text,
      response_format: "mp3",
    });

    const arrayBuffer = await audioResp.arrayBuffer();
    const mp3 = Buffer.from(arrayBuffer);

    // Upload vers Storage
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, mp3, {
      contentType: "audio/mpeg",
      upsert: false,
      cacheControl: "31536000",
    });

    // si collision (rare): on renvoie l'URL existante
    if (upErr && /already exists/i.test(upErr.message)) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return NextResponse.json({ url: data.publicUrl });
    }

    if (upErr) {
      return NextResponse.json({ error: `Upload storage: ${upErr.message}` }, { status: 500 });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur TTS." }, { status: 500 });
  }
}