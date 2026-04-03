import { headers } from "next/headers";
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
          hint: "English version (.com)",
        }
      : {
          subtitle: "Ouvrez directement l'experience de votre bijou.",
          title: "Acces direct",
          text: "Aucune saisie manuelle n'est requise.",
          hint: "Version francaise (.fr)",
        };

  return (
    <main className="min-h-screen bg-[#14100d] text-[#f1ddc5] flex items-center justify-center p-6">
      <section className="w-full max-w-2xl rounded-3xl border border-[#6a4a2e]/60 bg-[#20160f]/90 shadow-2xl p-8 md:p-10">
        <p className="text-xs uppercase tracking-[0.22em] text-[#c6945a]">Grain atelier</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-semibold text-[#f3dfc8]">Mindwood</h1>
        <p className="mt-4 text-lg leading-relaxed text-[#dbc3a7]">{copy.subtitle}</p>

        <div className="mt-8 rounded-2xl border border-[#6a4a2e]/50 bg-[#17100b] p-6">
          <p className="text-sm uppercase tracking-[0.12em] text-[#d3a774]">{copy.title}</p>
          <p className="mt-3 text-base leading-relaxed text-[#dfc5a8]">{copy.text}</p>
          <p className="mt-5 text-xs text-[#b8936c]">{copy.hint}</p>
        </div>
      </section>
    </main>
  );
}
