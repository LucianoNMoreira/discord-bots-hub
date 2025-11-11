"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";

import { useLocale, useTranslations } from "@/i18n/translation-context";

import { loginAction, type LoginFormState } from "./actions";

const initialState: LoginFormState = {};

export function LoginForm() {
  const tCommon = useTranslations("common");
  const tLogin = useTranslations("login");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const loginFields = tLogin("fields") as { username: string; password: string };
  const placeholders = tCommon("placeholders") as { username: string; password: string };
  const actions = tCommon("actions") as { loginSubmit: string; loginSubmitting: string };

  return (
    <form className="w-full space-y-6" action={formAction}>
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input type="hidden" name="locale" value={locale} />
      <div className="space-y-2">
        <label
          htmlFor="username"
          className="text-sm font-medium text-slate-200 uppercase tracking-wide"
        >
          {loginFields.username}
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          placeholder={placeholders.username}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-slate-200 uppercase tracking-wide"
        >
          {loginFields.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder={placeholders.password}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          disabled={isPending}
        />
      </div>
      {state?.error ? (
        <p className="rounded-md border border-red-500 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        className="w-full rounded-lg bg-indigo-500 px-4 py-2 font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-indigo-500/50"
        disabled={isPending}
      >
        {isPending
          ? actions.loginSubmitting
          : actions.loginSubmit}
      </button>
    </form>
  );
}


