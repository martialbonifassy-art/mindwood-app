import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, context: RouteContext) {
  const { id: id_bijou } = await context.params

  try {
    const { data: bijou, error: bijouError } = await supabase
      .from("bijoux")
      .select("id_bijou, langue, type_bijou")
      .eq("id_bijou", id_bijou)
      .maybeSingle()

    if (bijouError) {
      console.error("Erreur lecture bijou:", bijouError)
      return NextResponse.json(
        { success: false, error: "Erreur lecture bijou" },
        { status: 500 }
      )
    }

    if (!bijou) {
      return NextResponse.json(
        { success: false, error: "Bijou introuvable" },
        { status: 404 }
      )
    }

    const { data: personnalisation, error: personnalisationError } =
      await supabase
        .from("personnalisations")
        .select("prenom, gravure_dos")
        .eq("id_bijou", id_bijou)
        .maybeSingle()

    if (personnalisationError) {
      console.error("Erreur lecture personnalisation:", personnalisationError)
      return NextResponse.json(
        { success: false, error: "Erreur lecture personnalisation" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id_bijou,
        prenom: personnalisation?.prenom ?? "",
        gravure_dos: personnalisation?.gravure_dos ?? "",
        langue: bijou.langue ?? "fr",
        type_bijou: bijou.type_bijou ?? null,
      },
    })
  } catch (error) {
    console.error("Erreur serveur GET firstname:", error)
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request, context: RouteContext) {
  const { id: id_bijou } = await context.params

  try {
    const body = await req.json()

    const prenom = String(body?.prenom ?? "").trim()
    const gravure_dos = String(body?.gravure_dos ?? "").trim()

    if (!prenom || prenom.length < 2) {
      return NextResponse.json(
        { success: false, error: "Prénom invalide" },
        { status: 400 }
      )
    }

    if (gravure_dos.length > 20) {
      return NextResponse.json(
        { success: false, error: "Gravure limitée à 20 caractères" },
        { status: 400 }
      )
    }

    const { data: existing, error: existingError } = await supabase
      .from("personnalisations")
      .select("id")
      .eq("id_bijou", id_bijou)
      .maybeSingle()

    if (existingError) {
      console.error("Erreur recherche personnalisation:", existingError)
      return NextResponse.json(
        { success: false, error: "Erreur recherche personnalisation" },
        { status: 500 }
      )
    }

    if (existing?.id) {
      const { error } = await supabase
        .from("personnalisations")
        .update({
          prenom,
          gravure_dos: gravure_dos || null,
        })
        .eq("id", existing.id)

      if (error) {
        console.error("Erreur update personnalisation:", error)
        return NextResponse.json(
          { success: false, error: "Erreur base de données" },
          { status: 500 }
        )
      }
    } else {
      const { error } = await supabase
        .from("personnalisations")
        .insert({
          id_bijou,
          prenom,
          gravure_dos: gravure_dos || null,
        })

      if (error) {
        console.error("Erreur insert personnalisation:", error)
        return NextResponse.json(
          { success: false, error: "Erreur base de données" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id_bijou,
        prenom,
        gravure_dos: gravure_dos || null,
      },
    })
  } catch (error) {
    console.error("Erreur serveur POST firstname:", error)
    return NextResponse.json(
      { success: false, error: "Erreur serveur inattendue" },
      { status: 500 }
    )
  }
}