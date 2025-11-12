"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CommandForm } from "@/components/bots/command-form";
import { CommandList } from "@/components/bots/command-list";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function BotCommandsPage({ params }: PageProps) {
  const [botId, setBotId] = useState<string | null>(null);
  const [editingCommandId, setEditingCommandId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Resolve params
  useEffect(() => {
    params.then((p) => setBotId(p.id));
  }, [params]);

  function handleSuccess() {
    setShowForm(false);
    setEditingCommandId(null);
    setRefreshKey((k) => k + 1);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingCommandId(null);
  }

  function handleEdit(commandId: string) {
    setEditingCommandId(commandId);
    setShowForm(true);
  }

  function handleNewCommand() {
    setEditingCommandId(null);
    setShowForm(true);
  }

  if (!botId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-50">
            Gerenciar Comandos
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Crie e gerencie comandos slash do Discord para este bot.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/bots/${botId}/edit`}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            Editar Bot
          </Link>
          <Link
            href="/bots"
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            Voltar
          </Link>
        </div>
      </div>

      {showForm ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow shadow-slate-950/40">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-50">
              {editingCommandId ? "Editar Comando" : "Novo Comando"}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {editingCommandId
                ? "Atualize as informações do comando."
                : "Crie um novo comando slash para o bot."}
            </p>
          </div>
          <CommandForm
            botId={botId}
            commandId={editingCommandId ?? undefined}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow shadow-slate-950/40">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-50">
                Lista de Comandos
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Gerencie os comandos do bot e registre-os no Discord.
              </p>
            </div>
            <button
              onClick={handleNewCommand}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              + Novo Comando
            </button>
          </div>
          <CommandList
            key={refreshKey}
            botId={botId}
            onEdit={handleEdit}
            onRegister={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      )}
    </div>
  );
}

