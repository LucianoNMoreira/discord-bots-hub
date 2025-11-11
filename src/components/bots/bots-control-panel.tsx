"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useTranslations } from "@/i18n/translation-context";

export function BotsControlPanel() {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const [isLoading, setIsLoading] = useState(false);

  async function handleStartAll() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bots/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start-all" }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to start all bots", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStopAll() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bots/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop-all" }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to stop all bots", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleStartAll}
        disabled={isLoading}
        className="rounded-lg border border-emerald-700 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-50"
      >
        {tCommon("actions.startAll") ?? "Start all bots"}
      </button>
      <button
        onClick={handleStopAll}
        disabled={isLoading}
        className="rounded-lg border border-red-700 bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/30 disabled:opacity-50"
      >
        {tCommon("actions.stopAll") ?? "Stop all bots"}
      </button>
    </div>
  );
}

