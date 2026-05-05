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

type RecordingVariant = "standard" | "capsule"

type CapsuleMetadata = {
  variant?: RecordingVariant
  unlockAt?: string | null
  countdownMessageFr?: string
  countdownMessageEn?: string
}

function readCapsuleMetadata(raw: unknown): CapsuleMetadata {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}

  const capsule = (raw as { recorded_voice?: unknown }).recorded_voice
  if (!capsule || typeof capsule !== "object" || Array.isArray(capsule)) return {}

  const source = capsule as Record<string, unknown>

  return {
    variant: source.variant === "capsule" ? "capsule" : "standard",
    unlockAt: typeof source.unlockAt === "string" ? source.unlockAt : null,
    countdownMessageFr:
      typeof source.countdownMessageFr === "string" ? source.countdownMessageFr : undefined,
    countdownMessageEn:
      typeof source.countdownMessageEn === "string" ? source.countdownMessageEn : undefined,
  }
}

function buildUpdatedMetadata(raw: unknown, variant: RecordingVariant, unlockAt: string | null) {
  const base = raw && typeof raw === "object" && !Array.isArray(raw)
    ? { ...(raw as Record<string, unknown>) }
    : {}

  const currentRecordedVoice =
    base.recorded_voice && typeof base.recorded_voice === "object" && !Array.isArray(base.recorded_voice)
      ? (base.recorded_voice as Record<string, unknown>)
      : {}

  return {
    ...base,
    recorded_voice: {
      ...currentRecordedVoice,
      variant,
      unlockAt,
      countdownMessageFr:
        "Une voix vous attend ici, mais elle a été confiée au temps.",
      countdownMessageEn:
        "A voice is waiting here, but it has been entrusted to time.",
    },
  }
}

export async function GET(_req: Request, context: RouteContext) {
  const { id: id_bijou } = await context.params

  try {
    const { data: bijou, error: bijouError } = await supabase
      .from("bijoux")
      .select("id_bijou, langue, type_bijou, metadata")
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

    const capsule = readCapsuleMetadata(bijou.metadata)

    return NextResponse.json({
      success: true,
      data: {
        id_bijou,
        prenom: personnalisation?.prenom ?? "",
        gravure_dos: personnalisation?.gravure_dos ?? "",
        langue: bijou.langue ?? "fr",
        type_bijou: bijou.type_bijou ?? null,
        recordingVariant: capsule.variant ?? "standard",
        unlockAt: capsule.unlockAt ?? null,
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
    const recordingVariant: RecordingVariant = body?.recordingVariant === "capsule" ? "capsule" : "standard"
    const unlockAt = typeof body?.unlockAt === "string" ? body.unlockAt.trim() : ""

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

    let normalizedUnlockAt: string | null = null

    if (recordingVariant === "capsule") {
      const parsedDate = new Date(unlockAt)
      if (!unlockAt || Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { success: false, error: "Date d'ouverture invalide" },
          { status: 400 }
        )
      }

      const now = new Date()
      const oneYearLater = new Date(now)
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)

      if (parsedDate.getTime() <= now.getTime()) {
        return NextResponse.json(
          { success: false, error: "La date d'ouverture doit être dans le futur" },
          { status: 400 }
        )
      }

      if (parsedDate.getTime() > oneYearLater.getTime()) {
        return NextResponse.json(
          { success: false, error: "La capsule ne peut pas être programmée au-delà d'un an" },
          { status: 400 }
        )
      }

      normalizedUnlockAt = parsedDate.toISOString()
    }

    const { data: bijou, error: bijouLookupError } = await supabase
      .from("bijoux")
      .select("id_bijou, metadata")
      .eq("id_bijou", id_bijou)
      .maybeSingle()

    if (bijouLookupError || !bijou) {
      console.error("Erreur recherche bijou:", bijouLookupError)
      return NextResponse.json(
        { success: false, error: "Bijou introuvable" },
        { status: 404 }
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

    const updatedMetadata = buildUpdatedMetadata(
      bijou.metadata,
      recordingVariant,
      normalizedUnlockAt
    )

    const { error: bijouUpdateError } = await supabase
      .from("bijoux")
      .update({ metadata: updatedMetadata })
      .eq("id_bijou", id_bijou)

    if (bijouUpdateError) {
      console.error("Erreur update metadata bijou:", bijouUpdateError)
      return NextResponse.json(
        { success: false, error: "Erreur mise à jour du paramétrage capsule" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id_bijou,
        prenom,
        gravure_dos: gravure_dos || null,
        recordingVariant,
        unlockAt: normalizedUnlockAt,
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