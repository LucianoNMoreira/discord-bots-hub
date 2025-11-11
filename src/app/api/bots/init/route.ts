import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { discordBotManager } from "@/lib/discord-bot-manager";

export const runtime = "nodejs";

async function ensureAuthenticated() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST() {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  try {
    await discordBotManager.initialize();
    return NextResponse.json({
      success: true,
      message: "Bots initialized",
    });
  } catch (error) {
    console.error("Failed to initialize bots", error);
    return NextResponse.json(
      { error: "Failed to initialize bots" },
      { status: 500 },
    );
  }
}

