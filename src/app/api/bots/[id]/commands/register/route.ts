import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { findBotById } from "@/lib/bots-store";
import { registerCommandsInDiscord } from "@/lib/discord-commands";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";

async function ensureAuthenticated() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(_request: Request, context: RouteContext) {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  try {
    const params = await context.params;
    const botId = params.id;

    // Verify bot exists
    const bot = await findBotById(botId);
    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    if (!bot.discord.applicationId) {
      return NextResponse.json(
        { error: "Application ID is required to register commands" },
        { status: 400 },
      );
    }

    // Register commands in Discord
    const result = await registerCommandsInDiscord(botId);

    return NextResponse.json({
      success: true,
      registered: result.registered,
      total: result.total,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Failed to register commands", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to register commands",
      },
      { status: 500 },
    );
  }
}

