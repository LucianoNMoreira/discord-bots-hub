import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { findBotById } from "@/lib/bots-store";
import {
  findCommandById,
  updateCommand,
  deleteCommand,
  type UpdateCommandInput,
} from "@/lib/commands-store";

type RouteContext = {
  params: Promise<{
    id: string;
    commandId: string;
  }>;
};

export const runtime = "nodejs";

const updateCommandSchema = z.object({
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
        options: z.lazy(() => updateCommandSchema.shape.options).optional(),
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
    const command = await findCommandById(params.commandId);
    
    if (!command) {
      return NextResponse.json({ error: "Command not found" }, { status: 404 });
    }

    // Verify bot exists and command belongs to bot
    const bot = await findBotById(params.id);
    if (!bot || command.botId !== params.id) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    return NextResponse.json(command);
  } catch (error) {
    console.error("Failed to get command", error);
    return NextResponse.json(
      { error: "Failed to get command" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  try {
    const params = await context.params;
    const command = await findCommandById(params.commandId);
    
    if (!command) {
      return NextResponse.json({ error: "Command not found" }, { status: 404 });
    }

    // Verify bot exists and command belongs to bot
    const bot = await findBotById(params.id);
    if (!bot || command.botId !== params.id) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    const payload = updateCommandSchema.parse(await request.json());
    const input: UpdateCommandInput = {
      name: payload.name,
      description: payload.description,
      type: payload.type,
      options: payload.options,
    };

    const updatedCommand = await updateCommand(params.commandId, input);
    if (!updatedCommand) {
      return NextResponse.json(
        { error: "Failed to update command" },
        { status: 500 },
      );
    }

    revalidatePath(`/bots/${params.id}/commands`);
    return NextResponse.json(updatedCommand);
  } catch (error) {
    console.error("Failed to update command", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid command payload", details: error.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update command" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  try {
    const params = await context.params;
    const command = await findCommandById(params.commandId);
    
    if (!command) {
      return NextResponse.json({ error: "Command not found" }, { status: 404 });
    }

    // Verify bot exists and command belongs to bot
    const bot = await findBotById(params.id);
    if (!bot || command.botId !== params.id) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    const deleted = await deleteCommand(params.commandId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete command" },
        { status: 500 },
      );
    }

    revalidatePath(`/bots/${params.id}/commands`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete command", error);
    return NextResponse.json(
      { error: "Failed to delete command" },
      { status: 500 },
    );
  }
}

