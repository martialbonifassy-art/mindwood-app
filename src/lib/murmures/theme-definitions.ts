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
