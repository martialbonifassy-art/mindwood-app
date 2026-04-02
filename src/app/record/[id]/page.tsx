'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams } from 'next/navigation'

type RecordPayload = {
  id_bijou: string
  prenom?: string | null
  langue?: 'fr' | 'en' | null
  type_bijou?: string | null
}

type RecordApiResponse = {
  success: boolean
  data?: RecordPayload
  error?: string
}

type SaveRecordResponse = {
  success: boolean
  data?: {
    audioUrl?: string | null
    final?: boolean
  }
  error?: string
}

type Stage =
  | 'boot'
  | 'arrival'
  | 'record'
  | 'review'
  | 'confirm_1'
  | 'confirm_3'
  | 'done_message'
  | 'done_close'
  | 'error'

const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 1.05, ease: [0.22, 1, 0.36, 1] as const },
}

const primaryButton =
  'inline-flex items-center justify-center rounded-full border border-amber-200/20 bg-amber-100 px-6 py-3 text-sm uppercase tracking-[0.22em] text-stone-950 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50'

const secondaryButton =
  'inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm uppercase tracking-[0.22em] text-stone-100 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40'

const MAX_SECONDS = 120

export default function RecordPage() {
  const params = useParams()
  const id = useMemo(() => String(params?.id ?? ''), [params])

  const [stage, setStage] = useState<Stage>('boot')
  const [payload, setPayload] = useState<RecordPayload | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [reviewUrl, setReviewUrl] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const reviewAudioRef = useRef<HTMLAudioElement | null>(null)

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

        const json = (await res.json()) as RecordApiResponse

        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error || 'Impossible de charger le bijou.')
        }

        if (!isMounted) return

        setPayload(json.data)
        setStage('arrival')
      } catch (error) {
        if (!isMounted) return
        setErrorMessage(
          error instanceof Error ? error.message : 'Une erreur est survenue.'
        )
        setStage('error')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    if (id) void load()

    return () => {
      isMounted = false
    }
  }, [id])

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      if (reviewUrl) URL.revokeObjectURL(reviewUrl)
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [reviewUrl])

  async function beginRecording() {
    try {
      setErrorMessage('')
      reviewAudioRef.current?.pause()

      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })

        setRecordedBlob(blob)

        if (reviewUrl) URL.revokeObjectURL(reviewUrl)
        const nextUrl = URL.createObjectURL(blob)
        setReviewUrl(nextUrl)

        setIsRecording(false)
        setStage('review')

        mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }

      recorder.start()
      setRecordSeconds(0)
      setIsRecording(true)
      setStage('record')

      timerRef.current = window.setInterval(() => {
        setRecordSeconds((prev) => {
          const next = prev + 1
          if (next >= MAX_SECONDS) {
            window.setTimeout(() => stopRecording(), 0)
            return MAX_SECONDS
          }
          return next
        })
      }, 1000)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Impossible d’accéder au microphone.'
      )
      setStage('error')
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  function restartRecording() {
    reviewAudioRef.current?.pause()
    setRecordedBlob(null)
    if (reviewUrl) URL.revokeObjectURL(reviewUrl)
    setReviewUrl(null)
    setRecordSeconds(0)
    setStage('arrival')
  }

  function handleCloseLink() {
    window.close()

    // Fallback for browsers that block window.close on non-script-opened tabs.
    window.setTimeout(() => {
      window.location.replace('about:blank')
    }, 180)
  }

  async function saveFinalRecording() {
    if (!recordedBlob) return

    try {
      setIsSaving(true)
      setErrorMessage('')

      const formData = new FormData()
      formData.append('audio', recordedBlob, `${Date.now()}.webm`)
      formData.append('id_bijou', id)
      formData.append('final', 'true')
      formData.append('duree', String(recordSeconds))
      if (payload?.prenom) {
        formData.append('enregistreur_nom', payload.prenom)
      }

      const res = await fetch('/api/record', {
        method: 'POST',
        body: formData,
      })

      const json = (await res.json()) as SaveRecordResponse

      if (!res.ok || !json.success) {
        if (json.error === 'MESSAGE_SCELLE') {
          throw new Error('Ce message est déjà scellé.')
        }
        throw new Error(json.error || 'Impossible d’enregistrer ce message.')
      }

      setStage('confirm_1')
      window.setTimeout(() => setStage('confirm_3'), 2200)
      window.setTimeout(() => setStage('done_message'), 4500)
      window.setTimeout(() => setStage('done_close'), 7800)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue lors de l’enregistrement final.'
      )
      setStage('error')
    } finally {
      setIsSaving(false)
    }
  }

  const language = payload?.langue === 'en' ? 'en' : 'fr'
  const remainingSeconds = Math.max(MAX_SECONDS - recordSeconds, 0)

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#120d0a] text-stone-100">
      <WoodBackground />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        <div className="mx-auto w-full max-w-3xl">
          {isLoading ? (
            <BootScreen />
          ) : (
            <AnimatePresence mode="wait">
              {stage === 'arrival' && (
                <motion.section key="arrival" {...fade} className="mx-auto max-w-2xl text-center">
                  <Eyebrow text="Grain Atelier" />
                  <h1 className="text-4xl leading-[1.15] text-stone-100 md:text-6xl">
                    {language === 'en'
                      ? 'A voice can now become a memory.'
                      : 'Une voix peut maintenant devenir un souvenir.'}
                  </h1>
                  <p className="mx-auto mt-8 max-w-xl text-base leading-8 text-stone-300 md:text-lg">
                    {language === 'en'
                      ? `You are about to record a message for ${payload?.prenom || 'someone dear'}. Take a moment. When you are ready, begin.`
                      : `Vous allez enregistrer un message pour ${payload?.prenom || 'quelqu’un de précieux'}. Prenez un instant. Quand vous êtes prêt, commencez. L'enregistrement débute dès que vous cliquez sur "Démarrer l’enregistrement" ci-dessous.`}
                  </p>
                  <div className="mt-14 flex justify-center">
                    <button className={primaryButton} onClick={() => void beginRecording()}>
                      {language === 'en' ? 'Start recording' : 'Démarrer l’enregistrement'}
                    </button>
                  </div>
                </motion.section>
              )}

              {stage === 'record' && (
                <motion.section key="record" {...fade} className="mx-auto max-w-2xl text-center">
                  <Eyebrow text={language === 'en' ? 'Recording' : 'Enregistrement'} />
                  <RecordingOrb active={isRecording} />
                  <p className="mt-10 text-5xl font-light tracking-[0.08em] text-stone-100">
                    {formatTime(recordSeconds)}
                  </p>
                  <p className="mt-3 text-sm uppercase tracking-[0.24em] text-stone-500">
                    {language === 'en'
                      ? `${formatTime(remainingSeconds)} remaining`
                      : `${formatTime(remainingSeconds)} restantes`}
                  </p>
                  <p className="mx-auto mt-6 max-w-lg text-base leading-8 text-stone-300 md:text-lg">
                    {language === 'en'
                      ? 'Speak slowly.'
                      : 'Parlez lentement.'}
                  </p>
                  <div className="mt-12 flex justify-center">
                    <button className={primaryButton} onClick={stopRecording}>
                      {language === 'en' ? 'Stop and listen back' : 'Arrêter et réécouter'}
                    </button>
                  </div>
                </motion.section>
              )}

              {stage === 'review' && reviewUrl && (
                <motion.section key="review" {...fade} className="mx-auto max-w-2xl text-center">
                  <Eyebrow text={language === 'en' ? 'Listen back' : 'Réécoute'} />
                  <h2 className="text-3xl leading-[1.25] text-stone-100 md:text-5xl">
                    {language === 'en'
                      ? 'Listen once, then decide.'
                      : 'Écoutez une fois, puis décidez.'}
                  </h2>
                  <p className="mx-auto mt-6 max-w-lg text-base leading-8 text-stone-300 md:text-lg">
                    {language === 'en'
                      ? 'If it feels right, seal it. If not, begin again gently.'
                      : 'Si cela sonne juste, scellez-le. Sinon, recommencez doucement.'}
                  </p>

                  <div className="mt-10 rounded-[1.8rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                    <audio ref={reviewAudioRef} controls className="w-full">
                      <source src={reviewUrl} type="audio/webm" />
                    </audio>
                  </div>

                  <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <button className={secondaryButton} onClick={restartRecording}>
                      {language === 'en' ? 'Record again' : 'Recommencer'}
                    </button>
                    <button className={primaryButton} onClick={() => void saveFinalRecording()} disabled={isSaving}>
                      {isSaving
                        ? language === 'en'
                          ? 'Sealing…'
                          : 'Scellement…'
                        : language === 'en'
                          ? 'Seal this message'
                          : 'Sceller ce message'}
                    </button>
                  </div>
                </motion.section>
              )}

              {stage === 'confirm_1' && (
                <ConfirmationScreen
                  key="confirm_1"
                  eyebrow={language === 'en' ? 'Transformation' : 'Transformation'}
                  title={language === 'en' ? 'Your message is becoming a memory.' : 'Votre message devient un souvenir.'}
                />
              )}

              {stage === 'confirm_3' && (
                <ConfirmationScreen
                  key="confirm_3"
                  eyebrow={language === 'en' ? 'Link' : 'Lien'}
                  title={language === 'en' ? 'It is now bound to the jewel.' : 'Il est maintenant lié au bijou.'}
                />
              )}

              {stage === 'done_message' && (
                <motion.section key="done_message" {...fade} className="mx-auto max-w-2xl text-center">
                  <Eyebrow text={language === 'en' ? 'Sealed' : 'Scellé'} />
                  <h2 className="text-4xl leading-[1.15] text-stone-100 md:text-6xl">
                    {language === 'en'
                      ? 'Your message is now sealed.'
                      : 'Votre message est désormais scellé.'}
                  </h2>
                  <p className="mx-auto mt-8 max-w-xl text-base leading-8 text-stone-300 md:text-lg">
                    {language === 'en'
                      ? 'Your message is sealed for eternity.'
                      : 'Votre message est scellé pour l’éternité.'}
                  </p>
                </motion.section>
              )}

              {stage === 'done_close' && (
                <motion.section key="done_close" {...fade} className="mx-auto max-w-2xl text-center">
                  <Eyebrow text={language === 'en' ? 'Completed' : 'Terminé'} />
                  <h2 className="text-4xl leading-[1.15] text-stone-100 md:text-6xl">
                    {language === 'en' ? 'Close this window.' : 'Fermer la fenêtre'}
                  </h2>
                </motion.section>
              )}

              {stage === 'error' && (
                <motion.section key="error" {...fade} className="mx-auto max-w-xl text-center">
                  <Eyebrow text={language === 'en' ? 'Problem' : 'Problème'} />
                  <h2 className="text-4xl leading-[1.2] text-stone-100">
                    {language === 'en'
                      ? 'The recording could not be completed.'
                      : 'L’enregistrement n’a pas pu être mené à son terme.'}
                  </h2>
                  <p className="mt-6 text-base leading-8 text-stone-300">
                    {errorMessage ||
                      (language === 'en'
                        ? 'Please try again in a quieter moment.'
                        : 'Essayez à nouveau dans un moment plus calme.')}
                  </p>
                  <div className="mt-10 flex justify-center">
                    <button className={primaryButton} onClick={handleCloseLink}>
                      {language === 'en' ? 'Close' : 'Fermer'}
                    </button>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </main>
  )
}

function ConfirmationScreen({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <motion.section {...fade} className="mx-auto max-w-2xl text-center">
      <Eyebrow text={eyebrow} />
      <motion.div
        animate={{ opacity: [0.45, 0.9, 0.45], scale: [1, 1.03, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        className="mx-auto mb-10 h-28 w-28 rounded-full border border-white/10 bg-white/5 shadow-[0_0_80px_rgba(255,220,180,0.08)]"
      />
      <h2 className="mx-auto max-w-xl text-4xl leading-[1.18] text-stone-100 md:text-6xl">
        {title}
      </h2>
    </motion.section>
  )
}

function RecordingOrb({ active }: { active: boolean }) {
  return (
    <div className="relative mx-auto h-44 w-44 md:h-56 md:w-56">
      {[0, 1, 2].map((ring) => (
        <motion.div
          key={ring}
          className="absolute inset-0 rounded-full border border-white/10"
          animate={
            active
              ? {
                  scale: [1, 1.15 + ring * 0.08, 1],
                  opacity: [0.18, 0.55, 0.18],
                }
              : {
                  scale: [1, 1.03, 1],
                  opacity: [0.18, 0.28, 0.18],
                }
          }
          transition={{
            duration: 2.8 + ring * 0.55,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: ring * 0.2,
          }}
        />
      ))}

      <motion.div
        animate={active ? { scale: [1, 1.06, 1] } : { scale: [1, 1.02, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-[18%] rounded-full bg-white/8 shadow-[0_0_120px_rgba(255,220,180,0.09)] backdrop-blur-sm"
      />
    </div>
  )
}

function BootScreen() {
  return (
    <motion.section
      {...fade}
      className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center"
    >
      <motion.div
        animate={{ opacity: [0.35, 0.85, 0.35], scale: [1, 1.03, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        className="h-24 w-24 rounded-full border border-white/10 bg-white/5 shadow-[0_0_80px_rgba(255,220,180,0.06)]"
      />
      <p className="mt-10 text-xs uppercase tracking-[0.38em] text-stone-500">
        Grain Atelier
      </p>
    </motion.section>
  )
}

function Eyebrow({ text }: { text: string }) {
  return <p className="mb-8 text-xs uppercase tracking-[0.38em] text-stone-500">{text}</p>
}

function WoodBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(196,145,92,0.14),transparent_35%),radial-gradient(circle_at_bottom,rgba(120,77,45,0.18),transparent_38%),linear-gradient(180deg,#120d0a_0%,#1a120e_48%,#0d0907_100%)]" />
      <div className="absolute inset-0 opacity-[0.05] [background-size:180px_180px] [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0.6px,transparent_0.7px)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(188,130,70,0.14),transparent_62%)] blur-3xl" />
    </div>
  )
}

function formatTime(value: number) {
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}