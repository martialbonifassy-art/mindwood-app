import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  const { id: id_bijou } = await context.params;

  try {
    const { data: bijou, error: bijouError } = await supabase
      .from("bijoux")
      .select("id_bijou, credits_restants, actif, type_bijou")
      .eq("id_bijou", id_bijou)
      .maybeSingle();

    if (bijouError) {
      return NextResponse.json(
        { success: false, error: "Erreur lecture bijou." },
        { status: 500 }
      );
    }

    if (!bijou) {
      return NextResponse.json(
        { success: false, error: "Bijou introuvable." },
        { status: 404 }
      );
    }

    let voix: { id: string; lectures_restantes: number; lectures_totales: number } | null = null;

    if (bijou.type_bijou === "voix_enregistree") {
      const { data: voixData, error: voixError } = await supabase
        .from("voix_enregistrees")
        .select("id, lectures_restantes, lectures_totales")
        .eq("id_bijou", id_bijou)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (voixError) {
        return NextResponse.json(
          { success: false, error: "Erreur lecture voix enregistrée." },
          { status: 500 }
        );
      }

      voix = voixData ?? null;
    }

    return NextResponse.json({
      success: true,
      data: {
        bijou,
        voix,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur.",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
