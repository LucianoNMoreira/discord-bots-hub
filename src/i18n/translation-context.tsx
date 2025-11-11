 "use client";

import { createContext, ReactNode, useContext } from "react";

import type { Locale } from "./config";
import type { Messages } from "./messages";

type TranslationContextValue = {
  locale: Locale;
  messages: Messages;
};

const TranslationContext = createContext<TranslationContextValue | null>(null);

export function TranslationProvider({
  locale,
  messages,
  children,
}: TranslationContextValue & { children: ReactNode }) {
  return (
    <TranslationContext.Provider value={{ locale, messages }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslationContext() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("Translation context is not available");
  }
  return context;
}

function formatValue<T>(
  value: T,
  params?: Record<string, string | number>,
): T {
  if (value === undefined || value === null) {
    return value;
  }
  if (typeof value === "string") {
    return value.replace(/\{(\w+)\}/g, (_match, key) =>
      params?.[key] !== undefined ? String(params[key]) : "",
    ) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === "string" ? formatValue(item, params) : item,
    ) as T;
  }
  return value;
}

export function useTranslations<N extends keyof Messages>(namespace: N) {
  const { messages } = useTranslationContext();
  const namespaceMessages = messages[namespace];

  return function translate(
    key: string,
    params?: Record<string, string | number>,
  ) {
    const segments = key.split(".");
    let value: unknown = namespaceMessages;
    for (const segment of segments) {
      if (
        typeof value === "object" &&
        value !== null &&
        segment in (value as Record<string, unknown>)
      ) {
        value = (value as Record<string, unknown>)[segment];
      } else {
        value = undefined;
        break;
      }
    }
    return formatValue(value, params);
  };
}

export function useLocale() {
  const { locale } = useTranslationContext();
  return locale;
}
