"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useTranslations } from "@/i18n/translation-context";
import type { Bot } from "@/lib/bots-store";

type BotStatus = {
  botId: string;
  status: "online" | "offline" | "connecting" | "error";
  error?: string;
};

type BotStatusControlProps = {
  bot: Bot;
};

export function BotStatusControl({ bot }: BotStatusControlProps) {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const [status, setStatus] = useState<BotStatus["status"]>("offline");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/bots/${bot.id}/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status || "offline");
        setError(data.error);
      }
    } catch (err) {
      console.error("Failed to load bot status", err);
    }
  }, [bot.id]);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [loadStatus]);

  async function handleAction(action: "start" | "stop" | "restart") {
    setIsLoading(true);
    setError(undefined);
    try {
      const res = await fetch(`/api/bots/${bot.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Update status and error from response
        if (data.status) {
          setStatus(data.status);
        }
        if (data.error) {
          setError(data.error);
        }
        setTimeout(loadStatus, 1000); // Reload status after 1 second
        router.refresh();
      } else {
        setError(data.error || "Failed to perform action");
        // Also update status if provided
        if (data.status) {
          setStatus(data.status);
        }
      }
    } catch {
      setError("Failed to perform action");
    } finally {
      setIsLoading(false);
    }
  }

  const statusColors = {
    online: "bg-emerald-500",
    offline: "bg-slate-500",
    connecting: "bg-yellow-500",
    error: "bg-red-500",
  };

  return (
    <div className="flex items-center gap-2 group relative">
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${statusColors[status]}`}
          title={status}
        />
        <span className="text-xs text-slate-400 capitalize">{status}</span>
      </div>
      <div className="flex gap-1">
        {status === "offline" || status === "error" ? (
          <button
            onClick={() => handleAction("start")}
            disabled={isLoading}
            className="rounded px-2 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {tCommon("actions.start") ?? "Start"}
          </button>
        ) : (
          <button
            onClick={() => handleAction("stop")}
            disabled={isLoading}
            className="rounded px-2 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            {tCommon("actions.stop") ?? "Stop"}
          </button>
        )}
        {status !== "offline" && (
          <button
            onClick={() => handleAction("restart")}
            disabled={isLoading}
            className="rounded px-2 py-1 text-xs font-semibold text-yellow-300 transition hover:bg-yellow-500/20 disabled:opacity-50"
          >
            {tCommon("actions.restart") ?? "Restart"}
          </button>
        )}
      </div>
      {error && (
        <div className="flex flex-col items-end">
          <span className="text-xs text-red-400" title={error}>
            ⚠️
          </span>
          <div className="absolute mt-6 max-w-xs rounded-lg border border-red-700/50 bg-red-900/90 p-2 text-xs text-red-100 shadow-lg z-10 hidden group-hover:block">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}

