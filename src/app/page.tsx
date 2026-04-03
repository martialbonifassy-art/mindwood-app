import { headers } from "next/headers";
import { getLocaleFromHost } from "@/lib/i18n";
import HomeClient from "./HomeClient";

export default async function Home() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const locale = getLocaleFromHost(host);

  return <HomeClient locale={locale} />;
}
