import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { findBotById } from "@/lib/bots-store";
import { listRegisteredCommandsInDiscord } from "@/lib/discord-commands";

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

export async function GET(_request: Request, context: RouteContext) {
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

    // List registered commands from Discord
    const commands = await listRegisteredCommandsInDiscord(botId);

    return NextResponse.json({
      success: true,
      commands,
      count: commands.length,
    });
  } catch (error) {
    console.error("Failed to verify commands", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to verify commands",
      },
      { status: 500 },
    );
  }
}

