import Link from "next/link";
import { redirect } from "next/navigation";

import { LanguageSwitcher } from "@/components/language-switcher";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/bots");
  }

  const { messages } = await getI18n();
  const loginMessages = messages.login;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-12">
        <div className="mb-6 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/70 p-8 shadow-lg shadow-indigo-500/10 backdrop-blur">
          <div className="space-y-2 text-center">
            <p className="text-xs font-mono uppercase tracking-[0.5em] text-indigo-400">
              {loginMessages.heroTagline}
            </p>
            <h1 className="text-3xl font-semibold text-slate-50">
              {loginMessages.heroTitle}
            </h1>
            <p className="text-sm text-slate-400">
              {loginMessages.heroDescription}
            </p>
          </div>
          <LoginForm />
          <p className="text-center text-xs text-slate-500">
            {loginMessages.helpPrompt}{" "}
            <Link
              href="https://discord.com/developers/docs/intro"
              className="text-indigo-400 hover:text-indigo-300"
              target="_blank"
              rel="noreferrer"
            >
              {loginMessages.helpLinkText}
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}


