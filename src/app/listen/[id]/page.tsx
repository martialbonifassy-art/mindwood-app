import { headers } from "next/headers";
import { getLocaleFromHost } from "@/lib/i18n";
import ListenClient from "./ListenClient";

export default async function Page() {
  const host = (await headers()).get("host");
  const locale = getLocaleFromHost(host);
  return <ListenClient locale={locale} />;
}