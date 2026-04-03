"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  loadMurmureDraft,
  saveMurmureDraft,
  type MurmureDraft,
} from "@/lib/murmures/setup-draft";
import { useSetupSealGuard } from "@/lib/useSetupSealGuard";
import { useLocale } from "@/lib/i18n";

const COPY = {
  fr: {
    loading: "Préparation...",
    kicker: "MURMURES IA · IDENTITÉ",
    title: "À qui destinez-vous ce murmure ?",
    errRequired: "Merci de renseigner le prénom et le lien.",
    placeholderName: "Prénom du destinataire",
    placeholderRelation: "Lien avec la personne (ex\u00a0: amie, partenaire, sœur…)",
    back: "Retour",
    next: "Continuer",
  },
  en: {
    loading: "Loading...",
    kicker: "AI WHISPERS · IDENTITY",
    title: "Who is this whisper for?",
    errRequired: "Please enter the first name and relationship.",
    placeholderName: "Recipient\u2019s first name",
    placeholderRelation: "Relationship (e.g. friend, partner, sister\u2026)",
    back: "Back",
    next: "Continue",
  },
};

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const isGuardChecking = useSetupSealGuard(id, "murmures");
  const locale = useLocale();
  const c = COPY[locale];

  const [draft, setDraft] = useState<MurmureDraft>(() => loadMurmureDraft(id || ""));
  const [error, setError] = useState<string | null>(null);

  function goNext() {
    if (!id) return;
    if (!draft) return;

    if (!draft.recipientFirstName.trim() || !draft.relationshipType.trim()) {
      setError(c.errRequired);
      return;
    }

    saveMurmureDraft(id, draft);
    router.push(`/setup/${id}/murmures/theme`);
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
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-10">
        <section className="w-full rounded-[2rem] border border-amber-200/15 bg-[rgba(28,18,12,0.78)] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-12">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">{c.kicker}</p>
          <h1 className="mt-6 text-4xl leading-[1.14] text-stone-100 md:text-5xl">{c.title}</h1>

          <div className="mt-10 grid gap-5">
            <input
              className="w-full rounded-2xl border border-amber-200/20 bg-black/20 px-5 py-4 text-xl text-stone-100 outline-none placeholder:text-stone-500"
              placeholder={c.placeholderName}
              value={draft.recipientFirstName}
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, recipientFirstName: e.target.value } : prev))
              }
            />

            <input
              className="w-full rounded-2xl border border-amber-200/20 bg-black/20 px-5 py-4 text-lg text-stone-100 outline-none placeholder:text-stone-500"
              placeholder={c.placeholderRelation}
              value={draft.relationshipType}
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, relationshipType: e.target.value } : prev))
              }
            />
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-300/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-3">
            <button
              className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm uppercase tracking-[0.22em] text-stone-100"
              onClick={() => router.push(`/setup/${id}/murmures`)}
            >
              {c.back}
            </button>
            <button
              className="rounded-full border border-amber-200/20 bg-amber-100 px-6 py-3 text-sm uppercase tracking-[0.22em] text-stone-950"
              onClick={goNext}
            >
              {c.next}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
