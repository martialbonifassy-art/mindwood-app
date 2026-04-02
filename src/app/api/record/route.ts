import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    const file = formData.get("audio") as File | null
    const id_bijou = formData.get("id_bijou") as string | null
    const isFinal = String(formData.get("final") ?? "false") === "true"

    if (!file || !id_bijou) {
      return NextResponse.json(
        {
          success: false,
          error: "Fichier audio ou identifiant du bijou manquant",
        },
        { status: 400 }
      )
    }

    if (isFinal) {
      const { data: existingVoice, error: existingVoiceError } = await supabase
        .from("voix_enregistrees")
        .select("id, is_locked")
        .eq("id_bijou", id_bijou)
        .maybeSingle()

      if (existingVoiceError) {
        return NextResponse.json(
          {
            success: false,
            error: "Erreur lecture enregistrement existant",
          },
          { status: 500 }
        )
      }

      if (existingVoice?.is_locked) {
        return NextResponse.json(
          {
            success: false,
            error: "MESSAGE_SCELLE",
          },
          { status: 409 }
        )
      }
    }

    const extension =
      file.name?.split(".").pop()?.toLowerCase() ||
      (file.type.includes("webm") ? "webm" : "webm")

    const folder = isFinal ? "voix" : "drafts"
    const fileName = `${Date.now()}.${extension}`
    const path = `recordings/${id_bijou}/${folder}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("tts")
      .upload(path, file, {
        contentType: file.type || "audio/webm",
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de l’upload audio",
          details: uploadError.message,
        },
        { status: 500 }
      )
    }

    const { data: publicData } = supabase.storage.from("tts").getPublicUrl(path)
    const audioUrl = publicData.publicUrl

    if (isFinal) {
      const dureeRaw = formData.get("duree")
      const enregistreurNomRaw = formData.get("enregistreur_nom")

      const duree =
        typeof dureeRaw === "string" && dureeRaw.trim() !== ""
          ? Number.parseInt(dureeRaw, 10)
          : null

      const enregistreur_nom =
        typeof enregistreurNomRaw === "string" && enregistreurNomRaw.trim() !== ""
          ? enregistreurNomRaw.trim()
          : null

      const { error: upsertError } = await supabase
        .from("voix_enregistrees")
        .upsert(
          {
            id_bijou,
            audio_url: audioUrl,
            duree: Number.isFinite(duree) ? duree : null,
            enregistreur_nom,
            is_locked: true,
          },
          {
            onConflict: "id_bijou",
          }
        )

      if (upsertError) {
        return NextResponse.json(
          {
            success: false,
            error: "Erreur base de données",
            details: upsertError.message,
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        audioUrl,
        final: isFinal,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur inattendue",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    )
  }
}