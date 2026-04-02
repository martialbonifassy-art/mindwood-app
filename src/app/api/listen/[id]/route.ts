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
      .select("id_bijou, type_bijou, langue, credits_restants, est_active")
      .eq("id_bijou", id_bijou)
      .maybeSingle();

    if (bijouError) {
      console.error("Erreur lecture bijou:", bijouError);
      return NextResponse.json(
        { success: false, error: "Erreur lecture bijou" },
        { status: 500 }
      );
    }

    if (!bijou) {
      return NextResponse.json(
        { success: false, error: "Bijou introuvable" },
        { status: 404 }
      );
    }

    const { data: personnalisation, error: personnalisationError } = await supabase
      .from("personnalisations")
      .select("prenom, lieu, souvenir, theme, sous_theme, voix")
      .eq("id_bijou", id_bijou)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (personnalisationError) {
      console.error("Erreur lecture personnalisation:", personnalisationError);
      return NextResponse.json(
        { success: false, error: "Erreur lecture personnalisation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        bijou,
        personnalisation: personnalisation ?? null,
      },
    });
  } catch (error) {
    console.error("Erreur serveur GET listen:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, context: RouteContext) {
  const { id: id_bijou } = await context.params;

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "").trim();

    if (action !== "consume-credit") {
      return NextResponse.json(
        { success: false, error: "Action invalide" },
        { status: 400 }
      );
    }

    const { data: rpcData, error: rpcErr } = await supabase.rpc("consume_credit", {
      p_id_bijou: id_bijou,
    });

    if (rpcErr) {
      if (rpcErr.message?.includes("NO_CREDITS_OR_INACTIVE")) {
        return NextResponse.json(
          { success: false, error: "NO_CREDITS_OR_INACTIVE" },
          { status: 409 }
        );
      }

      console.error("Erreur consume_credit:", rpcErr);
      return NextResponse.json(
        { success: false, error: "Erreur consommation crédit" },
        { status: 500 }
      );
    }

    type ConsumeCreditResult = { credits_restants?: number | null };
    const credits_restants = Array.isArray(rpcData)
      ? (rpcData as ConsumeCreditResult[])[0]?.credits_restants
      : (rpcData as ConsumeCreditResult | null)?.credits_restants;

    return NextResponse.json({
      success: true,
      data: {
        credits_restants: Number(credits_restants ?? 0),
      },
    });
  } catch (error) {
    console.error("Erreur serveur POST listen:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur inattendue" },
      { status: 500 }
    );
  }
}
