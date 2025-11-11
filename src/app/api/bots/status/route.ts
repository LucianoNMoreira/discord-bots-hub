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

export async function GET() {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const statuses = discordBotManager.getAllBotsStatus();
  return NextResponse.json(statuses);
}

export async function POST(request: Request) {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === "start-all") {
      await discordBotManager.initialize();
      return NextResponse.json({ success: true, message: "Starting all bots" });
    } else if (action === "stop-all") {
      await discordBotManager.stopAll();
      return NextResponse.json({ success: true, message: "Stopping all bots" });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'start-all' or 'stop-all'" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Failed to control bots", error);
    return NextResponse.json(
      { error: "Failed to control bots" },
      { status: 500 },
    );
  }
}

