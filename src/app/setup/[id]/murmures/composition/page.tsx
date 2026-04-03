"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getLocalizedTheme,
  localizeMurmureValue,
  MURMURE_EFFECTS,
  MURMURE_INTENSITIES,
  MURMURE_LENGTHS,
  MURMURE_TONES,
} from "@/lib/murmures/theme-definitions";
import {
  getMurmureTheme,
  loadMurmureDraft,
  saveMurmureDraft,
  type MurmureDraft,
} from "@/lib/murmures/setup-draft";
import { useSetupSealGuard } from "@/lib/useSetupSealGuard";
import { useLocale } from "@/lib/i18n";

const COPY = {
  fr: {
    loading: "Préparation...",
    kicker: "MURMURES IA · COMPOSITION",
    title: "Affinez la composition",
    chosenIntention: "Intention choisie : ",
    labelVoice: "Voix du message",
    voiceFemale: "Voix féminine",
    voiceMale: "Voix masculine",
    labelLength: "Longueur du message",
    lengthPrefix: "Longueur ",
    labelStyle: "Style du message",
    stylePrefix: "Message ",
    labelTone: "Tonalité émotionnelle",
    tonePrefix: "Tonalité ",
    back: "Retour",
    next: "Continuer",
  },
  en: {
    loading: "Loading...",
    kicker: "AI WHISPERS · COMPOSITION",
    title: "Refine the composition",
    chosenIntention: "Chosen intention: ",
    labelVoice: "Message voice",
    voiceFemale: "Female voice",
    voiceMale: "Male voice",
    labelLength: "Message length",
    lengthPrefix: "Length ",
    labelStyle: "Message style",
    stylePrefix: "Style ",
    labelTone: "Emotional tone",
    tonePrefix: "Tone ",
    back: "Back",
    next: "Continue",
  },
};

const CRITERIA_PLACEHOLDERS: Record<string, string[]> = {
  presence: [
    "Exemples: Qu'elle se sente rassuree et entouree / Qu'elle se sente comprise des la premiere phrase.",
    "Exemples: Qu'elle entende qu'elle n'est pas seule / Qu'elle ressente une presence fiable et calme.",
    "Exemples: Oui, on vit loin depuis quelques mois / Oui, on se voit moins souvent en ce moment.",
    "Exemples: Le souvenir du cafe du dimanche matin / Notre promenade au parc quand il pleuvait.",
    "Exemples: Je suis la / Tu peux compter sur moi.",
    "Exemples: Sobre et pudique / Chaleureux mais discret.",
  ],
  gratitude: [
    "Exemples: Merci pour ta patience dans les moments durs / Merci de m'avoir soutenue sans juger.",
    "Exemples: Ta douceur et ta constance / Ta maniere de rassurer en restant simple.",
    "Exemples: Oui, quand tu m'as accompagnee a l'hopital / Oui, quand tu es restee tard avec moi.",
    "Exemples: Le jour de mon demenagement / Le soir ou j'etais completement perdue.",
    "Exemples: Chaleureux et simple / Elegamment reconnaissant.",
    "Exemples: Un sourire calme et sincere / Une gratitude qui reste longtemps.",
  ],
  souvenir: [
    "Exemples: Notre balade au bord de la mer / Le trajet de nuit en voiture apres le concert.",
    "Exemples: A Biarritz, au coucher du soleil / Dans la cuisine de nos grands-parents.",
    "Exemples: L'odeur du vent sale et le rire / Le bruit de la pluie contre la vitre.",
    "Exemples: L'ete 2019 / Nos premiers mois a Paris.",
    "Exemples: Un repere qui me rend forte / Une preuve que notre lien traverse le temps.",
    "Exemples: Nostalgique mais lumineux / Tres image et sensible.",
  ],
  reconfort: [
    "Exemples: Une periode de fatigue et de doute / Un moment de tristesse apres une epreuve.",
    "Exemples: Eviter les phrases culpabilisantes / Eviter un ton trop donneur de lecon.",
    "Exemples: De la douceur et de la confiance / Un appui concret pour traverser la semaine.",
    "Exemples: Oui, mais tres delicatement / Non, plutot rester suggestif et tendre.",
    "Exemples: Moyenne, sans dramatiser / Douce et stable.",
    "Exemples: Sur une note d'apaisement / Avec une phrase qui redonne du souffle.",
  ],
  elan: [
    "Exemples: Elle lance son projet pro / Elle se prepare a une nouvelle etape de vie.",
    "Exemples: La peur d'echouer / Le manque de confiance au moment d'agir.",
    "Exemples: Son courage et sa creativite / Sa capacite a avancer meme quand c'est flou.",
    "Exemples: Faire un petit pas des demain / Oser envoyer ce message qu'elle repousse.",
    "Exemples: Energisant mais bienveillant / Clair, direct et encourageant.",
    "Exemples: Un elan clair et confiant / Une envie immediate de passer a l'action.",
  ],
  promesse: [
    "Exemples: Rester presents l'un pour l'autre / Se soutenir dans chaque saison de vie.",
    "Exemples: Un lien de couple profond / Une relation familiale tres solide.",
    "Exemples: Plutot suggeree, tres elegante / Explicite, avec des mots simples et forts.",
    "Exemples: Fidelite / Toujours.",
    "Exemples: Ceremoniel et intime / Solennel mais tres humain.",
    "Exemples: Une trace durable et paisible / Un sentiment de securite qui reste.",
  ],
};

