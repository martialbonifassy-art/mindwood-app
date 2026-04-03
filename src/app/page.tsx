import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#14100d] text-[#f1ddc5] flex items-center justify-center p-6">
      <section className="w-full max-w-2xl rounded-3xl border border-[#6a4a2e]/60 bg-[#20160f]/90 shadow-2xl p-8 md:p-10">
        <p className="text-xs uppercase tracking-[0.22em] text-[#c6945a]">Grain atelier</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-semibold text-[#f3dfc8]">Mindwood</h1>
        <p className="mt-4 text-lg leading-relaxed text-[#dbc3a7]">
          Cette ancienne page d&apos;accueil a ete retiree. Utilise uniquement ton lien
          direct recu par message.
        </p>

        <div className="mt-8 rounded-2xl border border-[#6a4a2e]/50 bg-[#17100b] p-5">
          <p className="text-sm text-[#caa47e]">Acces de test</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/listen/128586ba-6a83-4224-b255-e479399057e5/murmure"
              className="inline-flex items-center rounded-xl bg-[#c88952] px-4 py-2 font-semibold text-[#1f130c] hover:brightness-105"
            >
              Murmures IA
            </Link>
            <Link
              href="/listen/recorded/be0f3eed-d6a9-4df4-8d51-84cd32ba8a37"
              className="inline-flex items-center rounded-xl border border-[#8b633e] px-4 py-2 font-semibold text-[#e5c9a8] hover:bg-[#2a1c12]"
            >
              Voix enregistree
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
