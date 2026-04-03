"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

const copy = {
  fr: {
    subtitle: "Choisissez le mode de creation du bijou.",
    idLabel: "Identifiant du bijou",
    idPlaceholder: "ex: fe3cb1ef-9898-4dab-b99c-47df816431e7",
    emptyError: "Entrez un identifiant de bijou pour continuer.",
    recorded: "Voix enregistree",
    murmures: "Murmures IA",
    hint: "Le domaine .fr affiche la version francaise.",
  },
  en: {
    subtitle: "Choose how this jewel will be created.",
    idLabel: "Jewel identifier",
    idPlaceholder: "e.g. fe3cb1ef-9898-4dab-b99c-47df816431e7",
    emptyError: "Enter a jewel identifier to continue.",
    recorded: "Recorded voice",
    murmures: "AI whispers",
    hint: "The .com domain shows the English version.",
  },
} as const;

type HomeClientProps = {
  locale: Locale;
};

export default function HomeClient({ locale }: HomeClientProps) {
  const router = useRouter();
  const [bijouId, setBijouId] = useState("");
  const [error, setError] = useState("");

  const t = copy[locale];

  function navigateTo(mode: "recorded" | "murmures") {
    const id = bijouId.trim();
    if (!id) {
      setError(t.emptyError);
      return;
    }

    setError("");
    if (mode === "recorded") {
      router.push(`/setup/${id}/firstname`);
      return;
    }

    router.push(`/setup/${id}/murmures`);
  }

  return (
    <main className="min-h-screen bg-[#14100d] text-[#f1ddc5] flex items-center justify-center p-6">
      <section className="w-full max-w-2xl rounded-3xl border border-[#6a4a2e]/60 bg-[#20160f]/90 shadow-2xl p-8 md:p-10">
        <p className="text-xs uppercase tracking-[0.22em] text-[#c6945a]">Grain atelier</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-semibold text-[#f3dfc8]">Mindwood</h1>
        <p className="mt-4 text-lg leading-relaxed text-[#dbc3a7]">{t.subtitle}</p>

        <div className="mt-8 rounded-2xl border border-[#6a4a2e]/50 bg-[#17100b] p-5">
          <label className="block text-sm text-[#caa47e]">{t.idLabel}</label>
          <input
            value={bijouId}
            onChange={(event) => setBijouId(event.target.value)}
            placeholder={t.idPlaceholder}
            className="mt-2 w-full rounded-xl border border-[#6a4a2e]/60 bg-[#100b08] px-4 py-3 text-[#f1ddc5] outline-none focus:border-[#c6945a]"
          />
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => navigateTo("recorded")}
              className="inline-flex items-center rounded-xl bg-[#c88952] px-4 py-2 font-semibold text-[#1f130c] hover:brightness-105"
            >
              {t.recorded}
            </button>
            <button
              onClick={() => navigateTo("murmures")}
              className="inline-flex items-center rounded-xl border border-[#8b633e] px-4 py-2 font-semibold text-[#e5c9a8] hover:bg-[#2a1c12]"
            >
              {t.murmures}
            </button>
          </div>

          <p className="mt-4 text-xs text-[#b8936c]">{t.hint}</p>
        </div>
      </section>
    </main>
  );
}
