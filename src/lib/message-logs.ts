import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const LOGS_FILE = path.join(DATA_DIR, "message-logs.json");

export type MessageLog = {
  id: string;
  botId: string;
  botName: string;
  timestamp: string;
  messageId: string;
  channelId: string;
  channelName: string;
  guildId: string | null;
  guildName: string | null;
  userId: string;
  username: string;
  content: string;
  hasAttachments: boolean;
  attachmentCount: number;
  webhookStatus?: "success" | "error";
  webhookError?: string;
};

const MAX_LOGS = 1000; // Keep last 1000 messages

async function ensureLogsFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(LOGS_FILE);
  } catch {
    await fs.writeFile(LOGS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

async function readLogs(): Promise<MessageLog[]> {
  await ensureLogsFile();
  const raw = await fs.readFile(LOGS_FILE, "utf-8");
  return JSON.parse(raw) as MessageLog[];
}

async function writeLogs(logs: MessageLog[]) {
  await ensureLogsFile();
  // Keep only the last MAX_LOGS messages
  const recentLogs = logs.slice(-MAX_LOGS);
  await fs.writeFile(LOGS_FILE, JSON.stringify(recentLogs, null, 2), "utf-8");
}

export async function addMessageLog(log: MessageLog) {
  const logs = await readLogs();
  logs.push(log);
  await writeLogs(logs);
}

export async function getMessageLogs(
  botId?: string,
  limit = 100,
): Promise<MessageLog[]> {
  const logs = await readLogs();
  let filtered = logs;

  if (botId) {
    filtered = logs.filter((log) => log.botId === botId);
  }

  // Sort by timestamp descending (newest first)
  filtered.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return filtered.slice(0, limit);
}

export async function clearLogs(botId?: string) {
  if (botId) {
    const logs = await readLogs();
    const filtered = logs.filter((log) => log.botId !== botId);
    await writeLogs(filtered);
  } else {
    await writeLogs([]);
  }
}

