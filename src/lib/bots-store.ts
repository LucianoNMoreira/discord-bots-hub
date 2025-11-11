import { promises as fs } from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

import { env } from "./env";
import { encrypt } from "./crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "bots.json");

export type StoredBot = {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  interactionOrigin: string;
  webhookUrl: string;
  createdAt: string;
  updatedAt: string;
  discord: {
    guildId: string;
    token: string;
    applicationId?: string;
  };
};

export type Bot = Omit<StoredBot, "discord"> & {
  discord: Omit<StoredBot["discord"], "token"> & {
    applicationId?: string;
  };
};

export type CreateBotInput = {
  name: string;
  description: string;
  avatarUrl: string;
  interactionOrigin: string;
  webhookUrl: string;
  discord: {
    guildId: string;
    botToken: string;
    applicationId?: string;
  };
};

export type UpdateBotInput = {
  name: string;
  description: string;
  avatarUrl: string;
  interactionOrigin: string;
  webhookUrl: string;
  discord: {
    guildId: string;
    botToken?: string; // Optional - only update if provided
    applicationId?: string;
  };
};

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

async function readBots(): Promise<StoredBot[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw) as StoredBot[];
}

async function writeBots(bots: StoredBot[]) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(bots, null, 2), "utf-8");
}

function sanitizeBot(bot: StoredBot): Bot {
  return {
    ...bot,
    discord: {
      guildId: bot.discord.guildId,
      applicationId: bot.discord.applicationId,
    },
  };
}

export async function listBots(): Promise<Bot[]> {
  const bots = await readBots();
  return bots.map(sanitizeBot);
}

export async function createBot(input: CreateBotInput): Promise<Bot> {
  const bots = await readBots();
  const nowIso = new Date().toISOString();
  const storedBot: StoredBot = {
    id: uuid(),
    name: input.name,
    avatarUrl: input.avatarUrl,
    description: input.description,
    interactionOrigin: input.interactionOrigin,
    webhookUrl: input.webhookUrl,
    createdAt: nowIso,
    updatedAt: nowIso,
    discord: {
      guildId: input.discord.guildId,
      token: encrypt(env.AUTH_SECRET, input.discord.botToken),
      applicationId: input.discord.applicationId,
    },
  };
  bots.push(storedBot);
  await writeBots(bots);
  return sanitizeBot(storedBot);
}

export async function findBotById(id: string): Promise<StoredBot | null> {
  const bots = await readBots();
  // If there are multiple bots with the same ID, log a warning
  const matchingBots = bots.filter((bot) => bot.id === id);
  if (matchingBots.length > 1) {
    console.warn(`Warning: Found ${matchingBots.length} bots with the same ID: ${id}`);
  }
  return matchingBots[0] ?? null;
}

export async function updateBot(
  id: string,
  input: UpdateBotInput,
): Promise<Bot | null> {
  const bots = await readBots();
  const botIndex = bots.findIndex((bot) => bot.id === id);
  if (botIndex === -1) {
    return null;
  }

  const existingBot = bots[botIndex];
  const updatedBot: StoredBot = {
    ...existingBot,
    name: input.name,
    description: input.description,
    avatarUrl: input.avatarUrl,
    interactionOrigin: input.interactionOrigin,
    webhookUrl: input.webhookUrl,
    updatedAt: new Date().toISOString(),
    discord: {
      guildId: input.discord.guildId,
      token:
        input.discord.botToken !== undefined
          ? encrypt(env.AUTH_SECRET, input.discord.botToken)
          : existingBot.discord.token, // Keep existing token if not provided
      applicationId: input.discord.applicationId !== undefined
        ? input.discord.applicationId
        : existingBot.discord.applicationId, // Keep existing applicationId if not provided
    },
  };

  bots[botIndex] = updatedBot;
  await writeBots(bots);
  return sanitizeBot(updatedBot);
}

export async function deleteBot(id: string): Promise<boolean> {
  const bots = await readBots();
  // Find all bots with this ID (in case of duplicates)
  const initialLength = bots.length;
  const filteredBots = bots.filter((bot) => bot.id !== id);
  
  // Only delete if we actually found and removed at least one bot
  if (filteredBots.length === initialLength) {
    return false;
  }

  await writeBots(filteredBots);
  return true;
}

