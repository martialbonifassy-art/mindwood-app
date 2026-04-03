filepath = '/Users/bonifassy/mindwood-app/src/app/setup/[id]/murmures/composition/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

pairs = [
    (
        'import { useSetupSealGuard } from "@/lib/useSetupSealGuard";',
        'import { useSetupSealGuard } from "@/lib/useSetupSealGuard";\nimport { useLocale } from "@/lib/i18n";\n\nconst COPY = {\n  fr: {\n    loading: "Pr\u00e9paration...",\n    kicker: "MURMURES IA \u00b7 COMPOSITION",\n    title: "Affinez la composition",\n    chosenIntention: "Intention choisie\u00a0: ",\n    labelVoice: "Voix du message",\n    voiceFemale: "Voix f\u00e9minine",\n    voiceMale: "Voix masculine",\n    labelLength: "Longueur du message",\n    lengthPrefix: "Longueur ",\n    labelStyle: "Style du message",\n    stylePrefix: "Message ",\n    labelTone: "Tonalit\u00e9 \u00e9motionnelle",\n    tonePrefix: "Tonalit\u00e9 ",\n    back: "Retour",\n    next: "Continuer",\n  },\n  en: {\n    loading: "Loading...",\n    kicker: "AI WHISPERS \u00b7 COMPOSITION",\n    title: "Refine the composition",\n    chosenIntention: "Chosen intention: ",\n    labelVoice: "Message voice",\n    voiceFemale: "Female voice",\n    voiceMale: "Male voice",\n    labelLength: "Message length",\n    lengthPrefix: "Length ",\n    labelStyle: "Message style",\n    stylePrefix: "Style ",\n    labelTone: "Emotional tone",\n    tonePrefix: "Tone ",\n    back: "Back",\n    next: "Continue",\n  },\n};',
    ),
    (
        '  const isGuardChecking = useSetupSealGuard(id, "murmures");\n\n  const [draft, setDraft]',
        '  const isGuardChecking = useSetupSealGuard(id, "murmures");\n  const locale = useLocale();\n  const c = COPY[locale];\n\n  const [draft, setDraft]',
    ),
    (
        '          Preparation...',
        '          {c.loading}',
    ),
    (
        '          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">MURMURES IA \u00b7 COMPOSITION</p>\n          <h1 className="mt-6 text-4xl leading-[1.14] text-stone-100 md:text-5xl">Affinez la composition</h1>\n          <p className="mt-4 text-base text-stone-300">Intention choisie: {theme.label}</p>',
        '          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">{c.kicker}</p>\n          <h1 className="mt-6 text-4xl leading-[1.14] text-stone-100 md:text-5xl">{c.title}</h1>\n          <p className="mt-4 text-base text-stone-300">{c.chosenIntention}{theme.label}</p>',
    ),
    (
        '              <label className="text-xs uppercase tracking-[0.2em] text-stone-400">Voix du message</label>',
        '              <label className="text-xs uppercase tracking-[0.2em] text-stone-400">{c.labelVoice}</label>',
    ),
    (
        '                <option value="feminin">Voix feminine</option>\n                <option value="masculin">Voix masculine</option>',
        '                <option value="feminin">{c.voiceFemale}</option>\n                <option value="masculin">{c.voiceMale}</option>',
    ),
    (
        '              <label className="text-xs uppercase tracking-[0.2em] text-stone-400">Longueur du message</label>',
        '              <label className="text-xs uppercase tracking-[0.2em] text-stone-400">{c.labelLength}</label>',
    ),
    (
        '                  <option key={v} value={v}>{`Longueur ${v}`}</option>',
        '                  <option key={v} value={v}>{`${c.lengthPrefix}${v}`}</option>',
    ),
    (
        '              <label className="text-xs uppercase tracking-[0.2em] text-stone-400">Style du message</label>',
        '              <label className="text-xs uppercase tracking-[0.2em] text-stone-400">{c.labelStyle}</label>',
    ),
    (
        '                  <option key={v} value={v}>{`Message ${v}`}</option>',
        '                  <option key={v} value={v}>{`${c.stylePrefix}${v}`}</option>',
    ),
    (
        '              <label className="text-xs uppercase tracking-[0.2em] text-stone-400">Tonalite emotionnelle</label>',
        '              <label className="text-xs uppercase tracking-[0.2em] text-stone-400">{c.labelTone}</label>',
    ),
    (
        '                  <option key={v} value={v}>{`Tonalite ${v}`}</option>',
        '                  <option key={v} value={v}>{`${c.tonePrefix}${v}`}</option>',
    ),
    (
        '              onClick={() => router.push(`/setup/${id}/murmures/theme`)}\n            >\n              Retour',
        '              onClick={() => router.push(`/setup/${id}/murmures/theme`)}\n            >\n              {c.back}',
    ),
    (
        '              className="rounded-full border border-amber-200/20 bg-amber-100 px-6 py-3 text-sm uppercase tracking-[0.22em] text-stone-950"\n              onClick={onContinue}\n            >\n              Continuer',
        '              className="rounded-full border border-amber-200/20 bg-amber-100 px-6 py-3 text-sm uppercase tracking-[0.22em] text-stone-950"\n              onClick={onContinue}\n            >\n              {c.next}',
    ),
]

for old, new in pairs:
    count = content.count(old)
    if count:
        content = content.replace(old, new, 1)
        print(f'\u2713 {repr(old[:60])}')
    else:
        print(f'\u2717 NOT FOUND: {repr(old[:80])}')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done.')
