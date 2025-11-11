import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { discordBotManager } from "@/lib/discord-bot-manager";

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

  const params = await context.params;
  const status = discordBotManager.getBotStatus(params.id);
  if (!status) {
    return NextResponse.json({ status: "offline" });
  }

  return NextResponse.json({
    status: status.status,
    error: status.error,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  try {
    const params = await context.params;
    const body = await request.json();
    const action = body.action as string;

    if (action === "start") {
      const success = await discordBotManager.startBot(params.id);
      // Get the actual status after starting (might be error if failed)
      const botStatus = discordBotManager.getBotStatus(params.id);
      return NextResponse.json({ 
        success, 
        status: botStatus?.status || (success ? "connecting" : "error"),
        error: botStatus?.error,
      });
    } else if (action === "stop") {
      const success = await discordBotManager.stopBot(params.id);
      return NextResponse.json({ success, status: "stopping" });
    } else if (action === "restart") {
      const success = await discordBotManager.restartBot(params.id);
      return NextResponse.json({ success, status: "restarting" });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'start', 'stop', or 'restart'" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Failed to control bot", error);
    return NextResponse.json(
      { error: "Failed to control bot" },
      { status: 500 },
    );
  }
}

