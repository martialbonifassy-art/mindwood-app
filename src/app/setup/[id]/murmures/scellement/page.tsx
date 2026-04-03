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

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const isGuardChecking = useSetupSealGuard(id, "murmures");

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
          Preparation...
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
        throw new Error(json.error || "Impossible de sceller ce murmure.");
      }

      clearMurmureDraft(id);
      router.push(`/setup/${id}/murmures/scelle`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du scellement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#120d0a] text-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-10">
        <section className="w-full rounded-[2rem] border border-amber-200/15 bg-[rgba(28,18,12,0.78)] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-12">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">MURMURES IA · SCELLEMENT</p>
          <h1 className="mt-6 text-4xl leading-[1.14] text-stone-100 md:text-5xl">Sceller ce murmure</h1>

          <div className="mt-8 rounded-3xl border border-amber-200/20 bg-black/20 p-6 text-stone-200">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-400">Resume de l&apos;intention</p>
            <ul className="mt-4 grid gap-2 text-base leading-7">
              <li>Destinataire: {draft.recipientFirstName}</li>
              <li>Lien: {draft.relationshipType}</li>
              <li>Theme: {theme.label}</li>
              <li>Ton: {draft.tone}</li>
              <li>Intensite: {draft.emotionalIntensity}</li>
              <li>Longueur: {draft.lengthPreference}</li>
              <li>Effet recherche: {draft.desiredEffect}</li>
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
              Retour
            </button>
            <button
              className="rounded-full border border-amber-200/20 bg-amber-100 px-6 py-3 text-sm uppercase tracking-[0.22em] text-stone-950 disabled:opacity-50"
              onClick={seal}
              disabled={saving}
            >
              {saving ? "Scellement en cours..." : "Sceller ce murmure"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
