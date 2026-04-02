'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'

type SetupResponse = {
  success: boolean
  data?: {
    id_bijou: string
    prenom?: string | null
    type_bijou?: string | null
    langue?: 'fr' | 'en' | null
  }
  error?: string
}

const fade = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
}

const primaryButton =
  'inline-flex items-center justify-center rounded-full border border-amber-200/20 bg-amber-100 px-6 py-3 text-sm uppercase tracking-[0.22em] text-stone-950 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50'

const secondaryButton =
  'inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm uppercase tracking-[0.22em] text-stone-100 transition hover:bg-white/15'

export default function SetupFirstNamePage() {
  const params = useParams()
  const router = useRouter()
  const id = useMemo(() => String(params?.id ?? ''), [params])

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [firstName, setFirstName] = useState('')
  const [language, setLanguage] = useState<'fr' | 'en'>('fr')

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        setIsLoading(true)
        setErrorMessage('')

        const res = await fetch(`/api/setup/${id}/firstname`, {
          method: 'GET',
          cache: 'no-store',
        })

        const json = (await res.json()) as SetupResponse

        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error || 'Impossible de charger ce bijou.')
        }

        if (!isMounted) return

        setFirstName(json.data.prenom ?? '')
        setLanguage(json.data.langue === 'en' ? 'en' : 'fr')
      } catch (error) {
        if (!isMounted) return
        setErrorMessage(
          error instanceof Error ? error.message : 'Une erreur est survenue.'
        )
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    if (id) void load()

    return () => {
      isMounted = false
    }
  }, [id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const prenom = firstName.trim()

    if (!prenom) {
      setErrorMessage('Veuillez renseigner un prénom.')
      return
    }

    if (prenom.length < 2) {
      setErrorMessage('Le prénom semble trop court.')
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage('')
      setSuccessMessage('')

      const res = await fetch(`/api/setup/${id}/firstname`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom }),
      })

      const json = (await res.json()) as SetupResponse

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Impossible d’enregistrer les informations.')
      }

      setSuccessMessage(language === 'en' ? 'Saved.' : 'Enregistré.')

      window.setTimeout(() => {
        router.push(`/record/${id}`)
      }, 900)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue lors de l’enregistrement.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#120d0a] text-stone-100">
      <WoodBackground />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        <motion.div
          {...fade}
          className="w-full max-w-2xl rounded-[2rem] border border-amber-200/10 bg-[rgba(24,14,10,0.72)] p-8 shadow-[0_0_80px_rgba(120,70,30,0.18)] backdrop-blur-xl md:p-12"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">
            Grain Atelier
          </p>

          <h1 className="mt-6 text-4xl leading-[1.15] text-stone-100 md:text-6xl">
            {language === 'en'
              ? 'The first name of the person who will receive this jewel.'
              : 'Enregistrez le prénom de la personne qui recevra ce bijou.'}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-stone-300 md:text-lg">
            {language === 'en'
              ? 'This first name helps you prepare the message before recording your voice.'
              : 'Ce prénom vous aide à préparer le message avant d’enregistrer votre voix.'}
          </p>

          {isLoading ? (
            <div className="mt-12 rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-sm uppercase tracking-[0.2em] text-stone-400">
              {language === 'en' ? 'Preparing…' : 'Préparation…'}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-12 space-y-8">
              <div className="space-y-3">
                <label
                  htmlFor="prenom"
                  className="block text-sm font-medium uppercase tracking-[0.18em] text-stone-400"
                >
                  {language === 'en' ? 'First name' : 'Prénom'}
                </label>

                <input
                  id="prenom"
                  name="prenom"
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={language === 'en' ? 'e.g. Emma' : 'ex : Emma'}
                  className="w-full rounded-[1.4rem] border border-amber-200/15 bg-black/20 px-5 py-5 text-2xl text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-100/40 focus:bg-black/25"
                  maxLength={40}
                />

                <p className="text-sm leading-7 text-stone-400">
                  {language === 'en'
                    ? 'A single first name is enough. This is the person who will receive the jewel.'
                    : 'Un seul prénom suffit. Il s’agit de la personne qui recevra le bijou.'}
                </p>
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-4 text-sm leading-7 text-red-100">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-4 text-sm leading-7 text-emerald-100">
                  {successMessage}
                </div>
              )}

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <button type="submit" className={primaryButton} disabled={isSaving}>
                  {isSaving
                    ? language === 'en'
                      ? 'Saving…'
                      : 'Enregistrement…'
                    : language === 'en'
                      ? 'Save'
                      : 'Enregistrer'}
                </button>

                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() => router.push(`/listen/${id}`)}
                >
                  {language === 'en' ? 'Back' : 'Retour'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </main>
  )
}

function WoodBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(196,145,92,0.14),transparent_35%),radial-gradient(circle_at_bottom,rgba(120,77,45,0.18),transparent_38%),linear-gradient(180deg,#120d0a_0%,#1a120e_48%,#0d0907_100%)]" />
      <div className="absolute inset-0 opacity-[0.05] [background-size:180px_180px] [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0.6px,transparent_0.7px)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(188,130,70,0.12),transparent_62%)] blur-3xl" />
    </div>
  )
}