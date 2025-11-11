import { NextResponse } from "next/server";

import { discordBotManager } from "@/lib/discord-bot-manager";

export const runtime = "nodejs";

// This endpoint can be called to auto-initialize bots
// It doesn't require authentication as it's meant to be called internally
export async function GET() {
  try {
    // Only initialize if not already initialized
    if (!discordBotManager.getInitialized()) {
      await discordBotManager.initialize();
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Auto-init failed", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

