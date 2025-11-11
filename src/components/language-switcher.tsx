"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { locales } from "@/i18n/config";
import { useLocale, useTranslations } from "@/i18n/translation-context";

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const redirectTo =
    pathname +
    (searchParams.size > 0 ? `?${searchParams.toString()}` : "");

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value;

    startTransition(async () => {
      const response = await fetch("/api/locale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          locale: nextLocale,
        }),
      });

      if (!response.ok) {
        console.error("Failed to update locale");
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    });
  }

  return (
    <select
      name="locale"
      value={currentLocale}
      onChange={handleChange}
      disabled={isPending}
      className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {tCommon("languages")[locale]}
        </option>
      ))}
    </select>
  );
}
