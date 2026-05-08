import Link from "next/link";
import EntreprisesContactForm from "./EntreprisesContactForm";

const usages = [
  {
    title: "Cadeaux clients premium",
    body: "Offrez un objet élégant, durable et personnalisé à vos clients ou partenaires.",
    ideal:
      "entreprises, cabinets, agences, marques locales, commerces premium, clients fidèles.",
    detail:
      "La puce peut mener vers une vidéo de remerciement, un message du dirigeant, une présentation de votre entreprise ou une page dédiée à votre relation client.",
  },
  {
    title: "Séminaires et événements professionnels",
    body: "Créez un souvenir unique remis aux participants d’un séminaire, d’une convention, d’une inauguration ou d’un événement interne.",
    ideal:
      "agences événementielles, entreprises, offices de tourisme, lieux de réception, organisateurs de séminaires.",
    detail:
      "L’objet peut donner accès au programme, à une vidéo de l’événement, à une galerie photo, à une page partenaire ou à un message de bienvenue.",
  },
  {
    title: "Hôtellerie, tourisme et lieux d’accueil",
    body: "Proposez un objet d’accueil original qui prolonge l’expérience de vos visiteurs.",
    ideal:
      "hôtels, maisons d’hôtes, spas, domaines, offices de tourisme, lieux patrimoniaux.",
    detail:
      "La puce peut ouvrir une vidéo de bienvenue, l’histoire du lieu, des recommandations locales, une carte interactive, une page multilingue ou une présentation de vos services.",
  },
  {
    title: "Produits artisanaux, coffrets et créations uniques",
    body: "Associez un objet connecté à un produit ou à une création.",
    ideal:
      "artisans, domaines viticoles, producteurs locaux, fabricants de planches de surf, créateurs, marques de territoire.",
    detail:
      "Il peut devenir un certificat d’authenticité, une fiche produit premium ou un support racontant la fabrication, l’origine ou l’histoire d’une pièce.",
  },
  {
    title: "Mariages et événements privés",
    body: "Imaginez un souvenir invité en bois, gravé aux prénoms des mariés, à la date du mariage ou au thème de la cérémonie.",
    ideal:
      "wedding planners, lieux de réception, photographes, vidéastes, couples souhaitant un souvenir original.",
    detail:
      "La puce peut ouvrir une vidéo des mariés, un message de remerciement, le programme de la journée, une galerie photo ou une capsule émotionnelle à découvrir plus tard.",
  },
];

const nfcLinks = [
  "une vidéo de présentation",
  "un message du dirigeant",
  "un message de bienvenue",
  "une vidéo de remerciement",
  "une page personnalisée aux couleurs de votre marque",
  "un programme de séminaire ou d’événement",
  "une galerie photo",
  "une page multilingue",
  "une fiche produit",
  "une vidéo de fabrication",
  "un certificat d’authenticité",
  "une page de réservation",
  "une carte interactive",
  "une capsule temporelle",
  "une playlist, un souvenir audio ou un message vocal",
];

const objectDetails = [
  "choix de l’essence de bois",
  "forme de l’objet",
  "dimensions",
  "finition",
  "gravure",
  "intégration de la puce NFC",
  "ajout possible d’un QR code",
  "carte ou coffret d’accompagnement",
  "série limitée ou numérotée",
];

const visualDetails = [
  "logo de l’entreprise",
  "nom de marque",
  "prénom ou nom du client",
  "date d’événement",
  "message personnalisé",
  "lieu",
  "pictogramme ou motif",
  "univers graphique adapté à votre image",
];

const digitalDetails = [
  "lien vers une vidéo existante",
  "création d’une page dédiée",
  "page aux couleurs de votre marque",
  "message audio ou vidéo",
  "contenu multilingue",
  "page événementielle",
  "galerie photo",
  "contenu évolutif selon le projet",
];

const examples = [
  [
    "Pour un hôtel ou un spa",
    "Un objet d’accueil en bois, remis à l’arrivée ou placé dans la chambre, qui ouvre une vidéo de bienvenue, les services de l’établissement ou les recommandations locales.",
  ],
  [
    "Pour un office de tourisme",
    "Un objet connecté qui raconte le territoire : forêt landaise, océan, gastronomie, patrimoine, artisans locaux, parcours touristiques ou événements.",
  ],
  [
    "Pour un domaine viticole ou producteur local",
    "Un support connecté associé à une bouteille, un coffret ou une visite, permettant de découvrir l’histoire du domaine, la fabrication, une cuvée ou un message du producteur.",
  ],
  [
    "Pour un organisateur de mariage",
    "Un souvenir invité en bois, gravé et connecté à une vidéo des mariés, un message de remerciement ou une galerie photo.",
  ],
  [
    "Pour un fabricant de planches de surf",
    "Un certificat d’authenticité en bois, relié à une vidéo de fabrication, aux caractéristiques de la planche ou à l’histoire de l’atelier.",
  ],
  [
    "Pour une entreprise",
    "Un cadeau client ou collaborateur connecté à un message du dirigeant, une vidéo de vœux, une rétrospective annuelle ou une page personnalisée.",
  ],
] as const;

