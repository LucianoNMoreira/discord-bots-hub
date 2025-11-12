import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { findBotById } from "@/lib/bots-store";
import {
  listCommands,
  createCommand,
  type CreateCommandInput,
} from "@/lib/commands-store";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";

const createCommandSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[a-z0-9_-]{1,32}$/, "Command name must be lowercase and contain only letters, numbers, hyphens, and underscores")
    .transform((val) => val.toLowerCase()),
  description: z.string().min(1).max(100),
  type: z.number().int().min(1).max(3).optional(),
  options: z
    .array(
      z.object({
        name: z
          .string()
          .min(1)
          .max(32)
          .regex(/^[a-z0-9_-]{1,32}$/, "Option name must be lowercase and contain only letters, numbers, hyphens, and underscores")
          .transform((val) => val.toLowerCase()),
        description: z.string().min(1).max(100),
        type: z.number().int(),
        required: z.boolean().optional(),
        choices: z
          .array(
            z.object({
              name: z.string().min(1).max(100),
              value: z.union([z.string(), z.number()]),
            }),
          )
          .optional(),
        options: z.lazy(() => createCommandSchema.shape.options).optional(),
      }),
    )
    .optional(),
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

  try {
    const params = await context.params;
    const botId = params.id;

    // Verify bot exists
    const bot = await findBotById(botId);
    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    const commands = await listCommands(botId);
    return NextResponse.json(commands);
  } catch (error) {
    console.error("Failed to list commands", error);
    return NextResponse.json(
      { error: "Failed to list commands" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
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

    const payload = createCommandSchema.parse(await request.json());
    const input: CreateCommandInput = {
      botId,
      name: payload.name,
      description: payload.description,
      type: payload.type,
      options: payload.options,
    };

    const command = await createCommand(input);
    revalidatePath(`/bots/${botId}/commands`);
    return NextResponse.json(command, { status: 201 });
  } catch (error) {
    console.error("Failed to create command", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid command payload", details: error.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create command" },
      { status: 500 },
    );
  }
}

