import Link from "next/link";

import { BotsSection } from "@/components/bots/bots-section";
import { getI18n } from "@/i18n/server";
import { listBots } from "@/lib/bots-store";

export default async function BotsPage() {
  const bots = await listBots();

  const { messages } = await getI18n();
  const botsMessages = messages.bots;
  const botFormMessages = messages.botForm;

  const guideSteps = botsMessages.guideSteps;
  const originOptions = botFormMessages.options.origins;

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-10 lg:col-span-8">
        <section className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold text-slate-50">
              {botsMessages.heroTitle}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {botsMessages.heroDescription}{" "}
              <Link
                className="text-indigo-300 underline-offset-2 hover:underline"
                href="https://n8n.io/"
                target="_blank"
                rel="noreferrer"
              >
                n8n
              </Link>
              .
            </p>
          </div>
          <BotsSection
            bots={bots}
            originOptions={originOptions}
            botsMessages={botsMessages}
          />
        </section>
      </div>

      <aside className="lg:col-span-4">
        <div className="sticky top-6 space-y-4">
          <details className="group rounded-lg border border-slate-800 bg-slate-950/40">
            <summary className="cursor-pointer p-4 text-sm font-semibold uppercase tracking-wide text-slate-300 transition-colors hover:text-slate-200">
              {botsMessages.guideTitle}
            </summary>
            <div className="space-y-4 border-t border-slate-800 p-4">
              <ol className="list-decimal space-y-2 pl-6 text-xs text-slate-400">
                {guideSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          </details>
          <details className="group rounded-lg border border-slate-800 bg-slate-950/40">
            <summary className="cursor-pointer p-4 text-sm font-semibold uppercase tracking-wide text-slate-300 transition-colors hover:text-slate-200">
              {botsMessages.intentsTitle}
            </summary>
            <div className="space-y-3 border-t border-slate-800 p-4">
              <p className="text-xs text-slate-400">
                {botsMessages.intentsDescription}
              </p>
              <ul className="list-disc space-y-1.5 pl-6 text-xs text-slate-400">
                {botsMessages.intentsList.map((intent, index) => (
                  <li key={index}>{intent}</li>
                ))}
              </ul>
              <p className="text-xs italic text-slate-500">
                {botsMessages.intentsNote}
              </p>
            </div>
          </details>
          <details className="group rounded-lg border border-slate-800 bg-slate-950/40">
            <summary className="cursor-pointer p-4 text-sm font-semibold uppercase tracking-wide text-slate-300 transition-colors hover:text-slate-200">
              {botsMessages.inviteTitle}
            </summary>
            <div className="space-y-3 border-t border-slate-800 p-4">
              <p className="text-xs text-slate-400">
                {botsMessages.inviteDescription}
              </p>
              <ol className="list-decimal space-y-2 pl-6 text-xs text-slate-400">
                {botsMessages.inviteSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          </details>
        </div>
      </aside>
    </div>
  );
}

