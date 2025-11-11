import { cookies } from "next/headers";

import { defaultLocale, isLocale, type Locale } from "./config";
import { dictionaries, type Messages } from "./messages";

export async function getLocaleFromCookies(): Promise<Locale> {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("locale")?.value;
  if (isLocale(rawLocale)) {
    return rawLocale;
  }
  return defaultLocale;
}

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export async function getI18n() {
  const locale = await getLocaleFromCookies();
  const messages = getMessages(locale);
  return { locale, messages };
}


