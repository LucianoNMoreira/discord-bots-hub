import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LanguageSwitcher } from "@/components/language-switcher";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/auth";
import { logoutAction } from "../(auth)/login/actions";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login?redirectTo=/bots");
  }

  const { messages, locale } = await getI18n();
  const common = messages.common;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20 text-lg font-bold text-indigo-300">
              DB
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-100">
                {common.appName}
              </p>
              <p className="text-xs text-slate-400">
                {common.tagline}
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm text-slate-300">
            <Link
              href="/bots"
              className="rounded-md px-3 py-2 font-medium text-indigo-300 transition hover:bg-indigo-500/10"
            >
              {common.nav.bots}
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md px-3 py-2 font-medium text-slate-300 transition hover:bg-red-500/10 hover:text-red-300"
              >
                {common.actions.signOut}
              </button>
            </form>
            <LanguageSwitcher key={locale} />
          </nav>
          <div className="hidden text-right text-xs sm:block">
            <p className="font-semibold text-slate-200">
              {session?.username ?? "operator"}
            </p>
            <p className="text-slate-500">{common.statuses.authenticated}</p>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
