import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

const bucket = process.env.SUPABASE_TTS_BUCKET || "tts";

type RequestBody = {
  id_bijou: string;
  audioBase64: string;
  durationSeconds: number;
  enregistreur_nom?: string;
  isDraft?: boolean; // true = brouillon, false = final
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;

    if (!body.id_bijou || !body.audioBase64) {
      return NextResponse.json(
        { error: "id_bijou et audioBase64 requis" },
        { status: 400 }
      );
    }

    // Décoder le base64 en Buffer
    const audioBuffer = Buffer.from(body.audioBase64, "base64");

    // Créer un chemin unique
    const timestamp = Date.now();
    const type = body.isDraft ? "drafts" : "voix";
    const path = `recordings/${body.id_bijou}/${type}/${timestamp}.webm`;

    // Uploader sur Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, audioBuffer, {
        contentType: "audio/webm",
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Obtenir l'URL publique
    const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;

    if (body.isDraft) {
      // Sauvegarder le brouillon dans la DB
      const { error: draftError } = await supabase
        .from("recording_drafts")
        .insert({
          id_bijou: body.id_bijou,
          audio_url: publicUrl,
          duree_secondes: body.durationSeconds,
        });

      if (draftError) {
        console.error("Draft DB error:", draftError);
        return NextResponse.json(
          { error: "Erreur lors de la sauvegarde du brouillon" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        url: publicUrl,
        isDraft: true,
      });
    } else {
      // Sauvegarder la voix finale
      const { error: voixError } = await supabase
        .from("voix_enregistrees")
        .insert({
          id_bijou: body.id_bijou,
          audio_url: publicUrl,
          duree: body.durationSeconds,
          enregistreur_nom: body.enregistreur_nom,
          is_locked: true,
        });

      if (voixError) {
        console.error("Voix DB error:", voixError);
        return NextResponse.json(
          { error: "Erreur lors de la sauvegarde de l'audio" },
          { status: 500 }
        );
      }

      // Verrouiller la session d'enregistrement
      const { error: lockError } = await supabase
        .from("recording_sessions")
        .update({
          locked: true,
          locked_at: new Date().toISOString(),
        })
        .eq("id_bijou", body.id_bijou);

      if (lockError) {
        console.warn("Lock error (non-critique):", lockError);
      }

      return NextResponse.json({
        success: true,
        url: publicUrl,
        isDraft: false,
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur interne";
    console.error("Record API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: Récupérer les infos de session d'enregistrement
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id_bijou = searchParams.get("id_bijou");

    if (!id_bijou) {
      return NextResponse.json(
        { error: "id_bijou requis" },
        { status: 400 }
      );
    }

    const { data: session, error } = await supabase
      .from("recording_sessions")
      .select("*")
      .eq("id_bijou", id_bijou)
      .single();

    if (error) {
      // Si la session n'existe pas, la créer
      if (error.code === "PGRST116") {
        const { data: newSession, error: createError } = await supabase
          .from("recording_sessions")
          .insert({
            id_bijou,
            essais_restants: 5,
            max_essais: 5,
            duree_max_secondes: 120,
          })
          .select()
          .single();

        if (createError) {
          return NextResponse.json({ error: createError.message }, { status: 500 });
        }

        return NextResponse.json(newSession);
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(session);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
