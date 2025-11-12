"use client";

import { useEffect, useState } from "react";

type CommandOption = {
  name: string;
  description: string;
  type: number;
  required?: boolean;
  choices?: Array<{ name: string; value: string | number }>;
  options?: CommandOption[];
};

type Command = {
  id: string;
  botId: string;
  name: string;
  description: string;
  type?: number;
  options?: CommandOption[];
  discordCommandId?: string;
  createdAt: string;
  updatedAt: string;
};

type CommandListProps = {
  botId: string;
  onEdit?: (commandId: string) => void;
  onRegister?: () => void;
};

export function CommandList({ botId, onEdit, onRegister }: CommandListProps) {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registerResult, setRegisterResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    loadCommands();
  }, [botId]);

  async function loadCommands() {
    try {
      setLoading(true);
      const response = await fetch(`/api/bots/${botId}/commands`);
      if (!response.ok) {
        throw new Error("Failed to load commands");
      }
      const data = await response.json();
      setCommands(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load commands");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(commandId: string) {
    if (!confirm("Tem certeza que deseja remover este comando?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/bots/${botId}/commands/${commandId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete command");
      }

      await loadCommands();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete command");
    }
  }

  async function handleRegister() {
    if (commands.length === 0) {
      setRegisterResult({
        success: false,
        message: "Nenhum comando para registrar",
      });
      return;
    }

    setRegistering(true);
    setRegisterResult(null);
    setError(null);

    try {
      const response = await fetch(`/api/bots/${botId}/commands/register`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to register commands");
      }

      const data = await response.json();
      setRegisterResult({
        success: true,
        message: `${data.registered} de ${data.total} comandos registrados com sucesso no Discord`,
      });

      // Reload commands to get updated Discord IDs
      await loadCommands();
      onRegister?.();
    } catch (err) {
      setRegisterResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to register commands",
      });
    } finally {
      setRegistering(false);
    }
  }

  const commandTypeLabels: Record<number, string> = {
    1: "Slash",
    2: "User",
    3: "Message",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-400">Carregando comandos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-50">Comandos</h3>
          <p className="text-sm text-slate-400">
            {commands.length} comando{commands.length !== 1 ? "s" : ""} cadastrado
            {commands.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleRegister}
          disabled={registering || commands.length === 0}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:bg-indigo-500/40"
        >
          {registering ? "Registrando..." : "Registrar no Discord"}
        </button>
      </div>

      {registerResult && (
        <div
          className={`rounded-md border px-3 py-2 text-xs ${
            registerResult.success
              ? "border-green-500 bg-green-500/10 text-green-200"
              : "border-red-500 bg-red-500/10 text-red-200"
          }`}
        >
          {registerResult.message}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-500 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {commands.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-8 text-center">
          <p className="text-sm text-slate-400">
            Nenhum comando cadastrado. Crie um comando usando o formulário acima.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {commands.map((command) => (
            <div
              key={command.id}
              className="rounded-lg border border-slate-800 bg-slate-950/70 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-50">
                      /{command.name}
                    </span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                      {commandTypeLabels[command.type ?? 1]}
                    </span>
                    {command.discordCommandId && (
                      <span className="rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-300">
                        Registrado
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {command.description}
                  </p>
                  {command.options && command.options.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-semibold text-slate-500">
                        Opções:
                      </p>
                      {command.options.map((option, idx) => (
                        <div key={idx} className="text-xs text-slate-400">
                          <span className="font-mono text-slate-300">
                            {option.name}
                          </span>
                          {option.required && (
                            <span className="ml-1 text-red-400">*</span>
                          )}
                          <span className="ml-1">- {option.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="ml-4 flex gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(command.id)}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
                    >
                      Editar
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(command.id)}
                    className="rounded-lg border border-red-700 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

