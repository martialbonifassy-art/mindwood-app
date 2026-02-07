import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

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

    // Récupérer la session d'enregistrement
    const { data: session, error: sessionError } = await supabase
      .from("recording_sessions")
      .select("*")
      .eq("id_bijou", id_bijou)
      .single();

    if (sessionError && sessionError.code !== "PGRST116") {
      return NextResponse.json(
        { error: sessionError.message },
        { status: 500 }
      );
    }

    // Récupérer la voix enregistrée finale (s'il existe)
    const { data: voixEnregistree } = await supabase
      .from("voix_enregistrees")
      .select("id, audio_url, is_locked, created_at")
      .eq("id_bijou", id_bijou)
      .single();

    // Récupérer les brouillons
    const { data: drafts } = await supabase
      .from("recording_drafts")
      .select("id, audio_url, duree_secondes, created_at")
      .eq("id_bijou", id_bijou)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      session: session || null,
      voixEnregistree: voixEnregistree || null,
      drafts: drafts || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
