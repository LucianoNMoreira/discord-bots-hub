import { getMessages } from "./server";
import { defaultLocale, isLocale } from "./config";

export function formatMessage(
  template: string,
  params?: Record<string, string | number>,
) {
  if (!template) return template;
  return template.replace(/\{(\w+)\}/g, (_match, key) =>
    params?.[key] !== undefined ? String(params[key]) : "",
  );
}

export function getFormattedMessage(
  locale: string | undefined,
  namespace: string,
  key: string,
  params?: Record<string, string | number>,
) {
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  const messages = getMessages(safeLocale);
  const segments = [namespace, key];
  let value: unknown = messages;
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

  return typeof value === "string" ? formatMessage(value, params) : value;
}


