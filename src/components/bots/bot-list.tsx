"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BotStatusControl } from "./bot-status-control";
import { useTranslations } from "@/i18n/translation-context";
import { generateDiscordAuthUrl } from "@/lib/discord-utils";
import type { Bot } from "@/lib/bots-store";

type BotListProps = {
  bots: Bot[];
  originOptions: Record<string, string>;
  onDeleteSuccess?: (botId: string) => void;
};

export function BotList({
  bots,
  originOptions,
  onDeleteSuccess,
}: BotListProps) {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const tBots = useTranslations("bots");
  const commonLabels = tCommon("labels");
  const [deletingBotId, setDeletingBotId] = useState<string | null>(null);

  async function handleDelete(botId: string) {
    if (!confirm(tCommon("actions.confirmDelete") || "Are you sure you want to delete this bot?")) {
      return;
    }

    setDeletingBotId(botId);
    try {
      const res = await fetch(`/api/bots/${botId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Call the success callback if provided, passing the deleted bot ID
        if (onDeleteSuccess) {
          onDeleteSuccess(botId);
        } else {
          router.refresh();
        }
      } else {
        const data = await res.json();
        alert(data.error || "Falha ao remover bot");
      }
    } catch (error) {
      console.error("Failed to delete bot", error);
      alert("Falha ao remover bot");
    } finally {
      setDeletingBotId(null);
    }
  }

  return (
    <>

      {bots.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center text-sm text-slate-500">
          {tBots("emptyState")}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bots.map((bot) => (
            <article
              key={bot.id}
              className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow shadow-slate-950/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-800 bg-slate-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bot.avatarUrl}
                      alt={`${bot.name} avatar`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-100">
                      {bot.name}
                    </h3>
                    <p className="text-xs uppercase tracking-wide text-indigo-300">
                      {originOptions[bot.interactionOrigin as keyof typeof originOptions] ??
                        bot.interactionOrigin}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/bots/${bot.id}/edit`}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-indigo-500/20 hover:border-indigo-500/30"
                  >
                    {tCommon("actions.editBot") ?? "Edit"}
                  </Link>
                  <button
                    onClick={() => handleDelete(bot.id)}
                    disabled={deletingBotId === bot.id}
                    className="rounded-lg border border-red-700/50 bg-red-900/20 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 hover:border-red-500/50 disabled:opacity-50"
                  >
                    {deletingBotId === bot.id
                      ? tCommon("actions.deleting") ?? "Removendo..."
                      : tCommon("actions.delete") ?? "Remover"}
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-400">{bot.description}</p>
              <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold uppercase tracking-wide text-slate-400">
                    Status
                  </p>
                  <div className="flex-1">
                    <BotStatusControl bot={bot} />
                  </div>
                </div>
                <p className="font-semibold uppercase tracking-wide text-slate-400">
                  {commonLabels.webhookTarget}
                </p>
                <p className="truncate text-slate-200">{bot.webhookUrl}</p>
                <p className="font-semibold uppercase tracking-wide text-slate-400">
                  {commonLabels.guild}
                </p>
                <p className="text-slate-200">{bot.discord.guildId}</p>
                {bot.discord.applicationId && (() => {
                  const authUrl = generateDiscordAuthUrl(bot.discord.applicationId!);
                  return (
                    <>
                      <p className="font-semibold uppercase tracking-wide text-slate-400">
                        {tBots("card.authorizationUrl") ?? "URL de autorização"}
                      </p>
                      <a
                        href={authUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-indigo-400 transition hover:text-indigo-300 hover:underline"
                        title={authUrl}
                      >
                        {authUrl}
                      </a>
                    </>
                  );
                })()}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

