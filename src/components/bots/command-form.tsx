"use client";

import { FormEvent, useEffect, useState } from "react";

type ApiError = {
  error: string;
};

type FormState = {
  loading: boolean;
  error?: string;
  success?: string;
};

type CommandOption = {
  name: string;
  description: string;
  type: number;
  required?: boolean;
  choices?: Array<{ name: string; value: string | number }>;
  options?: CommandOption[];
};

type CommandData = {
  id: string;
  botId: string;
  name: string;
  description: string;
  type?: number;
  options?: CommandOption[];
  discordCommandId?: string;
};

const commandTypes = [
  { value: 1, label: "Chat Input (Slash Command)" },
  { value: 2, label: "User Command" },
  { value: 3, label: "Message Command" },
];

const optionTypes = [
  { value: 1, label: "Sub Command" },
  { value: 2, label: "Sub Command Group" },
  { value: 3, label: "String" },
  { value: 4, label: "Integer" },
  { value: 5, label: "Boolean" },
  { value: 6, label: "User" },
  { value: 7, label: "Channel" },
  { value: 8, label: "Role" },
  { value: 9, label: "Mentionable" },
  { value: 10, label: "Number" },
  { value: 11, label: "Attachment" },
];

type CommandFormProps = {
  botId: string;
  commandId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function CommandForm({
  botId,
  commandId,
  onSuccess,
  onCancel,
}: CommandFormProps) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: 1,
    options: [] as CommandOption[],
  });
  const [state, setState] = useState<FormState>({ loading: false });
  const [isLoadingCommand, setIsLoadingCommand] = useState(false);

  const isEditMode = !!commandId;

  // Load command data when in edit mode
  useEffect(() => {
    if (commandId) {
      setIsLoadingCommand(true);
      setState({ loading: false });
      fetch(`/api/bots/${botId}/commands/${commandId}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to load command: ${res.status}`);
          }
          return res.json();
        })
        .then((data: CommandData) => {
          setForm({
            name: data.name || "",
            description: data.description || "",
            type: data.type ?? 1,
            options: data.options || [],
          });
        })
        .catch((error) => {
          console.error("Error loading command:", error);
          setState({
            loading: false,
            error: error instanceof Error ? error.message : "Failed to load command",
          });
        })
        .finally(() => {
          setIsLoadingCommand(false);
        });
    }
  }, [commandId, botId]);

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    // Convert command name and option names to lowercase automatically
    let processedValue: string | number = value;
    if (name === "name") {
      processedValue = value.toLowerCase();
    } else if (name === "type") {
      processedValue = parseInt(value, 10);
    }
    setForm((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  }

  function addOption() {
    setForm((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        {
          name: "",
          description: "",
          type: 3, // String by default
          required: false,
        },
      ],
    }));
  }

  function removeOption(index: number) {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  }

  function updateOption(index: number, field: keyof CommandOption, value: unknown) {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index
          ? {
              ...opt,
              [field]:
                field === "name" && typeof value === "string"
                  ? value.toLowerCase()
                  : value,
            }
          : opt,
      ),
    }));
  }

  function addChoice(optionIndex: number) {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === optionIndex
          ? {
              ...opt,
              choices: [...(opt.choices || []), { name: "", value: "" }],
            }
          : opt,
      ),
    }));
  }

  function removeChoice(optionIndex: number, choiceIndex: number) {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === optionIndex
          ? {
              ...opt,
              choices: opt.choices?.filter((_, ci) => ci !== choiceIndex),
            }
          : opt,
      ),
    }));
  }

  function updateChoice(
    optionIndex: number,
    choiceIndex: number,
    field: "name" | "value",
    value: string | number,
  ) {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === optionIndex
          ? {
              ...opt,
              choices: opt.choices?.map((choice, ci) =>
                ci === choiceIndex ? { ...choice, [field]: value } : choice,
              ),
            }
          : opt,
      ),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setState({ loading: true });
    try {
      const url = isEditMode
        ? `/api/bots/${botId}/commands/${commandId}`
        : `/api/bots/${botId}/commands`;
      const method = isEditMode ? "PUT" : "POST";

      const payload = {
        name: form.name,
        description: form.description,
        type: form.type,
        options: form.options.length > 0 ? form.options : undefined,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | ApiError
          | null;
        throw new Error(
          payload?.error ??
            (isEditMode ? "Failed to update command" : "Failed to create command"),
        );
      }

      setState({
        loading: false,
        success: isEditMode
          ? "Comando atualizado com sucesso"
          : "Comando criado com sucesso",
      });

      if (!isEditMode) {
        setForm({
          name: "",
          description: "",
          type: 1,
          options: [],
        });
      }

      onSuccess?.();
    } catch (error) {
      setState({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : isEditMode
              ? "Failed to update command"
              : "Failed to create command",
      });
    }
  }

  if (isLoadingCommand) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-400">Carregando comando...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Nome do comando
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleInputChange}
            placeholder="exemplo"
            pattern="[a-z0-9_-]{1,32}"
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            required
          />
          <p className="text-xs text-slate-500">
            Apenas letras minúsculas, números, hífens e underscores (1-32 caracteres). Será convertido automaticamente para minúsculas.
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tipo
          </label>
          <select
            name="type"
            value={form.type}
            onChange={handleInputChange}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            {commandTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Descrição
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleInputChange}
          rows={2}
          placeholder="Descrição do comando"
          maxLength={100}
          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          required
        />
        <p className="text-xs text-slate-500">
          {form.description.length}/100 caracteres
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Opções (parâmetros)
          </label>
          <button
            type="button"
            onClick={addOption}
            className="rounded-lg border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            + Adicionar opção
          </button>
        </div>

        {form.options.length === 0 ? (
          <p className="text-xs text-slate-500">
            Nenhuma opção adicionada. Clique em "Adicionar opção" para criar parâmetros.
          </p>
        ) : (
          <div className="space-y-4">
            {form.options.map((option, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-800 bg-slate-950/70 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Opção {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="text-xs text-red-300 transition hover:text-red-200"
                  >
                    Remover
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Nome</label>
                    <input
                      value={option.name}
                      onChange={(e) =>
                        updateOption(index, "name", e.target.value)
                      }
                      placeholder="nome_da_opcao"
                      pattern="[a-z0-9_-]{1,32}"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Tipo</label>
                    <select
                      value={option.type}
                      onChange={(e) =>
                        updateOption(index, "type", parseInt(e.target.value, 10))
                      }
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                    >
                      {optionTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <label className="text-xs text-slate-400">Descrição</label>
                  <textarea
                    value={option.description}
                    onChange={(e) =>
                      updateOption(index, "description", e.target.value)
                    }
                    placeholder="Descrição da opção"
                    maxLength={100}
                    rows={2}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`required-${index}`}
                    checked={option.required ?? false}
                    onChange={(e) =>
                      updateOption(index, "required", e.target.checked)
                    }
                    className="h-3 w-3 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor={`required-${index}`}
                    className="text-xs text-slate-400"
                  >
                    Obrigatório
                  </label>
                </div>

                {(option.type === 3 || option.type === 4 || option.type === 10) && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-400">Escolhas (Choices)</label>
                      <button
                        type="button"
                        onClick={() => addChoice(index)}
                        className="text-xs text-indigo-400 transition hover:text-indigo-300"
                      >
                        + Adicionar escolha
                      </button>
                    </div>
                    {option.choices && option.choices.length > 0 && (
                      <div className="space-y-2">
                        {option.choices.map((choice, choiceIndex) => (
                          <div
                            key={choiceIndex}
                            className="flex gap-2 rounded-lg border border-slate-800 bg-slate-950 p-2"
                          >
                            <input
                              value={choice.name}
                              onChange={(e) =>
                                updateChoice(index, choiceIndex, "name", e.target.value)
                              }
                              placeholder="Nome da escolha"
                              className="flex-1 rounded border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                              required
                            />
                            <input
                              type={option.type === 4 || option.type === 10 ? "number" : "text"}
                              value={choice.value}
                              onChange={(e) => {
                                const value =
                                  option.type === 4 || option.type === 10
                                    ? parseFloat(e.target.value) || 0
                                    : e.target.value;
                                updateChoice(index, choiceIndex, "value", value);
                              }}
                              placeholder="Valor"
                              className="flex-1 rounded border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => removeChoice(index, choiceIndex)}
                              className="text-xs text-red-300 transition hover:text-red-200"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {state.error ? (
        <p className="rounded-md border border-red-500 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-md border border-green-500 bg-green-500/10 px-3 py-2 text-xs text-green-200">
          {state.success}
        </p>
      ) : null}

      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={state.loading}
          className="flex-1 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:bg-indigo-500/40"
        >
          {state.loading
            ? isEditMode
              ? "Atualizando..."
              : "Criando..."
            : isEditMode
              ? "Atualizar comando"
              : "Criar comando"}
        </button>
      </div>
    </form>
  );
}

