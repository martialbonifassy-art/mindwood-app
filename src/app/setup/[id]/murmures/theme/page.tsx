"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MURMURE_THEMES, getLocalizedTheme } from "@/lib/murmures/theme-definitions";
import {
  getMurmureTheme,
  loadMurmureDraft,
  saveMurmureDraft,
  type MurmureDraft,
} from "@/lib/murmures/setup-draft";
import { useSetupSealGuard } from "@/lib/useSetupSealGuard";
import { useLocale } from "@/lib/i18n";

const COPY = {
  fr: { loading: "Préparation...", kicker: "MURMURES IA · THÈME", title: "Choisissez l\u2019intention du murmure", back: "Retour", next: "Continuer" },
  en: { loading: "Loading...", kicker: "AI WHISPERS · THEME", title: "Choose the intention for the whisper", back: "Back", next: "Continue" },
};

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const isGuardChecking = useSetupSealGuard(id, "murmures");
  const locale = useLocale();
  const c = COPY[locale];

  const [draft, setDraft] = useState<MurmureDraft>(() => loadMurmureDraft(id || ""));

  function onContinue() {
    if (!id || !draft || !draft.theme) return;
    const theme = getMurmureTheme(draft.theme);
    if (!theme) return;

    const nextAnswers =
      draft.criteriaAnswers.length === theme.questions.length
        ? draft.criteriaAnswers
        : Array(theme.questions.length).fill("");

    saveMurmureDraft(id, { ...draft, criteriaAnswers: nextAnswers });
    router.push(`/setup/${id}/murmures/composition`);
  }

  if (isGuardChecking) {
    return (
      <main className="min-h-screen bg-[#120d0a] text-stone-100">
        <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-10">
            {c.loading}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#120d0a] text-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-10">
        <section className="w-full rounded-[2rem] border border-amber-200/15 bg-[rgba(28,18,12,0.78)] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-12">
            <p className="text-xs uppercase tracking-[0.35em] text-stone-500">{c.kicker}</p>
            <h1 className="mt-6 text-4xl leading-[1.14] text-stone-100 md:text-5xl">{c.title}</h1>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MURMURE_THEMES.map((theme) => {
              const displayTheme = getLocalizedTheme(theme, locale);
              return (
              <button
                key={theme.id}
                className={`rounded-3xl border p-5 text-left transition ${
                  draft.theme === theme.id
                    ? "border-amber-100/60 bg-amber-100/10"
                    : "border-amber-200/20 bg-black/15 hover:border-amber-100/40"
                }`}
                onClick={() => setDraft((prev) => (prev ? { ...prev, theme: theme.id } : prev))}
              >
                <div className="text-xl font-semibold text-stone-100">{displayTheme.label}</div>
                <div className="mt-2 text-sm leading-6 text-stone-300">{displayTheme.promise}</div>
              </button>
            )})}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <button
              className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm uppercase tracking-[0.22em] text-stone-100"
              onClick={() => router.push(`/setup/${id}/murmures/identite`)}
            >
                {c.back}
            </button>
            <button
              className="rounded-full border border-amber-200/20 bg-amber-100 px-6 py-3 text-sm uppercase tracking-[0.22em] text-stone-950 disabled:opacity-50"
              onClick={onContinue}
              disabled={!draft.theme}
            >
                {c.next}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
