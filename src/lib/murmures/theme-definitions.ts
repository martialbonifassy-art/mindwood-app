import type { Locale } from "../i18n";

export type MurmureThemeId =
  | "presence"
  | "gratitude"
  | "souvenir"
  | "reconfort"
  | "elan"
  | "promesse";

export type MurmureTheme = {
  id: MurmureThemeId;
  label: string;
  promise: string;
  color: string;
  questions: string[];
};

export const MURMURE_THEMES: MurmureTheme[] = [
  {
    id: "presence",
    label: "Presence",
    promise: "Dire 'je suis la', meme dans le silence ou la distance.",
    color: "Douce, enveloppante, stable",
    questions: [
      "Que veux-tu que cette personne ressente en premier ?",
      "Dans ce moment de sa vie, qu'a-t-elle le plus besoin d'entendre ?",
      "Y a-t-il une distance entre vous aujourd'hui ?",
      "Veux-tu ancrer ce murmure dans un souvenir ou rester dans le present ?",
      "Y a-t-il un mot important a faire traverser dans le murmure ?",
      "Quel degre de pudeur souhaites-tu ?",
    ],
  },
  {
    id: "gratitude",
    label: "Gratitude",
    promise: "Remercier avec justesse et elegance.",
    color: "Lumineuse, sincere, reconnaissante",
    questions: [
      "Pour quoi veux-tu remercier cette personne ?",
      "Quelle qualite te touche le plus chez elle ?",
      "Veux-tu evoquer un geste ou un moment precis ?",
      "Si oui, de quoi s'agit-il ?",
      "Quel ton veux-tu pour ce merci ?",
      "Quelle impression doit rester apres l'ecoute ?",
    ],
  },
  {
    id: "souvenir",
    label: "Souvenir",
    promise: "Raviver un moment, un lieu, une sensation partagee.",
    color: "Sensorielle, delicate, incarnee",
    questions: [
      "Quel souvenir veux-tu faire revivre ?",
      "Ou ce souvenir se situe-t-il ?",
      "Quelle sensation lui est liee ?",
      "Ce souvenir appartient plutot a quelle periode ?",
      "Que represente ce souvenir aujourd'hui ?",
      "Veux-tu un murmure tres image, simple et sensible, nostalgique mais doux, ou lumineux et vivant ?",
    ],
  },
  {
    id: "reconfort",
    label: "Reconfort",
    promise: "Apaiser sans envahir.",
    color: "Rassurante, contenante, calme",
    questions: [
      "Quelle est la nature du moment traverse ?",
      "Que veux-tu surtout eviter dans ce murmure ?",
      "Qu'a-t-elle le plus besoin de recevoir ?",
      "Souhaites-tu parler directement de l'epreuve ?",
      "Quelle intensite veux-tu ?",
      "Comment le murmure doit-il se refermer ?",
    ],
  },
  {
    id: "elan",
    label: "Elan",
    promise: "Redonner souffle, courage, mouvement.",
    color: "Claire, confiante, inspirante",
    questions: [
      "Vers quoi cette personne avance-t-elle ?",
      "Qu'est-ce qui la freine le plus aujourd'hui ?",
      "Quelle force reconnais-tu en elle ?",
      "Ce murmure doit l'inviter a quoi ?",
      "Quel ton veux-tu donner ?",
      "Quelle sensation finale recherches-tu ?",
    ],
  },
  {
    id: "promesse",
    label: "Promesse",
    promise: "Sceller un lien dans le temps.",
    color: "Profonde, ceremonielle, precieuse",
    questions: [
      "Quelle forme prend cette promesse ?",
      "Ce lien est avant tout de quelle nature ?",
      "Veux-tu que la promesse soit explicite ou suggeree ?",
      "Quel mot resume ce pacte ?",
      "Dans quel registre veux-tu le murmure ?",
      "Quelle trace le murmure doit-il laisser ?",
    ],
  },
];

export const MURMURE_TONES = [
  "tendre",
  "apaisante",
  "lumineuse",
  "profonde",
  "poetique",
  "sobre",
] as const;

