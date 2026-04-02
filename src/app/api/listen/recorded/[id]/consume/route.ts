import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await req.json()
    const event = body?.event

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID manquant.' },
        { status: 400 }
      )
    }

    if (event !== 'play_started') {
      return NextResponse.json({ success: true, skipped: true })
    }

    const { data: voice, error: voiceError } = await supabase
      .from('voix_enregistrees')
      .select('id, lectures_restantes, lectures_totales')
      .eq('id_bijou', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (voiceError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur lecture voix enregistrée.',
          details: voiceError.message,
        },
        { status: 500 }
      )
    }

    if (!voice) {
      return NextResponse.json(
        { success: false, error: 'Voix enregistrée introuvable.' },
        { status: 404 }
      )
    }

    const currentCount = voice.lectures_restantes ?? 0

    if (currentCount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'PLUS_D_ECOUTES',
      }, { status: 403 })
    }

    const newCount = currentCount - 1
    const newTotal = (voice.lectures_totales ?? 0) + 1

    const { data: updated, error: updateError } = await supabase
      .from('voix_enregistrees')
      .update({
        lectures_restantes: newCount,
        lectures_totales: newTotal,
      })
      .eq('id', voice.id)
      .select('id, lectures_restantes, lectures_totales')
      .single()

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur mise à jour compteur.',
          details: updateError.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      remainingListens: updated.lectures_restantes,
      totalListens: updated.lectures_totales,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur.',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}