import { headers } from "next/headers";
import { getLocaleFromHost } from "@/lib/i18n";
import MurmureListenClient from "./MurmureListenClient";

export default async function Page() {
  const host = (await headers()).get("host");
  const locale = getLocaleFromHost(host);
  return <MurmureListenClient locale={locale} />;
}
