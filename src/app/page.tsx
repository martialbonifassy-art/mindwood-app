import { headers } from "next/headers";
import Link from "next/link";
import { getLocaleFromHost } from "@/lib/i18n";

export default async function Home() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const locale = getLocaleFromHost(host);

  const copy =
    locale === "en"
      ? {
          subtitle: "Open your jewel experience directly.",
          title: "Direct access",
          text: "No manual input is required.",
          hint: "English version (appadli.com)",
          businesses: "For businesses",
        }
      : {
          subtitle: "Ouvrez directement l'experience de votre bijou.",
          title: "Accès direct",
          text: "Aucune saisie manuelle n'est requise.",
          hint: "Version française (appadli.fr)",
          businesses: "Pour les entreprises",
        };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-transparent">
      <section className="w-full max-w-2xl mw-card p-8 md:p-10">
        <p className="text-xs uppercase tracking-widest mw-link mb-2">Grain atelier</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-semibold" style={{
          background: "linear-gradient(135deg, var(--gold) 0%, #f3dfc8 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>Mindwood</h1>
        <p className="mt-4 text-lg leading-relaxed mw-muted">{copy.subtitle}</p>

        <div className="mt-8 mw-panel p-6">
          <p className="text-sm uppercase tracking-wide mw-link">{copy.title}</p>
          <p className="mt-3 text-base leading-relaxed mw-muted">{copy.text}</p>
          <p className="mt-5 text-xs" style={{ color: "var(--gold)" }}>{copy.hint}</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/entreprises"
            className="mw-btn-primary inline-flex items-center justify-center px-6 py-3 text-sm uppercase tracking-[0.16em]"
          >
            {copy.businesses}
          </Link>
        </div>
      </section>
    </main>
  );
}