export const MURMURE_INTENSITIES = ["discret", "sensible", "intense"] as const;

export const MURMURE_LENGTHS = ["court", "moyen", "ample"] as const;

export const MURMURE_EFFECTS = [
  "un apaisement",
  "un sourire",
  "de la force",
  "un souvenir vivant",
  "un sentiment d'amour",
  "une presence durable",
] as const;

const THEME_LABELS_EN: Record<MurmureThemeId, string> = {
  presence: "Presence",
  gratitude: "Gratitude",
  souvenir: "Memory",
  reconfort: "Comfort",
  elan: "Momentum",
  promesse: "Promise",
};

const THEME_PROMISES_EN: Record<MurmureThemeId, string> = {
  presence: "Say 'I am here', even in silence or distance.",
  gratitude: "Express thanks with accuracy and grace.",
  souvenir: "Revive a moment, a place, a shared sensation.",
  reconfort: "Soothe without overwhelming.",
  elan: "Restore breath, courage, movement.",
  promesse: "Seal a bond through time.",
};

const THEME_QUESTIONS_EN: Record<MurmureThemeId, string[]> = {
  presence: [
    "What do you want this person to feel first?",
    "In this stage of life, what does this person most need to hear?",
    "Is there distance between you today?",
    "Do you want to anchor this whisper in a memory or stay in the present?",
    "Is there an important word to carry through this whisper?",
    "How much reserve and intimacy do you want?",
  ],
  gratitude: [
    "What do you want to thank this person for?",
    "Which quality touches you most in this person?",
    "Do you want to mention a specific gesture or moment?",
    "If yes, which one?",
    "What tone do you want for this thank-you?",
    "What feeling should remain after listening?",
  ],
  souvenir: [
    "Which memory do you want to bring back to life?",
    "Where does this memory take place?",
    "Which sensation is tied to it?",
    "Which period of life does this memory belong to?",
    "What does this memory represent today?",
    "Do you want a vivid whisper, simple and sensitive, nostalgic yet gentle, or bright and alive?",
  ],
  reconfort: [
    "What kind of moment is this person going through?",
    "What do you especially want to avoid in this whisper?",
    "What does this person most need to receive?",
    "Do you want to speak directly about the hardship?",
    "What intensity do you want?",
    "How should this whisper close?",
  ],
  elan: [
    "What is this person moving toward?",
    "What is holding this person back most today?",
    "Which strength do you recognize in this person?",
    "What should this whisper invite this person to do?",
    "What tone do you want to set?",
    "What final feeling are you looking for?",
  ],
  promesse: [
    "What form does this promise take?",
    "What is the nature of this bond first and foremost?",
    "Do you want the promise to be explicit or suggested?",
    "Which word sums up this pact?",
    "What register do you want for the whisper?",
    "What trace should this whisper leave behind?",
  ],
};

const VALUE_LABELS_EN: Record<string, string> = {
  tendre: "tender",
  apaisante: "soothing",
  lumineuse: "bright",
  profonde: "deep",
  poetique: "poetic",
  sobre: "subtle",
  discret: "subtle",
  sensible: "sensitive",
  intense: "intense",
  court: "short",
  moyen: "medium",
  ample: "long",
  "un apaisement": "a sense of calm",
  "un sourire": "a smile",
  "de la force": "strength",
  "un souvenir vivant": "a vivid memory",
  "un sentiment d'amour": "a feeling of love",
  "une presence durable": "a lasting presence",
};

export function getLocalizedTheme(theme: MurmureTheme, locale: Locale): MurmureTheme {
  if (locale === "fr") return theme;

  return {
    ...theme,
    label: THEME_LABELS_EN[theme.id] ?? theme.label,
    promise: THEME_PROMISES_EN[theme.id] ?? theme.promise,
    questions: THEME_QUESTIONS_EN[theme.id] ?? theme.questions,
  };
}

export function localizeMurmureValue(value: string, locale: Locale): string {
  if (locale === "fr") return value;
  return VALUE_LABELS_EN[value] ?? value;
}