const reasons = [
  ["Un objet que l’on garde", "Contrairement aux supports de communication classiques, un objet en bois noble a une présence physique, chaleureuse et durable."],
  ["Une expérience simple", "Aucune application n’est nécessaire. Un simple scan avec un téléphone permet d’accéder au contenu."],
  ["Une image premium et authentique", "Le bois, la gravure et la personnalisation donnent à chaque création une dimension artisanale, élégante et humaine."],
  ["Un contenu vivant", "L’objet peut être relié à une vidéo, un message, une page ou une expérience digitale qui prolonge votre communication."],
  ["Une création adaptée à votre projet", "Chaque série peut être pensée selon votre usage, votre identité, votre budget et votre public."],
];

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3 text-sm leading-relaxed text-[rgba(247,240,230,0.84)] md:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="mw-panel px-4 py-3">
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function EntreprisesPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-5 py-6 md:px-8 md:py-10">
      <section className="mw-card overflow-hidden p-6 md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.32em] mw-link">Grain Atelier pour les entreprises</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-stone-50 md:text-6xl">
              Objets artisanaux connectés pour entreprises, événements et lieux d’exception
            </h1>
            <h2 className="mt-5 max-w-2xl text-xl leading-relaxed text-[rgba(247,240,230,0.9)] md:text-2xl">
              Offrez plus qu’un objet. Offrez une expérience de marque.
            </h2>
            <p className="mt-6 max-w-3xl text-base leading-8 mw-muted md:text-lg">
              Grain Atelier crée des objets en bois noble, façonnés artisanalement et personnalisés à l’image de votre entreprise.
              Chaque objet peut intégrer une puce NFC permettant d’accéder, d’un simple scan avec un téléphone, à une vidéo,
              un message, une page dédiée ou une expérience digitale personnalisée.
            </p>
            <p className="mt-5 max-w-3xl text-base leading-8 mw-muted md:text-lg">
              Un cadeau client, un souvenir d’événement, un support d’accueil ou un objet de communication qui associe la chaleur du bois,
              l’émotion d’un message et la simplicité du digital.
            </p>
            <p className="mt-6 text-sm uppercase tracking-[0.2em] text-[var(--gold)]">
              Objet en bois noble · Personnalisation · Puce NFC · Vidéo · Message · Expérience de marque
            </p>
          </div>

          <div className="flex w-full max-w-sm flex-col gap-3 lg:items-end">
            <Link
              href="/"
              className="mw-btn-ghost inline-flex items-center justify-center px-6 py-3 text-sm uppercase tracking-[0.16em]"
            >
              Retour à l’accueil
            </Link>
            <a
              href="#contact"
              className="mw-btn-primary inline-flex items-center justify-center px-6 py-3 text-sm uppercase tracking-[0.16em]"
            >
              Échanger sur votre projet
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="mw-card p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.28em] mw-link">Une nouvelle façon de raconter votre entreprise</p>
          <p className="mt-5 text-base leading-8 mw-muted">
            Aujourd’hui, les entreprises cherchent des supports plus authentiques, plus durables et plus mémorables pour communiquer
            avec leurs clients, partenaires, collaborateurs ou invités.
          </p>
          <p className="mt-4 text-base leading-8 mw-muted">
            Grain Atelier propose une alternative aux objets publicitaires classiques : un objet artisanal en bois, pensé pour être conservé,
            regardé, touché et scanné.
          </p>
          <p className="mt-4 text-base leading-8 mw-muted">
            Derrière chaque objet, il peut y avoir une histoire : celle d’une entreprise, d’un lieu, d’un événement, d’un produit,
            d’un savoir-faire ou d’un message personnel.
          </p>
          <p className="mt-4 text-base leading-8 text-stone-100">L’objet devient alors un lien entre le monde physique et le monde digital.</p>
        </div>

        <div className="mw-card p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.28em] mw-link">Ce que peut ouvrir la puce NFC</p>
          <div className="mt-5">
            <BulletList items={nfcLinks} />
          </div>
        </div>
      </section>

      <section className="mw-card p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.28em] mw-link">Comment ça fonctionne ?</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["1. Nous imaginons l’objet avec vous", "Nous définissons ensemble le type d’objet, son usage, son format, son essence de bois, sa gravure et le contenu digital à associer."],
            ["2. L’objet est personnalisé", "Votre logo, votre message, une date, un lieu, un prénom, un numéro de série ou un motif peuvent être gravés sur le bois."],
            ["3. Une puce NFC est intégrée", "La puce NFC permet d’ouvrir une vidéo, une page, un message ou une expérience digitale simplement en approchant un téléphone compatible."],
            ["4. Vos clients ou invités découvrent l’expérience", "Ils scannent l’objet et accèdent instantanément au contenu que vous souhaitez partager : vidéo de présentation, mot de remerciement, souvenir d’événement, programme, galerie photo ou page personnalisée."],
          ].map(([title, text]) => (
            <article key={title} className="mw-panel h-full p-5">
              <h3 className="text-lg font-semibold text-stone-50">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[rgba(247,240,230,0.84)]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mw-card p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.28em] mw-link">Pour quels usages ?</p>
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {usages.map((usage) => (
            <article key={usage.title} className="mw-panel p-5">
              <h3 className="text-2xl font-semibold text-stone-50">{usage.title}</h3>
              <p className="mt-4 text-base leading-8 mw-muted">{usage.body}</p>
              <p className="mt-4 text-base leading-8 mw-muted">{usage.detail}</p>
              <p className="mt-4 text-sm uppercase tracking-[0.18em] text-[var(--gold)]">Idéal pour : {usage.ideal}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-3">
        <div className="mw-card p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.28em] mw-link">Personnalisation · L’objet</p>
          <div className="mt-5">
            <BulletList items={objectDetails} />
          </div>
        </div>
        <div className="mw-card p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.28em] mw-link">Personnalisation · L’identité visuelle</p>
          <div className="mt-5">
            <BulletList items={visualDetails} />
          </div>
        </div>
        <div className="mw-card p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.28em] mw-link">Personnalisation · L’expérience digitale</p>
          <div className="mt-5">
            <BulletList items={digitalDetails} />
          </div>
        </div>
      </section>

      <section className="mw-card p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.28em] mw-link">Exemples d’applications</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {examples.map(([title, text]) => (
            <article key={title} className="mw-panel p-5">
              <h3 className="text-xl font-semibold text-stone-50">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[rgba(247,240,230,0.84)]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="mw-card p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.28em] mw-link">Pourquoi choisir Grain Atelier ?</p>
          <div className="mt-6 grid gap-4">
            {reasons.map(([title, text]) => (
              <article key={title} className="mw-panel p-5">
                <h3 className="text-xl font-semibold text-stone-50">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[rgba(247,240,230,0.84)]">{text}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mw-card p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.28em] mw-link">Une création locale dans les Landes</p>
          <h2 className="mt-3 text-3xl font-semibold text-stone-50">Montsoué, artisanat et récit numérique</h2>
          <p className="mt-5 text-base leading-8 mw-muted">
            Grain Atelier est situé à Montsoué, dans les Landes.
          </p>
          <p className="mt-4 text-base leading-8 mw-muted">
            Le projet s’inscrit dans une démarche artisanale, sensible et contemporaine : travailler la matière,
            valoriser le bois, créer des objets porteurs de sens et les relier à des histoires numériques simples à découvrir.
          </p>
          <div className="mt-8 rounded-[28px] border border-[rgba(255,220,170,0.14)] bg-[linear-gradient(135deg,rgba(255,228,190,0.08),rgba(196,158,108,0.02))] p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--gold)]">Vous avez un projet ?</p>
            <p className="mt-3 text-base leading-8 text-[rgba(247,240,230,0.88)]">
              Vous souhaitez créer un cadeau client, un souvenir de séminaire, un objet d’accueil, une série personnalisée ou une expérience de marque originale ?
            </p>
            <p className="mt-4 text-base leading-8 text-[rgba(247,240,230,0.88)]">
              Nous pouvons imaginer ensemble un objet adapté à votre entreprise, votre lieu, votre événement ou votre clientèle.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contact"
                className="mw-btn-primary inline-flex items-center justify-center px-6 py-3 text-sm uppercase tracking-[0.16em]"
              >
                Échanger sur votre projet
              </a>
              <a
                href="mailto:contact@grainatelier.fr"
                className="mw-btn-ghost inline-flex items-center justify-center px-6 py-3 text-sm uppercase tracking-[0.16em]"
              >
                Contactez-nous pour imaginer votre série personnalisée
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="contact">
        <EntreprisesContactForm />
      </section>

      <section className="flex flex-col items-center gap-3 pb-8 text-center">
        <Link
          href="/"
          className="mw-btn-ghost inline-flex items-center justify-center px-6 py-3 text-sm uppercase tracking-[0.16em]"
        >
          Retour à l’accueil
        </Link>
      </section>
    </main>
  );
}