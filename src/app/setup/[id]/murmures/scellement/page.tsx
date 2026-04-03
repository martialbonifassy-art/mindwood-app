"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  clearMurmureDraft,
  getMurmureTheme,
  loadMurmureDraft,
  type MurmureDraft,
} from "@/lib/murmures/setup-draft";
import { useSetupSealGuard } from "@/lib/useSetupSealGuard";
import { useLocale } from "@/lib/i18n";

const COPY = {
  fr: {
    loading: "Préparation...",
    kicker: "MURMURES IA · SCELLEMENT",
    title: "Sceller ce murmure",
    summaryLabel: "Résumé de l’intention",
    labelRecipient: "Destinataire",
    labelRelation: "Lien",
    labelTheme: "Thème",
    labelTone: "Ton",
    labelIntensity: "Intensité",
    labelLength: "Longueur",
    labelEffect: "Effet recherché",
    errSeal: "Impossible de sceller ce murmure.",
    errGeneric: "Erreur lors du scellement.",
    back: "Retour",
    sealingBtn: "Scellement en cours...",
    sealBtn: "Sceller ce murmure",
  },
  en: {
    loading: "Loading...",
    kicker: "AI WHISPERS · SEALING",
    title: "Seal this whisper",
    summaryLabel: "Summary",
    labelRecipient: "Recipient",
    labelRelation: "Relationship",
    labelTheme: "Theme",
    labelTone: "Tone",
    labelIntensity: "Intensity",
    labelLength: "Length",
    labelEffect: "Desired effect",
    errSeal: "Unable to seal this whisper.",
    errGeneric: "Sealing error.",
    back: "Back",
    sealingBtn: "Sealing...",
    sealBtn: "Seal this whisper",
  },
};

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const isGuardChecking = useSetupSealGuard(id, "murmures");
  const locale = useLocale();
  const c = COPY[locale];

  const [draft, setDraft] = useState<MurmureDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loaded = loadMurmureDraft(id);
    if (!loaded.theme || !loaded.recipientFirstName.trim()) {
      router.push(`/setup/${id}/murmures/identite`);
      return;
    }
    setDraft(loaded);
  }, [id, router]);

  const theme = useMemo(() => (draft ? getMurmureTheme(draft.theme) : null), [draft]);

  if (isGuardChecking || !draft || !theme) {
    return (
      <main className="min-h-screen bg-[#120d0a] text-stone-100">
        <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-10">
          {c.loading}
        </div>
      </main>
    );
  }

  async function seal() {
    if (!id || !draft || !theme) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        recipientFirstName: draft.recipientFirstName,
        relationshipType: draft.relationshipType,
        language: draft.language,
        voice: draft.voice,
        tone: draft.tone,
        emotionalIntensity: draft.emotionalIntensity,
        lengthPreference: draft.lengthPreference,
        desiredEffect: draft.desiredEffect,
        theme: theme.id,
        themeLabel: theme.label,
        criteriaQuestions: theme.questions,
        criteriaAnswers: draft.criteriaAnswers,
      };

      const res = await fetch(`/api/murmures/${id}/seal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || c.errSeal);
      }

      clearMurmureDraft(id);
      router.push(`/setup/${id}/murmures/scelle`);
    } catch (err) {
      setError(err instanceof Error ? err.message : c.errGeneric);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#120d0a] text-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-10">
        <section className="w-full rounded-[2rem] border border-amber-200/15 bg-[rgba(28,18,12,0.78)] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-12">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">{c.kicker}</p>
          <h1 className="mt-6 text-4xl leading-[1.14] text-stone-100 md:text-5xl">{c.title}</h1>

          <div className="mt-8 rounded-3xl border border-amber-200/20 bg-black/20 p-6 text-stone-200">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-400">{c.summaryLabel}</p>
            <ul className="mt-4 grid gap-2 text-base leading-7">
              <li>{c.labelRecipient}: {draft.recipientFirstName}</li>
              <li>{c.labelRelation}: {draft.relationshipType}</li>
              <li>{c.labelTheme}: {theme.label}</li>
              <li>{c.labelTone}: {draft.tone}</li>
              <li>{c.labelIntensity}: {draft.emotionalIntensity}</li>
              <li>{c.labelLength}: {draft.lengthPreference}</li>
              <li>{c.labelEffect}: {draft.desiredEffect}</li>
            </ul>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-300/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-3">
            <button
              className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm uppercase tracking-[0.22em] text-stone-100"
              onClick={() => router.push(`/setup/${id}/murmures/composition`)}
              disabled={saving}
            >
              {c.back}
            </button>
            <button
              className="rounded-full border border-amber-200/20 bg-amber-100 px-6 py-3 text-sm uppercase tracking-[0.22em] text-stone-950 disabled:opacity-50"
              onClick={seal}
              disabled={saving}
            >
              {saving ? c.sealingBtn : c.sealBtn}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
