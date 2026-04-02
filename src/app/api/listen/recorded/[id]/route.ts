import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
      .select('id_bijou, type_bijou')
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
        audioUrl: voice.audio_url,
        remainingListens: voice.lectures_restantes,
        textPreview: null,
        jewelType: bijou.type_bijou,
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