import { Client, GatewayIntentBits, Message, Partials, ActivityType, Interaction, ChatInputCommandInteraction } from "discord.js";
import { v4 as uuid } from "uuid";
import { listBots, findBotById } from "./bots-store";
import { decrypt } from "./crypto";
import { env } from "./env";
import { addMessageLog } from "./message-logs";
import { registerCommandsInDiscord, getApplicationIdFromToken } from "./discord-commands";
import { generateDiscordAuthUrl } from "./discord-utils";

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
        const botUser = client.user;
        console.log(`✅ Bot ${storedBot.name} (${botId}) online como ${botUser?.tag ?? "desconhecido"}`);
        botClient.status = "online";
        botClient.error = undefined;

        // Set bot presence to ensure it appears online
        try {
          await client.user?.setPresence({
            activities: [{ name: "Gerenciando comandos", type: ActivityType.Playing }],
            status: "online", // "online" | "idle" | "dnd" | "invisible" | "offline"
          });
          console.log(`[${storedBot.name}] ✅ Presença do bot configurada como online`);
        } catch (presenceError) {
          console.warn(`[${storedBot.name}] ⚠️ Não foi possível configurar presença:`, presenceError);
        }

        // Wait a bit for guilds cache to populate (Discord.js loads guilds asynchronously)
        // Discord.js may take a few seconds to fully load all guilds
        await new Promise((resolve) => setTimeout(resolve, 3000));
        
        // Force fetch all guilds to ensure cache is populated
        try {
          await client.guilds.fetch();
          console.log(`[${storedBot.name}] Cache de servidores atualizado. Total de servidores: ${client.guilds.cache.size}`);
        } catch (fetchError) {
          console.warn(`[${storedBot.name}] ⚠️ Erro ao atualizar cache de servidores:`, fetchError);
        }

        // Get Application ID from token for later use
        const token = decrypt(env.AUTH_SECRET, storedBot.discord.token);
        const tokenApplicationId = await getApplicationIdFromToken(token);

        // Check if bot is in the configured guild
        // First check cache, then try fetch
        let guild = client.guilds.cache.get(storedBot.discord.guildId);
        
        if (!guild) {
          // Try to fetch from API
          try {
            guild = await client.guilds.fetch(storedBot.discord.guildId);
          } catch (fetchError) {
            // Guild not found via fetch either
          }
        }

        if (guild) {
          console.log(`[${storedBot.name}] ✅ Bot está no servidor: ${guild.name} (${guild.id})`);
          // Check if bot is a member of the guild
          try {
            const member = await guild.members.fetch(botUser!.id);
            if (member) {
              console.log(`[${storedBot.name}] ✅ Bot está presente no servidor como membro`);
              console.log(`[${storedBot.name}] ✅ Status do bot no servidor: ${member.presence?.status || "desconhecido"}`);
            }
          } catch (memberError) {
            console.warn(`[${storedBot.name}] ⚠️ Bot não foi encontrado como membro do servidor. Certifique-se de que o bot foi convidado para o servidor.`);
          }
        } else {
          // List all guilds the bot is in
          const guilds = client.guilds.cache;
          const guildList = Array.from(guilds.values());
          const guildNames = guildList.map((g) => `${g.name} (${g.id})`).join(", ");
          
          if (guildList.length > 0) {
            console.error(`[${storedBot.name}] ❌ Bot NÃO está no servidor configurado (${storedBot.discord.guildId})`);
            console.warn(`[${storedBot.name}] ⚠️ Bot está nos seguintes servidores:`);
            guildList.forEach((g) => {
              console.warn(`[${storedBot.name}]   - ${g.name} (${g.id})`);
            });
            console.warn(`[${storedBot.name}] ⚠️ AÇÃO NECESSÁRIA: Convide o bot para o servidor ${storedBot.discord.guildId} ou atualize o Guild ID na configuração para um dos servidores acima.`);
            botClient.error = `Bot não está no servidor configurado. Bot está em: ${guildNames}. Convide o bot para o servidor ${storedBot.discord.guildId} ou atualize o Guild ID.`;
          } else {
            console.error(`[${storedBot.name}] ❌ Bot não está em nenhum servidor!`);
            
            // Use the Application ID we already fetched
            const applicationId = tokenApplicationId || storedBot.discord.applicationId;
            
            let authUrl = "";
            if (applicationId) {
              authUrl = generateDiscordAuthUrl(applicationId);
              console.warn(`[${storedBot.name}] ⚠️ AÇÃO NECESSÁRIA: Convide o bot para um servidor usando esta URL:`);
              console.warn(`[${storedBot.name}] ${authUrl}`);
            } else {
              console.warn(`[${storedBot.name}] ⚠️ AÇÃO NECESSÁRIA: Convide o bot para um servidor usando a URL de autorização no Discord Developer Portal.`);
            }
            
            botClient.error = applicationId 
              ? `Bot não está em nenhum servidor. Convide o bot usando: ${authUrl}`
              : `Bot não está em nenhum servidor. Convide o bot para o servidor ${storedBot.discord.guildId} usando a URL de autorização.`;
          }
        }

        // Auto-register commands if application ID is available
        if (storedBot.discord.applicationId || tokenApplicationId) {
          try {
            console.log(`[${storedBot.name}] Registrando comandos no Discord...`);
            const result = await registerCommandsInDiscord(botId);
            if (result.registered > 0) {
              console.log(
                `[${storedBot.name}] ✅ ${result.registered} de ${result.total} comandos registrados com sucesso`,
              );
              console.log(
                `[${storedBot.name}] ℹ️ Os comandos podem levar até 1 hora para aparecerem no Discord. Tente digitar "/" no servidor para ver os comandos disponíveis.`,
              );
            }
            if (result.errors.length > 0) {
              console.warn(
                `[${storedBot.name}] ⚠️ ${result.errors.length} aviso(s) ao registrar comandos:`,
                result.errors,
              );
            }
          } catch (error) {
            console.error(
              `[${storedBot.name}] ❌ Erro ao registrar comandos:`,
              error,
            );
          }
        }
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

      // Listen to slash command interactions
      client.on("interactionCreate", async (interaction: Interaction) => {
        // Only handle chat input commands (slash commands)
        if (!interaction.isChatInputCommand()) {
          return;
        }

        const commandInteraction = interaction as ChatInputCommandInteraction;
        const isDM = !interaction.guildId;

        // Check if we should process this interaction based on origin
        const origin = storedBot.interactionOrigin;
        const shouldProcess =
          (isDM && (origin === "discord-user" || origin === "hybrid")) ||
          (!isDM && (origin === "discord-channel" || origin === "hybrid"));

        if (!shouldProcess) {
          // Acknowledge but don't process
          if (commandInteraction.isRepliable()) {
            await commandInteraction.reply({ content: "Comando não processado.", ephemeral: true }).catch(() => {
              // Ignore errors
            });
          }
          return;
        }

        let channelName = isDM ? "DM" : commandInteraction.channelId;
        if (!isDM && commandInteraction.channel && "name" in commandInteraction.channel) {
          channelName = commandInteraction.channel.name ?? commandInteraction.channelId;
        } else if (isDM && commandInteraction.channel) {
          try {
            const dmChannel = await commandInteraction.channel.fetch();
            if (dmChannel && "recipient" in dmChannel && dmChannel.recipient) {
              channelName = `DM with ${dmChannel.recipient.tag}`;
            }
          } catch {
            // ignore
          }
        }

        const summaryPrefix = isDM ? "Comando DM" : "Comando";
        console.log(
          `[${storedBot.name}] ${summaryPrefix} /${commandInteraction.commandName} de ${commandInteraction.user.tag} (${commandInteraction.user.id}) em ${channelName}`
        );

        // Extract command options
        const options: Record<string, unknown> = {};
        commandInteraction.options.data.forEach((option) => {
          if (option.value !== undefined && option.value !== null) {
            options[option.name] = option.value;
          } else if (option.options) {
            // Handle subcommands
            const subOptions: Record<string, unknown> = {};
            option.options.forEach((subOption) => {
              if (subOption.value !== undefined && subOption.value !== null) {
                subOptions[subOption.name] = subOption.value;
              }
            });
            options[option.name] = subOptions;
          }
        });

        // Acknowledge the interaction silently (Discord requires a response within 3 seconds)
        // Use ephemeral deferReply to avoid showing "thinking..." state without sending a visible message
        if (commandInteraction.isRepliable() && !commandInteraction.replied && !commandInteraction.deferred) {
          await commandInteraction.deferReply({ ephemeral: true }).catch((error) => {
            console.warn(`[${storedBot.name}] ⚠️ Não foi possível responder à interação:`, error);
          });
        }

        // Forward interaction to webhook (after responding to avoid "thinking..." state)
        try {
          const payload = {
            botId,
            botName: storedBot.name,
            interactionOrigin: storedBot.interactionOrigin,
            interactionType: "command",
            commandName: commandInteraction.commandName,
            commandId: commandInteraction.commandId,
            interactionId: commandInteraction.id,
            messageId: commandInteraction.id, // For slash commands, interaction ID serves as message identifier
            guildId: commandInteraction.guildId ?? null,
            guildName: commandInteraction.guild?.name ?? null,
            channelId: commandInteraction.channelId,
            channelName,
            userId: commandInteraction.user.id,
            username: commandInteraction.user.username,
            userTag: commandInteraction.user.tag,
            options,
            createdAt: commandInteraction.createdAt.toISOString(),
          };

          const response = await fetch(storedBot.webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Discord-Bot-Id": botId,
              "X-Discord-Guild-Id": commandInteraction.guildId ?? "",
              "X-Discord-Channel-Id": commandInteraction.channelId,
              "X-Discord-User-Id": commandInteraction.user.id,
              "X-Discord-Interaction-Type": "command",
              "X-Discord-Command-Name": commandInteraction.commandName,
              "X-Discord-Interaction-Id": commandInteraction.id,
              "X-Discord-Message-Id": commandInteraction.id,
              "X-Discord-Forwarded-By": "discord-bots-management",
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            console.log(`[${storedBot.name}] ✅ Comando /${commandInteraction.commandName} encaminhado para webhook com sucesso`);
          } else {
            const errorText = await response.text().catch(() => "Unknown error");
            console.error(
              `[${storedBot.name}] ❌ Falha ao encaminhar comando /${commandInteraction.commandName}: HTTP ${response.status}: ${errorText}`
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(
            `[${storedBot.name}] ❌ Erro ao processar comando /${commandInteraction.commandName}:`,
            errorMessage,
          );

          // Try to acknowledge with error message
          if (commandInteraction.isRepliable() && !commandInteraction.replied && !commandInteraction.deferred) {
            await commandInteraction.reply({ content: "Erro ao processar comando.", ephemeral: true }).catch(() => {
              // Ignore errors
            });
          }
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
          errorMessage = `Intents not enabled in Discord Developer Portal. Go to https://discord.com/developers/applications, select your application, go to Bot → Privileged Gateway Intents and enable: MESSAGE CONTENT INTENT and SERVER MEMBERS INTENT.`;
        } else if (error.message.includes("Invalid token") || error.message.includes("401")) {
          errorMessage = "Invalid token. Please verify that the bot token is correct.";
        } else if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
          errorMessage = "Connection error. Please check your internet connection.";
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

