import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type RecordingVariant = 'standard' | 'capsule'

type CapsuleMetadata = {
  variant?: RecordingVariant
  unlockAt?: string | null
  countdownMessageFr?: string
  countdownMessageEn?: string
}

function readCapsuleMetadata(raw: unknown): CapsuleMetadata {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}

  const capsule = (raw as { recorded_voice?: unknown }).recorded_voice
  if (!capsule || typeof capsule !== 'object' || Array.isArray(capsule)) return {}

  const source = capsule as Record<string, unknown>

  return {
    variant: source.variant === 'capsule' ? 'capsule' : 'standard',
    unlockAt: typeof source.unlockAt === 'string' ? source.unlockAt : null,
    countdownMessageFr:
      typeof source.countdownMessageFr === 'string' ? source.countdownMessageFr : undefined,
    countdownMessageEn:
      typeof source.countdownMessageEn === 'string' ? source.countdownMessageEn : undefined,
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de bijou manquant.' },
        { status: 400 }
      )
    }

    const { data: bijou, error: bijouError } = await supabase
      .from('bijoux')
      .select('id_bijou, type_bijou, langue, metadata')
      .eq('id_bijou', id)
      .maybeSingle()

    if (bijouError) {
      return NextResponse.json(
        { success: false, error: 'Erreur lecture bijou.' },
        { status: 500 }
      )
    }

    if (!bijou) {
      return NextResponse.json(
        { success: false, error: 'Bijou introuvable.' },
        { status: 404 }
      )
    }

    const serverNow = new Date().toISOString()
    const capsule = readCapsuleMetadata(bijou.metadata)
    const unlockAt = capsule.unlockAt ?? null
    const isCapsuleLocked =
      capsule.variant === 'capsule' &&
      Boolean(unlockAt) &&
      new Date(serverNow).getTime() < new Date(unlockAt as string).getTime()

    const { data: voice, error: voiceError } = await supabase
      .from('voix_enregistrees')
      .select('audio_url, lectures_restantes')
      .eq('id_bijou', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (voiceError) {
      return NextResponse.json(
        { success: false, error: 'Impossible de lire la voix enregistrée.' },
        { status: 500 }
      )
    }

    if (!voice?.audio_url) {
      return NextResponse.json(
        { success: false, error: 'Aucune voix enregistrée trouvée.' },
        { status: 404 }
      )
    }

    const { data: personnalisation, error: personnalisationError } = await supabase
      .from('personnalisations')
      .select('prenom')
      .eq('id_bijou', id)
      .limit(1)
      .maybeSingle()

    if (personnalisationError) {
      return NextResponse.json(
        { success: false, error: 'Erreur lecture personnalisation.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
        firstName: personnalisation?.prenom ?? null,
        audioUrl: isCapsuleLocked ? null : voice.audio_url,
        remainingListens: voice.lectures_restantes,
        textPreview: null,
        jewelType: bijou.type_bijou,
        serverNow,
        capsule: {
          variant: capsule.variant ?? 'standard',
          isLocked: isCapsuleLocked,
          unlockAt,
          countdownMessage:
            (bijou.langue ?? 'fr') === 'en'
              ? capsule.countdownMessageEn ?? null
              : capsule.countdownMessageFr ?? null,
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur inattendue.',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}