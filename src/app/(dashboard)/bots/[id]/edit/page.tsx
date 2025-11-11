import Link from "next/link";

import { BotForm } from "@/components/bots/bot-form";
import { getI18n } from "@/i18n/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBotPage({ params }: PageProps) {
  const { id } = await params;
  const { messages } = await getI18n();
  const botsMessages = messages.bots;
  const { actions: commonActions = {} } = messages.common ?? {};

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-50">
            {botsMessages.editTitle ?? "Editar bot"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {botsMessages.editDescription ??
              "Atualize as informações do bot conforme necessário."}
          </p>
        </div>
        <Link
          href="/bots"
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
        >
          {commonActions.cancel ?? "Voltar"}
        </Link>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow shadow-slate-950/40">
        <BotForm botId={id} />
      </div>
    </div>
  );
}


