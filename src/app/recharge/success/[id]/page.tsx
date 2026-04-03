'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from '@/lib/i18n'

const COPY = {
  fr: {
    loadingMessage: 'Activation des écoutes en cours…',
    missingParams: 'Paramètres manquants. Revenez à la page précédente.',
    unknownError: 'Erreur inconnue',
    activatedRedirect: 'Les écoutes ont été activées. Redirection…',
    confirmPaymentError: 'Impossible de confirmer le paiement.',
    brand: 'Grain Atelier',
    loadingTitle: 'Le message reprend vie.',
    successTitle: 'C\'est fait.',
    errorTitle: 'Un problème est survenu.',
    backToSite: 'Revenir au site',
  },
  en: {
    loadingMessage: 'Activating listens…',
    missingParams: 'Missing parameters. Please return to the previous page.',
    unknownError: 'Unknown error',
    activatedRedirect: 'Listens activated. Redirecting…',
    confirmPaymentError: 'Unable to confirm payment.',
    brand: 'Grain Atelier',
    loadingTitle: 'Your message is coming back to life.',
    successTitle: 'Done.',
    errorTitle: 'Something went wrong.',
    backToSite: 'Back to site',
  },
}

export default function RechargeSuccessPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const searchParams = useSearchParams()
  const session_id = searchParams.get('session_id')
  const router = useRouter()
  const locale = useLocale()
  const c = COPY[locale]

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState(c.loadingMessage)

  useEffect(() => {
    setMessage(c.loadingMessage)
  }, [c.loadingMessage])

  useEffect(() => {
    if (!session_id || !id) {
      setStatus('error')
      setMessage(c.missingParams)
      return
    }

    async function confirm() {
      try {
        const res = await fetch('/api/stripe/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session_id }),
        })
        const json = await res.json()
        if (!res.ok || !json.ok) {
          throw new Error(json.error || c.unknownError)
        }
        setStatus('success')
        setMessage(c.activatedRedirect)
        setTimeout(() => {
          if (json.kind === 'lectures') {
            router.replace(`/listen/recorded/${id}`)
            return
          }

          router.replace(`/listen/${id}/murmure`)
        }, 1800)
      } catch (err: unknown) {
        setStatus('error')
        setMessage(
          err instanceof Error ? err.message : c.confirmPaymentError
        )
      }
    }

    void confirm()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session_id, id, c])

  return (
    <main className="min-h-screen bg-[#120d0a] text-stone-100 flex items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <p className="mb-6 text-xs uppercase tracking-[0.35em] text-stone-500">{c.brand}</p>

        {status === 'loading' && (
          <>
            <div className="mx-auto mb-8 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            <h1 className="text-3xl md:text-5xl leading-[1.3]">
              {c.loadingTitle}
            </h1>
            <p className="mt-6 text-base leading-8 text-stone-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1 className="text-3xl md:text-5xl leading-[1.3]">{c.successTitle}</h1>
            <p className="mt-6 text-base leading-8 text-stone-300">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-3xl md:text-5xl leading-[1.3]">{c.errorTitle}</h1>
            <p className="mt-6 text-base leading-8 text-stone-400">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-10 inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm tracking-[0.24em] text-stone-100 uppercase backdrop-blur-sm transition hover:bg-white/14"
            >
              {c.backToSite}
            </button>
          </>
        )}
      </div>
    </main>
  )
}