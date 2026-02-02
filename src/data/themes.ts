export type Subtheme = {
  value: string;
  label: string;
  example: string;
};

export type Theme = {
  id: string;
  value: string;
  label: string;
  description: string;
  subthemes: Subtheme[];
};

export const THEMES: Theme[] = [
  {
    id: "amour",
    value: "Amour",
    label: "❤️ Amour",
    description:
      "Messages qui nourrissent la tendresse, la connexion et la profondeur des liens amoureux.",
    subthemes: [
      { value: "Pour ma femme", label: "Pour ma femme", example: "ex : Un message pour ma femme, pour lui rappeler combien elle compte après une période difficile." },
      { value: "Pour mon mari", label: "Pour mon mari", example: "ex : Un message pour mon mari, pour le remercier de tout ce qu’il fait au quotidien." },
      { value: "Sensualité complice", label: "Sensualité complice", example: "ex : Un murmure sensuel, délicat et suggestif entre deux adultes consentants, sans vulgarité." },
      { value: "Pour ma fiancée", label: "Pour ma fiancée", example: "ex : Un message tendre pour ma fiancée, à l’approche de notre mariage." },
      { value: "Pour mon fiancé", label: "Pour mon fiancé", example: "ex : Un message pour mon fiancé, pour l’encourager dans un nouveau projet." },
      { value: "Pour un amour secret", label: "Pour un amour secret", example: "ex : Un message discret pour quelqu’un que j’aime en silence." },
      { value: "Pour un amour ancien", label: "Pour un amour ancien", example: "ex : Un message pour un amour de jeunesse retrouvé." },
      { value: "Pour une relation naissante", label: "Pour une relation naissante", example: "ex : Un message pour accompagner les premiers pas d’une relation." },
      { value: "Pour un amour à distance", label: "Pour un amour à distance", example: "ex : Un message pour tenir le lien malgré les kilomètres." },
      { value: "Pour une occasion spéciale", label: "Pour une occasion spéciale", example: "ex : Un message pour notre anniversaire de mariage." }
    ]
  },
  {
    id: "gratitude",
    value: "Gratitude",
    label: "🌿 Gratitude",
    description:
      "Messages qui honorent la reconnaissance, les gestes invisibles et les présences qui nous soutiennent.",
    subthemes: [
      { value: "Gratitude envers un proche", label: "Envers un proche", example: "ex : Dire merci à une amie qui a été présente pendant une période compliquée." },
      { value: "Gratitude envers un parent", label: "Envers un parent", example: "ex : Remercier ma mère pour son soutien depuis l’enfance." },
      { value: "Gratitude envers un ami", label: "Envers un ami", example: "ex : Honorer une amitié de longue date." },
      { value: "Gratitude envers un mentor", label: "Envers un mentor", example: "ex : Remercier quelqu’un qui a guidé ma carrière." },
      { value: "Gratitude envers un collègue", label: "Envers un collègue", example: "ex : Remercier un collègue pour son aide sur un projet." },
      { value: "Gratitude universelle", label: "Gratitude envers la vie", example: "ex : Exprimer ma reconnaissance pour la vie, sans personne précise." }
    ]
  },
  {
    id: "guerison",
    value: "Guérison & apaisement",
    label: "🌊 Guérison & apaisement",
    description:
      "Messages qui offrent refuge et douceur dans les moments sensibles ou fragiles.",
    subthemes: [
      { value: "Apaisement après un conflit", label: "Après un conflit", example: "ex : Apaiser une tension avec quelqu’un que j’aime." },
      { value: "Guérison émotionnelle", label: "Guérison émotionnelle", example: "ex : Soutenir quelqu’un qui traverse une période intérieure difficile." },
      { value: "Accompagnement d’un deuil", label: "Accompagner un deuil", example: "ex : Accompagner une personne en deuil avec douceur." },
      { value: "Soutien stress ou angoisse", label: "Soutien dans le stress", example: "ex : Un message pour rassurer quelqu’un d’anxieux." },
      { value: "Après une séparation", label: "Après une séparation", example: "ex : Aider à traverser une rupture amoureuse." },
      { value: "Reprendre confiance", label: "Reprendre confiance", example: "ex : Redonner confiance après un échec." }
    ]
  },
  {
    id: "chemin_vie",
    value: "Chemin de vie & orientation",
    label: "🌌 Chemin de vie & orientation",
    description:
      "Messages qui éclairent les choix, transitions et carrefours intérieurs.",
    subthemes: [
      { value: "Prendre une décision", label: "Prendre une décision", example: "ex : Aider à choisir entre deux chemins professionnels." },
      { value: "Changer de voie", label: "Changer de voie", example: "ex : Accompagner une reconversion." },
      { value: "Trouver sa direction", label: "Trouver sa direction", example: "ex : Clarifier une période de doute existentiel." },
      { value: "Doute existentiel", label: "Doute existentiel", example: "ex : Un message pour quelqu’un qui remet tout en question." },
      { value: "Début d’un projet", label: "Début d’un projet", example: "ex : Encourager un nouveau projet créatif ou pro." },
      { value: "Recherche de clarté", label: "Recherche de clarté", example: "ex : Chercher des mots lucides sur une situation." }
    ]
  },
  {
    id: "courage",
    value: "Courage & dépassement",
    label: "🔥 Courage & dépassement",
    description:
      "Messages qui activent la force intérieure et la détermination.",
    subthemes: [
      { value: "Défi personnel", label: "Défi personnel", example: "ex : Soutenir quelqu’un qui se lance un challenge sportif." },
      { value: "Défi professionnel", label: "Défi professionnel", example: "ex : Encourager un changement de poste ou d’entreprise." },
      { value: "Surmonter une peur", label: "Surmonter une peur", example: "ex : Un message avant une prise de parole ou un examen." },
      { value: "Se lancer dans l’inconnu", label: "Se lancer dans l’inconnu", example: "ex : Partir vivre dans un autre pays." },
      { value: "Reprendre confiance", label: "Reprendre confiance", example: "ex : Retrouver l’élan après une déception." },
      { value: "Maintenir l’effort", label: "Maintenir l’effort", example: "ex : Rester motivé sur la durée d’un projet exigeant." }
    ]
  },
  {
    id: "creativite",
    value: "Créativité & inspiration",
    label: "🎨 Créativité & inspiration",
    description:
      "Messages qui ouvrent l’imaginaire et débloquent la création.",
    subthemes: [
      { value: "Blocage créatif", label: "Blocage créatif", example: "ex : Aider un artiste ou auteur en panne d’inspiration." },
      { value: "Début d’un projet artistique", label: "Début d’un projet artistique", example: "ex : Lancer un nouveau projet de peinture, musique…" },
      { value: "Inspiration quotidienne", label: "Inspiration quotidienne", example: "ex : Un petit souffle créatif chaque jour." },
      { value: "Recherche d’idées nouvelles", label: "Idées nouvelles", example: "ex : Générer des idées pour un projet." },
      { value: "Fatigue créative", label: "Fatigue créative", example: "ex : Redonner envie après une période de surmenage." },
      { value: "Explorations imaginaires", label: "Explorations imaginaires", example: "ex : Créer un univers symbolique pour rêver." }
    ]
  },
  {
    id: "reves",
    value: "Rêves & nuit",
    label: "🌙 Rêves & nuit",
    description:
      "Messages qui accompagnent l’endormissement et le monde onirique.",
    subthemes: [
      { value: "Aide à l’endormissement", label: "Aide à l’endormissement", example: "ex : Pour s’apaiser avant de dormir." },
      { value: "Rituels du soir", label: "Rituels du soir", example: "ex : Créer un moment doux avant la nuit." },
      { value: "Peur nocturne", label: "Accompagner les peurs nocturnes", example: "ex : Rassurer un enfant ou un adulte qui craint la nuit." },
      { value: "Rêves lucides", label: "Rêves lucides", example: "ex : Nourrir l’univers des rêves conscients." },
      { value: "Symbolique du rêve", label: "Symbolique du rêve", example: "ex : Donner du sens à un rêve marquant." },
      { value: "Préparer la nuit", label: "Préparer la nuit", example: "ex : Installer une atmosphère de calme et de confiance." }
    ]
  },
  {
    id: "presence",
    value: "Présence & pleine conscience",
    label: "🌬️ Présence & pleine conscience",
    description:
      "Messages qui ramènent au souffle, au corps et à l’instant présent.",
    subthemes: [
      { value: "Anxiété", label: "Anxiété", example: "ex : Ramener à la respiration en cas d’angoisse." },
      { value: "Accélération mentale", label: "Accélération mentale", example: "ex : Ralentir quand l’esprit tourne trop vite." },
      { value: "Ancrage corporel", label: "Ancrage corporel", example: "ex : Revenir dans le corps après une journée chargée." },
      { value: "Moment de pause", label: "Moment de pause", example: "ex : S’offrir un instant de pause consciente." },
      { value: "Retour au calme", label: "Retour au calme", example: "ex : Apaiser après une dispute ou un stress." },
      { value: "Respiration consciente", label: "Respiration consciente", example: "ex : Guider quelques respirations simples." }
    ]
  },
  {
    id: "gardien_bois",
    value: "Le Gardien du bois",
    label: "🪵 Le Gardien du bois",
    description:
      "Une voix ancienne, bienveillante, issue de l’esprit du bois, protectrice et naturelle.",
    subthemes: [
      { value: "Message protecteur", label: "Message protecteur", example: "ex : Un message qui veille sur quelqu’un." },
      { value: "Message ancestral", label: "Message ancestral", example: "ex : Donner l’impression d’un conseil très ancien." },
      { value: "Message de sagesse naturelle", label: "Sagesse naturelle", example: "ex : Parler comme si la forêt répondait." },
      { value: "Message d’enracinement", label: "Enracinement", example: "ex : Rappeler les forces profondes de la personne." },
      { value: "Message d’un esprit du bois", label: "Esprit du bois", example: "ex : Personnifier le bois comme un allié." },
      { value: "Connexion à la nature", label: "Connexion à la nature", example: "ex : Rappeler un lien à un lieu végétal." }
    ]
  },
  {
    id: "cycles",
    value: "Cycles & renouveau",
    label: "🌅 Cycles & renouveau",
    description:
      "Messages qui accompagnent fins, débuts et transformations.",
    subthemes: [
      { value: "Nouvelle étape", label: "Nouvelle étape", example: "ex : Entrer dans une nouvelle période de vie." },
      { value: "Renouveau après une épreuve", label: "Renouveau après épreuve", example: "ex : Se relever d’une difficulté récente." },
      { value: "Fin d’un cycle", label: "Fin d’un cycle", example: "ex : Clore une période, un travail, une relation." },
      { value: "Transition de vie", label: "Transition de vie", example: "ex : Déménagement, retraite, changement majeur." },
      { value: "Recommencer différemment", label: "Recommencer différemment", example: "ex : Ne plus refaire les mêmes schémas." },
      { value: "Se libérer du passé", label: "Se libérer du passé", example: "ex : Laisser derrière quelque chose de lourd." }
    ]
  },
  {
    id: "intuition",
    value: "Intuition & synchronicités",
    label: "🔮 Intuition & synchronicités",
    description:
      "Messages qui renforcent la petite voix intérieure et les signes.",
    subthemes: [
      { value: "Se reconnecter à son intuition", label: "Se reconnecter à son intuition", example: "ex : Oser écouter ce que l’on sent au fond." },
      { value: "Comprendre un signe", label: "Comprendre un signe", example: "ex : Donner du sens à un événement étrange." },
      { value: "S’ouvrir aux synchronicités", label: "S’ouvrir aux synchronicités", example: "ex : Se laisser guider par les coïncidences." },
      { value: "Décision au feeling", label: "Décision au feeling", example: "ex : Choisir avec le ressenti plutôt que la logique." },
      { value: "Moments étranges ou significatifs", label: "Moments étranges", example: "ex : Un moment qui semble chargé de sens." },
      { value: "Message symbolique", label: "Message symbolique", example: "ex : Faire parler une image, un animal, un rêve." }
    ]
  },
  {
    id: "projets",
    value: "Projets & objectifs",
    label: "🌄 Projets & objectifs",
    description:
      "Messages qui soutiennent l’élan, la vision et la motivation.",
    subthemes: [
      { value: "Lancer un projet", label: "Lancer un projet", example: "ex : Un nouveau projet pro ou perso." },
      { value: "Clarifier un objectif", label: "Clarifier un objectif", example: "ex : Mettre des mots sur ce que l’on veut vraiment." },
      { value: "Fixer une intention", label: "Fixer une intention", example: "ex : Poser une intention pour l’année qui vient." },
      { value: "Tenir le rythme", label: "Tenir le rythme", example: "ex : Rester régulier dans un apprentissage." },
      { value: "Dépasser un blocage", label: "Dépasser un blocage", example: "ex : Quand on n’arrive plus à avancer." },
      { value: "Devenir régulier", label: "Devenir régulier", example: "ex : Installer une pratique quotidienne." }
    ]
  },
  {
    id: "celebration",
    value: "Célébration & joie",
    label: "🎉 Célébration & joie",
    description:
      "Messages qui amplifient le plaisir et les bonnes nouvelles.",
    subthemes: [
      { value: "Anniversaire", label: "Anniversaire", example: "ex : Offrir un bijou pour un anniversaire important." },
      { value: "Réussite personnelle", label: "Réussite personnelle", example: "ex : Fêter un diplôme, un changement de vie." },
      { value: "Réussite professionnelle", label: "Réussite professionnelle", example: "ex : Célébrer une promotion, un projet abouti." },
      { value: "Bonne nouvelle", label: "Bonne nouvelle", example: "ex : Fêter une naissance, une nouvelle réjouissante." },
      { value: "Victoire d’équipe", label: "Victoire d’équipe", example: "ex : Remercier un groupe pour un succès commun." },
      { value: "Gratitude joyeuse", label: "Gratitude joyeuse", example: "ex : Mélanger merci + fête." }
    ]
  },
  {
    id: "calme",
    value: "Calme & sérénité",
    label: "🧘‍♀️ Calme & sérénité",
    description:
      "Messages qui apaisent le mental et invitent au repos profond.",
    subthemes: [
      { value: "Stress du quotidien", label: "Stress du quotidien", example: "ex : Apaiser quelqu’un pris dans le tourbillon." },
      { value: "Surcharge mentale", label: "Surcharge mentale", example: "ex : Quand tout semble trop." },
      { value: "Besoin de pause", label: "Besoin de pause", example: "ex : Inviter à ralentir." },
      { value: "Moment pour respirer", label: "Moment pour respirer", example: "ex : Créer un rituel de respiration." },
      { value: "Retrouver le calme", label: "Retrouver le calme", example: "ex : Après une journée très intense." },
      { value: "Après une longue journée", label: "Après une longue journée", example: "ex : Clore la journée avec douceur." }
    ]
  },
  {
    id: "connexion",
    value: "Connexion & lien aux autres",
    label: "🌐 Connexion & lien aux autres",
    description:
      "Messages qui renforcent les relations et la communication.",
    subthemes: [
      { value: "Mieux communiquer", label: "Mieux communiquer", example: "ex : Trouver les bons mots avant une conversation importante." },
      { value: "Retrouver un lien", label: "Retrouver un lien", example: "ex : Revenir vers quelqu’un après une période de silence." },
      { value: "Entretenir une relation", label: "Entretenir une relation", example: "ex : Nourrir un lien à distance ou au quotidien." },
      { value: "Améliorer une complicité", label: "Améliorer une complicité", example: "ex : Rendre un lien plus léger et joyeux." },
      { value: "Lien familial", label: "Lien familial", example: "ex : Frères, sœurs, parents, enfants." },
      { value: "Lien amical", label: "Lien amical", example: "ex : Honorer une amitié importante." }
    ]
  },
  {
    id: "confiance",
    value: "Confiance en soi",
    label: "🌟 Confiance en soi",
    description:
      "Messages qui renforcent la valeur personnelle et l’assurance.",
    subthemes: [
      { value: "Manque de confiance", label: "Manque de confiance", example: "ex : Quelqu’un qui doute constamment de lui." },
      { value: "Comparaison aux autres", label: "Comparaison aux autres", example: "ex : Se sentir moins bien que les autres." },
      { value: "Sentiment d’illégitimité", label: "Sentiment d’illégitimité", example: "ex : Syndrome de l’imposteur." },
      { value: "Avant un événement important", label: "Avant un événement important", example: "ex : Avant un oral, un spectacle, une présentation." },
      { value: "Reconstruire l’estime", label: "Reconstruire l’estime", example: "ex : Après une période de critiques ou d’échecs." },
      { value: "Prendre sa place", label: "Prendre sa place", example: "ex : Oser exister pleinement." }
    ]
  },
  {
    id: "difficultes",
    value: "Traverser les difficultés",
    label: "🔁 Traverser les difficultés",
    description:
      "Messages qui soutiennent dans les épreuves et les obstacles.",
    subthemes: [
      { value: "Soucis financiers", label: "Soucis financiers", example: "ex : Aider quelqu’un en difficulté matérielle." },
      { value: "Conflits relationnels", label: "Conflits relationnels", example: "ex : Quand les relations sont tendues." },
      { value: "Fatigue générale", label: "Fatigue générale", example: "ex : Soutenir quelqu’un épuisé." },
      { value: "Baisse d’énergie / humeur", label: "Baisse d’énergie / humeur", example: "ex : Petite dépression, lassitude." },
      { value: "Étape instable", label: "Étape instable", example: "ex : Période où tout change." },
      { value: "Sensation de perte de contrôle", label: "Perte de contrôle", example: "ex : Quand la personne a l’impression de ne plus maîtriser." }
    ]
  },
  {
    id: "alignement",
    value: "Alignement & authenticité",
    label: "🧭 Alignement & authenticité",
    description:
      "Messages qui encouragent à être soi-même et ajuster sa vie.",
    subthemes: [
      { value: "Se réaligner", label: "Se réaligner", example: "ex : Revenir à ce qui compte vraiment." },
      { value: "Vivre selon ses valeurs", label: "Vivre selon ses valeurs", example: "ex : Quand on sent un décalage entre ce qu’on fait et ce qu’on croit." },
      { value: "Quitter une situation fausse", label: "Quitter une situation fausse", example: "ex : Partir d’un travail ou d’une relation qui sonne faux." },
      { value: "Retrouver sa vérité", label: "Retrouver sa vérité", example: "ex : Revenir à soi après s’être oublié." },
      { value: "Dire non", label: "Dire non", example: "ex : Apprendre à poser des limites." },
      { value: "Se révéler", label: "Se révéler", example: "ex : Oser montrer qui on est vraiment." }
    ]
  },
  {
    id: "racines",
    value: "Racines & origines",
    label: "🌾 Racines & origines",
    description:
      "Messages qui honorent l’histoire personnelle et l’appartenance.",
    subthemes: [
      { value: "Famille", label: "Famille", example: "ex : Honorer une lignée familiale." },
      { value: "Héritage", label: "Héritage", example: "ex : Parler de ce qui nous a été transmis." },
      { value: "Histoire personnelle", label: "Histoire personnelle", example: "ex : Revenir sur un moment fondateur." },
      { value: "Souvenir d’enfance", label: "Souvenir d’enfance", example: "ex : Ramener un souvenir doux de l’enfance." },
      { value: "Lien au pays / à la terre", label: "Lien au pays / à la terre", example: "ex : Parler d’un lieu d’origine important." },
      { value: "Transmission", label: "Transmission", example: "ex : Faire passer un message à la génération suivante." }
    ]
  },
  {
    id: "energie",
    value: "Énergie & vitalité",
    label: "🔥 Énergie & vitalité",
    description:
      "Messages qui stimulent la joie de vivre et l’élan.",
    subthemes: [
      { value: "Fatigue physique", label: "Fatigue physique", example: "ex : Remettre un peu de soleil dans le corps." },
      { value: "Baisse d’énergie", label: "Baisse d’énergie", example: "ex : Quand la personne est à plat." },
      { value: "Manque d’enthousiasme", label: "Manque d’enthousiasme", example: "ex : Retrouver le goût des choses." },
      { value: "Relancer la motivation", label: "Relancer la motivation", example: "ex : Reprendre un projet qui s’endort." },
      { value: "Retrouver du tonus", label: "Retrouver du tonus", example: "ex : Refaire circuler l’énergie après une maladie." },
      { value: "Besoin d’élan", label: "Besoin d’élan", example: "ex : Un coup de boost symbolique." }
    ]
  }
];