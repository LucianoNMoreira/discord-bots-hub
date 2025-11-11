"use server";

import { z } from "zod";
import { redirect } from "next/navigation";

import { clearSession, persistSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/server";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  redirectTo: z.string().optional(),
  locale: z.string().optional(),
});

export type LoginFormState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const result = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo"),
    locale: formData.get("locale"),
  });

  if (!result.success) {
    const locale =
      isLocale(formData.get("locale")) ? (formData.get("locale") as Locale) : defaultLocale;
    const messages = getMessages(locale);
    return { error: messages.login.errors.invalidPayload };
  }

  const { username, password, redirectTo, locale } = result.data;
  const targetLocale = isLocale(locale) ? locale : defaultLocale;
  const messages = getMessages(targetLocale);

  if (username !== env.AUTH_USERNAME || password !== env.AUTH_PASSWORD) {
    return { error: messages.login.errors.invalidCredentials };
  }

  await persistSession(username);

  redirect(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/bots");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}


