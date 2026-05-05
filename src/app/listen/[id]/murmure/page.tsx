import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getLocaleFromHost } from "@/lib/i18n";
import MurmureListenClient from "./MurmureListenClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const host = (await headers()).get("host");
  const locale = getLocaleFromHost(host);

  const { data: bijou } = await supabase
    .from("bijoux")
    .select("type_bijou")
    .eq("id_bijou", id)
    .maybeSingle();

  const jewelType = String(bijou?.type_bijou ?? "");

  if (jewelType === "voix_enregistree" || jewelType === "voix_enregistrée") {
    redirect(`/listen/recorded/${id}`);
  }

  if (jewelType && jewelType !== "murmures_IA") {
    redirect(`/listen/${id}`);
  }

  return <MurmureListenClient locale={locale} />;
}
