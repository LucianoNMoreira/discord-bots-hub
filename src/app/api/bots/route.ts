import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { createBot, listBots } from "@/lib/bots-store";
import { getSession } from "@/lib/auth";

const createBotSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  avatarUrl: z.string().min(1),
  interactionOrigin: z.string().min(1),
  webhookUrl: z.string().url(),
  discord: z.object({
    guildId: z.string().min(1),
    botToken: z.string().min(1),
    applicationId: z.string().optional(),
  }),
});

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

  const bots = await listBots();
  return NextResponse.json(bots);
}

export async function POST(request: Request) {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  try {
    const payload = createBotSchema.parse(await request.json());
    const bot = await createBot(payload);
    revalidatePath("/bots");
    return NextResponse.json(bot, { status: 201 });
  } catch (error) {
    console.error("Failed to create bot", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid bot payload", details: error.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create bot" },
      { status: 500 },
    );
  }
}



