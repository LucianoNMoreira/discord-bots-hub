"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BotList } from "./bot-list";
import { BotsControlPanel } from "./bots-control-panel";
import Link from "next/link";
import type { Bot } from "@/lib/bots-store";
import type { Messages } from "@/i18n/messages";
import { useTranslations } from "@/i18n/translation-context";

type BotsSectionProps = {
  bots: Bot[];
  originOptions: Record<string, string>;
  botsMessages: Messages["bots"];
};

export function BotsSection({
  bots: initialBots,
  originOptions,
  botsMessages,
}: BotsSectionProps) {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const [bots, setBots] = useState<Bot[]>(initialBots);

  // Update bots when initialBots changes (from server refresh)
  useEffect(() => {
    setBots(initialBots);
  }, [initialBots]);

  function handleDeleteSuccess(deletedBotId: string) {
    // Optimistically remove the bot from the list
    setBots((prevBots) => prevBots.filter((bot) => bot.id !== deletedBotId));
    // Also refresh the page to ensure consistency
    router.refresh();
  }

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100">
              {botsMessages.registeredTitle}
            </h2>
            <p className="text-sm text-slate-500">
              {botsMessages.registeredDescription}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/bots/new"
              className="rounded-lg border border-indigo-500/40 bg-indigo-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/30 hover:border-indigo-500/60"
            >
              {tCommon("actions.createBot") ?? "Create bot"}
            </Link>
            {bots.length > 0 && <BotsControlPanel />}
          </div>
        </div>
        <BotList
          bots={bots}
          originOptions={originOptions}
          onDeleteSuccess={(deletedBotId) => handleDeleteSuccess(deletedBotId)}
        />
      </section>
    </>
  );
}

