import { NextRequest, NextResponse } from "next/server";
import { findBotById } from "@/lib/bots-store";
import { decrypt } from "@/lib/crypto";
import { env } from "@/lib/env";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { getSession } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function ensureAuthenticated() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const authError = await ensureAuthenticated();
    if (authError) return authError;

    const params = await context.params;
    const botId = params.id;

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    const storedBot = await findBotById(botId);
    if (!storedBot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    const token = decrypt(env.AUTH_SECRET, storedBot.discord.token);

    // Create a temporary client to send a DM
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
      partials: [Partials.Channel, Partials.Message, Partials.User],
    });

    try {
      await client.login(token);
      console.log(`[${storedBot.name}] Test DM: Bot logged in`);

      // Wait a bit for the client to be ready
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const user = await client.users.fetch(userId);
      console.log(`[${storedBot.name}] Test DM: Fetched user ${user.tag}`);

      const dmChannel = await user.createDM();
      console.log(`[${storedBot.name}] Test DM: Created DM channel ${dmChannel.id}`);

      await dmChannel.send(
        "🤖 Teste de DM! Se você recebeu esta mensagem, o bot consegue enviar DMs. Agora tente enviar uma mensagem de volta para o bot.",
      );
      console.log(`[${storedBot.name}] Test DM: Message sent successfully`);

      await client.destroy();

      return NextResponse.json({
        success: true,
        message: "Test DM sent successfully",
      });
    } catch (error) {
      console.error(`[${storedBot.name}] Test DM error:`, error);
      await client.destroy().catch(() => {});
      return NextResponse.json(
        {
          error: "Failed to send test DM",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in test-dm route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

