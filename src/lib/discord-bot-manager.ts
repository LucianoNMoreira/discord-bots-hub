import { Client, GatewayIntentBits, Message, Partials } from "discord.js";
import { v4 as uuid } from "uuid";
import { listBots, findBotById } from "./bots-store";
import { decrypt } from "./crypto";
import { env } from "./env";
import { addMessageLog } from "./message-logs";

type BotClient = {
  client: Client;
  botId: string;
  status: "online" | "offline" | "connecting" | "error";
  error?: string;
};

class DiscordBotManager {
  private bots: Map<string, BotClient> = new Map();
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    const bots = await listBots();
    
    for (const bot of bots) {
      await this.startBot(bot.id);
    }
  }

  async startBot(botId: string): Promise<boolean> {
    // Stop existing bot if any
    await this.stopBot(botId);

    const storedBot = await findBotById(botId);
    if (!storedBot) {
      return false;
    }

    const token = decrypt(env.AUTH_SECRET, storedBot.discord.token);

    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent, // CRITICAL: Must be enabled in Discord Developer Portal → Bot → Privileged Gateway Intents (required for both guild messages and DMs)
        GatewayIntentBits.GuildMembers,
        // Note: DirectMessages intent doesn't exist in discord.js v14
        // DMs are handled automatically with MessageContent intent
      ],
      partials: [
        Partials.Channel, // Required to receive DMs (DM channels are partial)
        Partials.Message, // Required for some message events
        Partials.User, // Required for some user events
      ],
    });

    const botClient: BotClient = {
      client,
      botId,
      status: "connecting",
    };

    const processedMessageIds = new Set<string>();

    this.bots.set(botId, botClient);

    try {
      client.once("ready", async () => {
        console.log(`✅ Bot ${storedBot.name} (${botId}) online como ${client.user?.tag ?? "desconhecido"}`);
        botClient.status = "online";
        botClient.error = undefined;
      });

      // Listen to message events - ONLY process Direct Messages (DMs)
      client.on("messageCreate", async (message: Message) => {
        if (processedMessageIds.has(message.id)) {
          return;
        }
        processedMessageIds.add(message.id);

        const botUserId = client.user?.id;
        const isDM = !message.guildId;
        const isMention = !isDM && botUserId ? message.mentions.has(botUserId) : false;

        if (!isDM && !isMention) {
          return;
        }

        let channelName = isDM ? "DM" : message.channelId;
        if (!isDM && message.channel && "name" in message.channel) {
          channelName = message.channel.name ?? message.channelId;
        } else if (isDM) {
          try {
            const dmChannel = await message.channel.fetch();
            if (dmChannel && "recipient" in dmChannel && dmChannel.recipient) {
              channelName = `DM with ${dmChannel.recipient.tag}`;
            }
          } catch {
            // ignore
          }
        }

        const logEntry = {
          id: uuid(),
          botId,
          botName: storedBot.name,
          timestamp: message.createdAt.toISOString(),
          messageId: message.id,
          channelId: message.channelId,
          channelName,
          guildId: message.guildId ?? null,
          guildName: message.guild?.name ?? null,
          userId: message.author.id,
          username: message.author.username,
          content: message.content,
          hasAttachments: message.attachments.size > 0,
          attachmentCount: message.attachments.size,
        };

        const summaryPrefix = isDM ? "DM" : "Menção";
        console.log(
          `[${storedBot.name}] ${summaryPrefix} de ${message.author.tag} (${message.author.id}) em ${channelName}: ${message.content || "(sem conteúdo)"}`
        );

        // Ignore bot messages
        if (message.author.bot) {
          await addMessageLog({
            ...logEntry,
            webhookStatus: undefined,
          });
          return;
        }

        const origin = storedBot.interactionOrigin;
        const shouldProcess =
          (isDM && (origin === "discord-user" || origin === "hybrid")) ||
          (!isDM && (origin === "discord-channel" || origin === "hybrid"));

        if (!shouldProcess) {
          await addMessageLog({
            ...logEntry,
            webhookStatus: undefined,
          });
          processedMessageIds.add(message.id);
          return;
        }

        // Forward message to webhook
        try {
          const payload = {
            botId,
            botName: storedBot.name,
            interactionOrigin: storedBot.interactionOrigin,
            guildId: message.guildId ?? null,
            channelId: message.channelId,
            userId: message.author.id,
            username: message.author.username,
            messageId: message.id,
            content: message.content,
            attachments: message.attachments.map((attachment) => ({
              id: attachment.id,
              url: attachment.url,
              contentType: attachment.contentType,
              name: attachment.name,
              size: attachment.size,
            })),
            createdAt: message.createdAt.toISOString(),
          };

          const response = await fetch(storedBot.webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Discord-Bot-Id": botId,
              "X-Discord-Guild-Id": message.guildId ?? "",
              "X-Discord-Channel-Id": message.channelId,
              "X-Discord-User-Id": message.author.id,
              "X-Discord-Forwarded-By": "discord-bots-management",
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            await addMessageLog({
              ...logEntry,
              webhookStatus: "success",
            });
          } else {
            const errorText = await response.text().catch(() => "Unknown error");
            await addMessageLog({
              ...logEntry,
              webhookStatus: "error",
              webhookError: `HTTP ${response.status}: ${errorText}`,
            });
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(
            `[${storedBot.name}] Failed to forward message:`,
            errorMessage,
          );
          await addMessageLog({
            ...logEntry,
            webhookStatus: "error",
            webhookError: errorMessage,
          });
        }
      });

      client.on("error", (error) => {
        console.error(`[${storedBot.name}] Error in bot:`, error);
        botClient.status = "error";
        botClient.error = error.message;
      });

      client.on("warn", (warning) => {
        console.warn(`[${storedBot.name}] Bot warning:`, warning);
      });

      // Listen to raw websocket events - ONLY for DMs
      client.on("raw", async (data: { t?: string; d?: Record<string, unknown> }) => {
        if (data.t === "MESSAGE_CREATE") {
          const guildId = data.d?.guild_id as string | undefined;
          const isDM = !guildId;

          if (!isDM) {
            return;
          }
          
          const channelId = data.d?.channel_id as string | undefined;
          const authorId = (data.d?.author as { id?: string })?.id;
          const authorIsBot = (data.d?.author as { bot?: boolean })?.bot;

          if (authorIsBot) {
            return;
          }
          
          // Try to manually fetch and cache the DM channel, then manually trigger messageCreate
          if (channelId) {
            try {
              const channel = await client.channels.fetch(channelId);
              
              // Try to fetch the message to manually trigger the event
              if (channel && "messages" in channel) {
                try {
                  const messageId = data.d?.id as string | undefined;
                  if (messageId) {
                    if (processedMessageIds.has(messageId)) {
                      return;
                    }
                    const message = await (channel as { messages: { fetch: (id: string) => Promise<Message> } }).messages.fetch(messageId);
                    if (message) {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (client as any).emit("messageCreate", message);
                    }
                  }
                } catch (error) {
                  console.error(`[${storedBot.name}] ❌ Failed to fetch message:`, error);
                }
              }
            } catch (error) {
              console.error(`[${storedBot.name}] ❌ Failed to fetch DM channel ${channelId}:`, error);
            }
          }
        }
        
        // Also listen for channel creation events (DMs create channels)
        if (data.t === "CHANNEL_CREATE") {
          const channelType = data.d?.type as number | undefined;
          if (channelType === 1) {
            const channelId = data.d?.id as string | undefined;
            if (channelId) {
              try {
                await client.channels.fetch(channelId);
              } catch (error) {
                console.error(`[${storedBot.name}] ❌ Failed to cache DM channel:`, error);
              }
            }
          }
        }
      });

      client.on("disconnect", () => {
        console.log(`[${storedBot.name}] Bot disconnected`);
        botClient.status = "offline";
      });

      await client.login(token);
      return true;
    } catch (error) {
      console.error(`Failed to start bot ${storedBot.name} (${botId}):`, error);
      
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide helpful error messages for common issues
        if (error.message.includes("disallowed intents") || error.message.includes("Used disallowed intents")) {
          errorMessage = `Intents não habilitados no Discord Developer Portal. Acesse https://discord.com/developers/applications, selecione sua aplicação, vá em Bot → Privileged Gateway Intents e habilite: MESSAGE CONTENT INTENT e SERVER MEMBERS INTENT.`;
        } else if (error.message.includes("Invalid token") || error.message.includes("401")) {
          errorMessage = "Token inválido. Verifique se o token do bot está correto.";
        } else if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
          errorMessage = "Erro de conexão. Verifique sua conexão com a internet.";
        }
      }
      
      botClient.status = "error";
      botClient.error = errorMessage;
      this.bots.delete(botId);
      return false;
    }
  }

  async stopBot(botId: string): Promise<boolean> {
    const botClient = this.bots.get(botId);
    if (!botClient) {
      return false;
    }

    try {
      botClient.client.destroy();
      this.bots.delete(botId);
      return true;
    } catch (error) {
      console.error(`Error stopping bot ${botId}:`, error);
      return false;
    }
  }

  async restartBot(botId: string): Promise<boolean> {
    await this.stopBot(botId);
    return await this.startBot(botId);
  }

  getBotStatus(botId: string): BotClient | null {
    return this.bots.get(botId) || null;
  }

  getAllBotsStatus(): Array<{ botId: string; status: BotClient["status"]; error?: string }> {
    return Array.from(this.bots.entries()).map(([botId, botClient]) => ({
      botId,
      status: botClient.status,
      error: botClient.error,
    }));
  }

  async stopAll() {
    const promises = Array.from(this.bots.keys()).map((botId) =>
      this.stopBot(botId),
    );
    await Promise.all(promises);
    this.isInitialized = false;
  }

  getInitialized(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
export const discordBotManager = new DiscordBotManager();

declare global {
  // eslint-disable-next-line no-var
  var __discordBotsAutoInitPromise: Promise<void> | undefined;
}

if (!globalThis.__discordBotsAutoInitPromise) {
  globalThis.__discordBotsAutoInitPromise = discordBotManager
    .initialize()
    .catch((error) => {
      console.error("Falha ao inicializar bots automaticamente:", error);
      globalThis.__discordBotsAutoInitPromise = undefined;
    });
}

