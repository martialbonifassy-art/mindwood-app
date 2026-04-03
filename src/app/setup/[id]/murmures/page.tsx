"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSetupSealGuard } from "@/lib/useSetupSealGuard";
import { useLocale } from "@/lib/i18n";

const COPY = {
  fr: {
    loading: "Préparation...",
    kicker: "MURMURES IA",
    title: "Façonnez une intention intime.",
    subtitle: "Vous allez préparer le murmure, puis le sceller dans le bijou pour qu\u2019il soit découvert plus tard.",
    cta: "Commencer le rituel",
  },
  en: {
    loading: "Loading...",
    kicker: "AI WHISPERS",
    title: "Shape an intimate intention.",
    subtitle: "You will prepare the whisper, then seal it in the jewel to be discovered later.",
    cta: "Begin the ritual",
  },
};

export default function Page() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const isGuardChecking = useSetupSealGuard(id, "murmures");
  const locale = useLocale();
  const c = COPY[locale];

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
        <section className="w-full rounded-[2rem] border border-amber-200/15 bg-[rgba(28,18,12,0.78)] p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-12">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">{c.kicker}</p>
          <h1 className="mt-6 text-4xl leading-[1.14] text-stone-100 md:text-6xl">
            {c.title}
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-stone-300 md:text-lg">
            {c.subtitle}
          </p>

          <div className="mt-14 flex justify-center">
            <Link
              href={`/setup/${id}/murmures/identite`}
              className="inline-flex items-center justify-center rounded-full border border-amber-200/20 bg-amber-100 px-7 py-3 text-sm uppercase tracking-[0.22em] text-stone-950 transition hover:bg-amber-50"
            >
              {c.cta}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
