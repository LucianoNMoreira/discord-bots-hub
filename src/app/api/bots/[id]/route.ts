import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { findBotById, updateBot, deleteBot } from "@/lib/bots-store";
import { getSession } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import { env } from "@/lib/env";
import { discordBotManager } from "@/lib/discord-bot-manager";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";

const updateBotSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  avatarUrl: z.string().min(1),
  interactionOrigin: z.string().min(1),
  webhookUrl: z.string().url(),
  discord: z.object({
    guildId: z.string().min(1),
    botToken: z.string().min(1).optional(),
  }),
});

async function ensureAuthenticated() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const params = await context.params;
  const bot = await findBotById(params.id);
  if (!bot) {
    return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  }

  // Return bot with decrypted token for editing
  const decryptedToken = decrypt(env.AUTH_SECRET, bot.discord.token);
  return NextResponse.json({
    id: bot.id,
    name: bot.name,
    description: bot.description,
    avatarUrl: bot.avatarUrl,
    interactionOrigin: bot.interactionOrigin,
    webhookUrl: bot.webhookUrl,
    createdAt: bot.createdAt,
    updatedAt: bot.updatedAt,
    discord: {
      guildId: bot.discord.guildId,
      botToken: decryptedToken,
    },
  });
}

export async function PUT(request: Request, context: RouteContext) {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  try {
    const params = await context.params;
    const payload = updateBotSchema.parse(await request.json());
    const updatedBot = await updateBot(params.id, payload);
    if (!updatedBot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }
    revalidatePath("/bots");
    return NextResponse.json(updatedBot);
  } catch (error) {
    console.error("Failed to update bot", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid bot payload", details: error.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update bot" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  try {
    const params = await context.params;
    const bot = await findBotById(params.id);
    
    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    // Stop the bot before deleting
    await discordBotManager.stopBot(params.id);

    // Delete the bot from storage
    const deleted = await deleteBot(params.id);
    
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete bot" }, { status: 500 });
    }

    revalidatePath("/bots");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete bot", error);
    return NextResponse.json(
      { error: "Failed to delete bot" },
      { status: 500 },
    );
  }
}

