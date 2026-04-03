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
      .select("id_bijou, type_bijou, credits_restants, langue")
      .eq("id_bijou", id_bijou)
      .maybeSingle();

    if (bijouError || !bijou) {
      return NextResponse.json(
        { success: false, error: "Bijou introuvable." },
        { status: 404 }
      );
    }

    const { data: personnalisation } = await supabase
      .from("personnalisations")
      .select("prenom, theme")
      .eq("id_bijou", id_bijou)
      .maybeSingle();

    const { data: audioRow, error: audioError } = await supabase
      .from("voix_enregistrees")
      .select("audio_url")
      .eq("id_bijou", id_bijou)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (audioError || !audioRow?.audio_url) {
      return NextResponse.json(
        { success: false, error: "Murmure non scelle ou audio indisponible." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: id_bijou,
        firstName: personnalisation?.prenom ?? null,
        theme: personnalisation?.theme ?? null,
        language: bijou.langue ?? "fr",
        audioUrl: audioRow.audio_url,
        remainingListens: Number(bijou.credits_restants ?? 0),
        jewelType: bijou.type_bijou ?? null,
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

export async function POST(_req: Request, context: RouteContext) {
  const { id: id_bijou } = await context.params;

  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc("consume_credit", {
      p_id_bijou: id_bijou,
    });

    if (rpcErr) {
      if (rpcErr.message?.includes("NO_CREDITS_OR_INACTIVE")) {
        return NextResponse.json(
          { success: false, error: "PLUS_D_ECOUTES" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Erreur compteur." },
        { status: 500 }
      );
    }

    type ConsumeCreditResult = { credits_restants?: number | null };
    const remaining = Array.isArray(rpcData)
      ? (rpcData as ConsumeCreditResult[])[0]?.credits_restants
      : (rpcData as ConsumeCreditResult | null)?.credits_restants;

    try {
      await supabase.from("bijou_usage_events").insert({
        bijou_id: id_bijou,
        event_type: "listen",
        delta: -1,
        metadata: {
          type: "murmures_ia",
          remaining_after: Number(remaining ?? 0),
        },
      });
    } catch {
      // no-op if table is unavailable
    }

    return NextResponse.json({
      success: true,
      data: {
        remainingListens: Number(remaining ?? 0),
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
