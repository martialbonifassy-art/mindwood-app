import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getLocaleFromHost } from "@/lib/i18n";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteContext = {
  params: Promise<{ id: string }>;
};

type SealBody = {
  recipientFirstName?: string;
  relationshipType?: string;
  language?: "fr" | "en" | string;
  voice?: "feminin" | "masculin" | string;
  tone?: string;
  emotionalIntensity?: string;
  lengthPreference?: string;
  desiredEffect?: string;
  theme?: string;
  themeLabel?: string;
  criteriaQuestions?: string[];
  criteriaAnswers?: string[];
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function mapVoiceForTts(value: unknown): "female" | "male" | "neutral" {
  const v = clean(value).toLowerCase();
  if (v.includes("fem")) return "female";
  if (v.includes("mas")) return "male";
  return "neutral";
}

export async function POST(req: Request, context: RouteContext) {
  const { id: id_bijou } = await context.params;

  try {
    const { data: currentBijou, error: currentBijouError } = await supabase
      .from("bijoux")
      .select("id_bijou, type_bijou")
      .eq("id_bijou", id_bijou)
      .maybeSingle();

    if (currentBijouError) {
      return NextResponse.json(
        { success: false, error: "Erreur lecture du bijou." },
        { status: 500 }
      );
    }

    if (!currentBijou) {
      return NextResponse.json(
        { success: false, error: "Bijou introuvable." },
        { status: 404 }
      );
    }

    if (currentBijou.type_bijou === "voix_enregistree") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ce bijou est deja scelle en voix enregistree. Le mode Murmures IA n'est plus disponible.",
        },
        { status: 409 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as SealBody;

    const recipientFirstName = clean(body.recipientFirstName);
    const relationshipType = clean(body.relationshipType);
    const theme = clean(body.theme);
    const themeLabel = clean(body.themeLabel) || theme;
    const host = req.headers.get("host");
    const fallbackLanguage = clean(body.language).toLowerCase().startsWith("en") ? "en" : "fr";
    const language = host ? getLocaleFromHost(host) : fallbackLanguage;
    const voice = clean(body.voice) || "feminin";
    const tone = clean(body.tone);
    const emotionalIntensity = clean(body.emotionalIntensity);
    const lengthPreference = clean(body.lengthPreference);
    const desiredEffect = clean(body.desiredEffect);

    if (!id_bijou || !recipientFirstName || !relationshipType || !theme) {
      return NextResponse.json(
        { success: false, error: "Informations de scellement incompletes." },
        { status: 400 }
      );
    }

    const questions = Array.isArray(body.criteriaQuestions) ? body.criteriaQuestions : [];
    const answers = Array.isArray(body.criteriaAnswers) ? body.criteriaAnswers : [];

    const criteriaPairs = questions
      .map((q, idx) => ({ question: clean(q), answer: clean(answers[idx]) }))
      .filter((entry) => entry.question || entry.answer)
      .slice(0, 12);

    const criteriaText = criteriaPairs
      .filter((entry) => entry.answer)
      .map((entry) => `- ${entry.question}: ${entry.answer}`)
      .join("\n");

    const lieu = clean(criteriaPairs[1]?.answer || "");
    const souvenir = clean(criteriaPairs[0]?.answer || "");

    const murmureRes = await fetch(new URL("/api/murmure", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prenom: recipientFirstName,
        theme: themeLabel,
        sous_theme: `${tone} | ${emotionalIntensity} | ${lengthPreference} | ${desiredEffect}`,
        lieu,
        souvenir,
        langue: language,
        voix: voice,
      }),
    });

    const murmureJson = await murmureRes.json().catch(() => ({}));
    if (!murmureRes.ok || !murmureJson?.text) {
      return NextResponse.json(
        { success: false, error: murmureJson?.error || "Generation du texte impossible." },
        { status: 500 }
      );
    }

    const generatedText = String(murmureJson.text || "").trim();

    const ttsRes = await fetch(new URL("/api/tts", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: generatedText,
        lang: language,
        voice: mapVoiceForTts(voice),
        meta: {
          theme: themeLabel,
          subtheme: tone,
        },
      }),
    });

    const ttsJson = await ttsRes.json().catch(() => ({}));
    if (!ttsRes.ok || !ttsJson?.url) {
      return NextResponse.json(
        { success: false, error: ttsJson?.error || "Generation audio impossible." },
        { status: 500 }
      );
    }

    const audioUrl = String(ttsJson.url);

    const { error: profileError } = await supabase
      .from("personnalisations")
      .upsert(
        {
          id_bijou,
          prenom: recipientFirstName,
          lieu,
          souvenir,
          theme: themeLabel,
          sous_theme: tone,
          voix: voice,
        },
        { onConflict: "id_bijou" }
      );

    if (profileError) {
      return NextResponse.json(
        { success: false, error: "Impossible d'enregistrer le profil Murmures IA." },
        { status: 500 }
      );
    }

    const { error: sealBijouError } = await supabase
      .from("bijoux")
      .update({
        type_bijou: "murmures_IA",
        langue: language,
        credits_restants: 10,
        actif: true,
        est_active: true,
      })
      .eq("id_bijou", id_bijou);

    if (sealBijouError) {
      console.error("Seal bijoux update error:", sealBijouError);
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de sceller le bijou.",
          details: sealBijouError.message,
        },
        { status: 500 }
      );
    }

    const { error: voiceError } = await supabase
      .from("voix_enregistrees")
      .upsert(
        {
          id_bijou,
          audio_url: audioUrl,
          duree: null,
          enregistreur_nom: "Murmures IA",
          is_locked: true,
        },
        { onConflict: "id_bijou" }
      );

    if (voiceError) {
      return NextResponse.json(
        { success: false, error: "Impossible d'enregistrer l'audio scelle." },
        { status: 500 }
      );
    }

    const scriptPath = `murmures-ia/${id_bijou}/sealed-script.txt`;
    await supabase.storage.from("tts").upload(scriptPath, generatedText, {
      contentType: "text/plain; charset=utf-8",
      upsert: true,
    });

    const summary = {
      relationshipType,
      tone,
      emotionalIntensity,
      lengthPreference,
      desiredEffect,
      criteriaPairs,
      criteriaText,
    };

    // Best-effort usage journal for product analytics and support tracing.
    try {
      await supabase.from("bijou_usage_events").insert({
        bijou_id: id_bijou,
        event_type: "seal",
        delta: 0,
        metadata: {
          type: "murmures_ia",
          theme: themeLabel,
          relationshipType,
          tone,
          emotionalIntensity,
          lengthPreference,
          desiredEffect,
        },
      });
    } catch {
      // no-op: do not block sealing if journaling table is missing
    }

    return NextResponse.json({
      success: true,
      data: {
        id_bijou,
        audioUrl,
        generatedText,
        summary,
      },
    });
  } catch (error) {
    console.error("Murmure seal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur inattendue lors du scellement.",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