function criteriaPlaceholder(themeId: string, index: number) {
  return CRITERIA_PLACEHOLDERS[themeId]?.[index] || "Exemple: Decrivez en une phrase concrete.";
}

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const isGuardChecking = useSetupSealGuard(id, "murmures");
  const locale = useLocale();
  const c = COPY[locale];

  const [draft, setDraft] = useState<MurmureDraft>(() => loadMurmureDraft(id || ""));

  useEffect(() => {
    if (!id) return;
    if (!draft.theme) {
      router.push(`/setup/${id}/murmures/theme`);
    }
  }, [id, draft.theme, router]);

  const theme = useMemo(() => getMurmureTheme(draft.theme), [draft.theme]);
  const localizedTheme = useMemo(
    () => (theme ? getLocalizedTheme(theme, locale) : null),
    [theme, locale],
  );

  if (isGuardChecking || !theme || !localizedTheme) {
    return (
      <main className="min-h-screen bg-[#120d0a] text-stone-100">
        <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-10">
          {c.loading}
        </div>
      </main>
    );
  }

  function onContinue() {
    if (!id || !draft) return;
    saveMurmureDraft(id, draft);
    router.push(`/setup/${id}/murmures/scellement`);
  }

  return (
    <main className="min-h-screen bg-[#120d0a] text-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-10">
        <section className="w-full rounded-[2rem] border border-amber-200/15 bg-[rgba(28,18,12,0.78)] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-12">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">{c.kicker}</p>
          <h1 className="mt-6 text-4xl leading-[1.14] text-stone-100 md:text-5xl">{c.title}</h1>
          <p className="mt-4 text-base text-stone-300">{c.chosenIntention}{localizedTheme.label}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-stone-400">{c.labelVoice}</label>
              <select
                className="rounded-2xl border border-amber-200/20 bg-black/20 px-4 py-3 text-stone-100"
                value={draft.voice}
                onChange={(e) =>
                  setDraft((prev) => (prev ? { ...prev, voice: e.target.value as "feminin" | "masculin" } : prev))
                }
              >
                <option value="feminin">{c.voiceFemale}</option>
                <option value="masculin">{c.voiceMale}</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-stone-400">{c.labelLength}</label>
              <select
                className="rounded-2xl border border-amber-200/20 bg-black/20 px-4 py-3 text-stone-100"
                value={draft.lengthPreference}
                onChange={(e) =>
                  setDraft((prev) => (prev ? { ...prev, lengthPreference: e.target.value as MurmureDraft["lengthPreference"] } : prev))
                }
              >
                {MURMURE_LENGTHS.map((v) => (
                  <option key={v} value={v}>{`${c.lengthPrefix}${localizeMurmureValue(v, locale)}`}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-stone-400">{c.labelStyle}</label>
              <select
                className="rounded-2xl border border-amber-200/20 bg-black/20 px-4 py-3 text-stone-100"
                value={draft.tone}
                onChange={(e) =>
                  setDraft((prev) => (prev ? { ...prev, tone: e.target.value as MurmureDraft["tone"] } : prev))
                }
              >
                {MURMURE_TONES.map((v) => (
                  <option key={v} value={v}>{`${c.stylePrefix}${localizeMurmureValue(v, locale)}`}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-stone-400">{c.labelTone}</label>
              <select
                className="rounded-2xl border border-amber-200/20 bg-black/20 px-4 py-3 text-stone-100"
                value={draft.emotionalIntensity}
                onChange={(e) =>
                  setDraft((prev) => (prev ? { ...prev, emotionalIntensity: e.target.value as MurmureDraft["emotionalIntensity"] } : prev))
                }
              >
                {MURMURE_INTENSITIES.map((v) => (
                  <option key={v} value={v}>{`${c.tonePrefix}${localizeMurmureValue(v, locale)}`}</option>
                ))}
              </select>
            </div>

            <select
              className="rounded-2xl border border-amber-200/20 bg-black/20 px-4 py-3 text-stone-100 sm:col-span-2"
              value={draft.desiredEffect}
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, desiredEffect: e.target.value as MurmureDraft["desiredEffect"] } : prev))
              }
            >
              {MURMURE_EFFECTS.map((v) => (
                <option key={v} value={v}>{localizeMurmureValue(v, locale)}</option>
              ))}
            </select>
          </div>

          <div className="mt-10 grid gap-4">
            {localizedTheme.questions.map((question, index) => (
              <div key={question} className="grid gap-2">
                <label className="text-sm text-stone-300">{question}</label>
                <input
                  className="rounded-2xl border border-amber-200/20 bg-black/20 px-4 py-3 text-stone-100"
                  value={draft.criteriaAnswers[index] || ""}
                  onChange={(e) =>
                    setDraft((prev) => {
                      const answers = [...prev.criteriaAnswers];
                      answers[index] = e.target.value;
                      return { ...prev, criteriaAnswers: answers };
                    })
                  }
                  placeholder={locale === "en" ? "Example: Describe in one concrete sentence." : criteriaPlaceholder(theme.id, index)}
                />
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <button
              className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm uppercase tracking-[0.22em] text-stone-100"
              onClick={() => router.push(`/setup/${id}/murmures/theme`)}
            >
              {c.back}
            </button>
            <button
              className="rounded-full border border-amber-200/20 bg-amber-100 px-6 py-3 text-sm uppercase tracking-[0.22em] text-stone-950"
              onClick={onContinue}
            >
              {c.next}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
