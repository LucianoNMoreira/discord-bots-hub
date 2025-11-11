"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useTranslations } from "@/i18n/translation-context";
import { generateDiscordAuthUrl } from "@/lib/discord-utils";

type ApiError = {
  error: string;
};

type FormState = {
  loading: boolean;
  error?: string;
  success?: string;
};

type BotData = {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  interactionOrigin: string;
  webhookUrl: string;
  discord: {
    guildId: string;
    botToken: string;
    applicationId?: string;
  };
};

const initialFormState: FormState = {
  loading: false,
};

const defaultBot = {
  name: "",
  description: "",
  avatarUrl: "",
  interactionOrigin: "discord-channel",
  webhookUrl: "",
  guildId: "",
  botToken: "",
  applicationId: "",
};

type BotFormProps = {
  botId?: string;
  onSuccess?: () => void;
};

export function BotForm({ botId, onSuccess }: BotFormProps) {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const tBotForm = useTranslations("botForm");

  const commonActions = tCommon("actions");
  const commonMessages = tCommon("messages");
  const commonLabels = tCommon("labels");
  const fields = tBotForm("fields");
  const placeholders = tBotForm("placeholders");
  const origins = tBotForm("options").origins;
  const uploadCopy = tBotForm("upload");
  const metadataCopy = tBotForm("metadata");
  const botMessages = tBotForm("messages");

  const [form, setForm] = useState(defaultBot);
  const [state, setState] = useState<FormState>(initialFormState);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isLoadingBot, setIsLoadingBot] = useState(false);
  const [avatarFeedback, setAvatarFeedback] = useState<{
    error?: string;
    success?: string;
  }>({});

  const isEditMode = !!botId;

  // Load bot data when in edit mode
  useEffect(() => {
    if (botId) {
      setIsLoadingBot(true);
      setState(initialFormState);
      fetch(`/api/bots/${botId}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to load bot: ${res.status}`);
          }
          return res.json();
        })
        .then((data: BotData) => {
          if (data && data.discord) {
            setForm({
              name: data.name || "",
              description: data.description || "",
              avatarUrl: data.avatarUrl || "",
              interactionOrigin: data.interactionOrigin || "discord-channel",
              webhookUrl: data.webhookUrl || "",
              guildId: data.discord.guildId || "",
              botToken: data.discord.botToken || "",
              applicationId: data.discord.applicationId || "",
            });
          } else {
            throw new Error("Invalid bot data received");
          }
        })
        .catch((error) => {
          console.error("Error loading bot:", error);
          setState({
            loading: false,
            error: error instanceof Error ? error.message : "Failed to load bot",
          });
        })
        .finally(() => {
          setIsLoadingBot(false);
        });
    } else {
      // Reset form when not in edit mode
      setForm(defaultBot);
      setState(initialFormState);
      setAvatarFeedback({});
    }
  }, [botId]);

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      form.description.trim().length > 0 &&
      form.avatarUrl.trim().length > 0 &&
      form.webhookUrl.trim().length > 0 &&
      form.guildId.trim().length > 0 &&
      (isEditMode || form.botToken.trim().length > 0) // Token required only for new bots
    );
  }, [form, isEditMode]);

  const authUrl = useMemo(() => {
    return form.applicationId
      ? generateDiscordAuthUrl(form.applicationId)
      : null;
  }, [form.applicationId]);

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  }

  function handleSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleAvatarUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarFeedback({
        error: uploadCopy.invalidType,
      });
      event.target.value = "";
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setAvatarFeedback({});
    setIsUploadingAvatar(true);
    try {
      const response = await fetch("/api/uploads/avatar", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | ApiError
          | null;
        throw new Error(payload?.error ?? "Failed to upload avatar");
      }
      const payload = (await response.json()) as { url: string };
      setForm((prev) => ({
        ...prev,
        avatarUrl: payload.url,
      }));
      setAvatarFeedback({
        success: commonMessages.avatarSuccess,
      });
    } catch (error) {
      setAvatarFeedback({
        error:
          error instanceof Error ? error.message : commonMessages.avatarError,
      });
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  }

  function clearAvatar() {
    setForm((prev) => ({ ...prev, avatarUrl: "" }));
    setAvatarFeedback({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setState({ loading: true });
    try {
      const url = isEditMode ? `/api/bots/${botId}` : "/api/bots";
      const method = isEditMode ? "PUT" : "POST";

      const payload: Record<string, unknown> = {
        name: form.name,
        description: form.description,
        avatarUrl: form.avatarUrl,
        interactionOrigin: form.interactionOrigin,
        webhookUrl: form.webhookUrl,
        discord: {
          guildId: form.guildId,
        },
      };

      // Only include token if provided (for new bots or when updating)
      if (form.botToken.trim().length > 0) {
        (payload.discord as { guildId: string; botToken: string }).botToken =
          form.botToken;
      }

      // Include applicationId if provided
      if (form.applicationId.trim().length > 0) {
        (payload.discord as { guildId: string; applicationId?: string }).applicationId =
          form.applicationId;
      }

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
            (isEditMode ? "Failed to update bot" : "Failed to create bot"),
        );
      }

      setState({
        loading: false,
        success: isEditMode
          ? botMessages.botUpdated ?? "Bot updated successfully"
          : botMessages.botCreated,
      });

      if (!isEditMode) {
        setForm(defaultBot);
        setAvatarFeedback({});
      }

      router.refresh();
      onSuccess?.();
    } catch (error) {
      setState({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : isEditMode
              ? botMessages.botUpdateError ?? "Failed to update bot"
              : botMessages.botCreationError,
      });
    }
  }

  if (isLoadingBot) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-400">Loading bot data...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isEditMode ? (
        <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs text-indigo-200">
          Editing bot. Leave the token field empty to keep the current token.
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {fields.name}
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleInputChange}
            placeholder={placeholders.name}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {fields.avatar}
        </label>
        <div className="grid gap-3 md:grid-cols-[160px_1fr] md:items-start">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-slate-800 bg-slate-950">
              {form.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.avatarUrl}
                  alt="Bot avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-slate-500">
                  {commonLabels.noAvatar}
                </span>
              )}
            </div>
            {form.avatarUrl ? (
              <button
                type="button"
                onClick={clearAvatar}
                className="text-xs text-red-300 transition hover:text-red-200"
                disabled={isUploadingAvatar || state.loading}
              >
                {uploadCopy.remove}
              </button>
            ) : null}
          </div>
          <div className="space-y-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={isUploadingAvatar || state.loading}
              className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-700 bg-slate-950 px-4 py-6 text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-indigo-500/40 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-slate-500">{uploadCopy.hint}</p>
            {avatarFeedback.error ? (
              <p className="rounded-md border border-red-500 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {avatarFeedback.error}
              </p>
            ) : null}
            {avatarFeedback.success ? (
              <p className="rounded-md border border-emerald-500 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                {avatarFeedback.success}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {fields.description}
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleInputChange}
          rows={3}
          placeholder={placeholders.description}
          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          required
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {fields.origin}
          </label>
          <select
            name="interactionOrigin"
            value={form.interactionOrigin}
            onChange={handleSelectChange}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            {Object.entries(origins).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {fields.webhook}
          </label>
          <input
            name="webhookUrl"
            value={form.webhookUrl}
            onChange={handleInputChange}
            placeholder={placeholders.webhook}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            required
          />
        </div>
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {fields.token}
              {isEditMode ? (
                <span className="ml-1 text-slate-500">(optional)</span>
              ) : null}
            </label>
            <input
              name="botToken"
              value={form.botToken}
              onChange={handleInputChange}
              placeholder={
                isEditMode
                  ? "Leave empty to keep current token"
                  : placeholders.token
              }
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              required={!isEditMode}
              type="password"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {fields.guildId}
            </label>
            <input
              name="guildId"
              value={form.guildId}
              onChange={handleInputChange}
              placeholder={placeholders.guildId}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {fields.applicationId}
            </label>
            <input
              name="applicationId"
              value={form.applicationId}
              onChange={handleInputChange}
              placeholder={placeholders.applicationId}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            {authUrl && (
              <p className="text-xs text-slate-500">
                {tBotForm("authUrlHint")}:{" "}
                <a
                  href={authUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 underline break-all"
                >
                  {authUrl}
                </a>
              </p>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {metadataCopy.encryptionNotice}
        </p>
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

      <button
        type="submit"
        disabled={!canSubmit || state.loading}
        className="w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:bg-indigo-500/40"
      >
        {state.loading
          ? isEditMode
            ? commonActions.updatingBot ?? "Updating..."
            : commonActions.creatingBot
          : isEditMode
            ? commonActions.updateBot ?? "Update bot"
            : commonActions.createBot}
      </button>
    </form>
  );
}
