import { promises as fs } from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "commands.json");

export type CommandOption = {
  name: string;
  description: string;
  type: number; // Discord ApplicationCommandOptionType
  required?: boolean;
  choices?: Array<{ name: string; value: string | number }>;
  options?: CommandOption[]; // For subcommands
};

export type StoredCommand = {
  id: string;
  botId: string;
  name: string;
  description: string;
  type?: number; // Discord ApplicationCommandType (1 = CHAT_INPUT, 2 = USER, 3 = MESSAGE)
  options?: CommandOption[];
  createdAt: string;
  updatedAt: string;
  discordCommandId?: string; // ID do comando no Discord após registro
};

export type Command = StoredCommand;

export type CreateCommandInput = {
  botId: string;
  name: string;
  description: string;
  type?: number;
  options?: CommandOption[];
};

export type UpdateCommandInput = {
  name: string;
  description: string;
  type?: number;
  options?: CommandOption[];
};

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

async function readCommands(): Promise<StoredCommand[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw) as StoredCommand[];
}

async function writeCommands(commands: StoredCommand[]) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(commands, null, 2), "utf-8");
}

export async function listCommands(botId?: string): Promise<Command[]> {
  const commands = await readCommands();
  if (botId) {
    return commands.filter((cmd) => cmd.botId === botId);
  }
  return commands;
}

export async function findCommandById(id: string): Promise<StoredCommand | null> {
  const commands = await readCommands();
  const matchingCommands = commands.filter((cmd) => cmd.id === id);
  if (matchingCommands.length > 1) {
    console.warn(`Warning: Found ${matchingCommands.length} commands with the same ID: ${id}`);
  }
  return matchingCommands[0] ?? null;
}

export async function createCommand(input: CreateCommandInput): Promise<Command> {
  const commands = await readCommands();
  const nowIso = new Date().toISOString();
  
  // Normalize command name and option names to lowercase
  const normalizedName = input.name.toLowerCase();
  const normalizedOptions = input.options?.map((opt) => ({
    ...opt,
    name: opt.name.toLowerCase(),
    options: opt.options?.map((subOpt) => ({
      ...subOpt,
      name: subOpt.name.toLowerCase(),
    })),
  }));
  
  const storedCommand: StoredCommand = {
    id: uuid(),
    botId: input.botId,
    name: normalizedName,
    description: input.description,
    type: input.type ?? 1, // Default to CHAT_INPUT
    options: normalizedOptions ?? [],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  commands.push(storedCommand);
  await writeCommands(commands);
  return storedCommand;
}

export async function updateCommand(
  id: string,
  input: UpdateCommandInput,
): Promise<Command | null> {
  const commands = await readCommands();
  const commandIndex = commands.findIndex((cmd) => cmd.id === id);
  if (commandIndex === -1) {
    return null;
  }

  const existingCommand = commands[commandIndex];
  
  // Normalize command name and option names to lowercase
  const normalizedName = input.name.toLowerCase();
  const normalizedOptions = input.options?.map((opt) => ({
    ...opt,
    name: opt.name.toLowerCase(),
    options: opt.options?.map((subOpt) => ({
      ...subOpt,
      name: subOpt.name.toLowerCase(),
    })),
  }));
  
  const updatedCommand: StoredCommand = {
    ...existingCommand,
    name: normalizedName,
    description: input.description,
    type: input.type ?? existingCommand.type ?? 1,
    options: normalizedOptions ?? existingCommand.options ?? [],
    updatedAt: new Date().toISOString(),
  };

  commands[commandIndex] = updatedCommand;
  await writeCommands(commands);
  return updatedCommand;
}

export async function updateCommandDiscordId(
  id: string,
  discordCommandId: string,
): Promise<Command | null> {
  const commands = await readCommands();
  const commandIndex = commands.findIndex((cmd) => cmd.id === id);
  if (commandIndex === -1) {
    return null;
  }

  commands[commandIndex].discordCommandId = discordCommandId;
  await writeCommands(commands);
  return commands[commandIndex];
}

export async function deleteCommand(id: string): Promise<boolean> {
  const commands = await readCommands();
  const initialLength = commands.length;
  const filteredCommands = commands.filter((cmd) => cmd.id !== id);
  
  if (filteredCommands.length === initialLength) {
    return false;
  }

  await writeCommands(filteredCommands);
  return true;
}

export async function deleteCommandsByBotId(botId: string): Promise<number> {
  const commands = await readCommands();
  const initialLength = commands.length;
  const filteredCommands = commands.filter((cmd) => cmd.botId !== botId);
  const deletedCount = initialLength - filteredCommands.length;
  
  await writeCommands(filteredCommands);
  return deletedCount;
}

