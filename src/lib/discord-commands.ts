import { listCommands, updateCommandDiscordId } from "./commands-store";
import { findBotById } from "./bots-store";
import { decrypt } from "./crypto";
import { env } from "./env";

/**
 * Obtém o Application ID do bot usando o token
 */
export async function getApplicationIdFromToken(
  botToken: string,
): Promise<string | null> {
  try {
    const response = await fetch("https://discord.com/api/v10/oauth2/applications/@me", {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { id: string };
    return data.id;
  } catch {
    return null;
  }
}

/**
 * Registra comandos no Discord usando a API REST
 */
export async function registerCommandsInDiscord(
  botId: string,
): Promise<{ registered: number; total: number; errors: string[] }> {
  const errors: string[] = [];

  // Get bot
  const bot = await findBotById(botId);
  if (!bot) {
    throw new Error("Bot not found");
  }

  // Decrypt token
  const botToken = decrypt(env.AUTH_SECRET, bot.discord.token);

  // Get application ID from token (most reliable method)
  const tokenApplicationId = await getApplicationIdFromToken(botToken);
  if (!tokenApplicationId) {
    throw new Error(
      "Could not retrieve Application ID from bot token. Please ensure the bot token is valid and has the necessary permissions.",
    );
  }

  // Use token's application ID, but warn if config doesn't match
  let applicationId = tokenApplicationId;
  if (bot.discord.applicationId && bot.discord.applicationId !== tokenApplicationId) {
    console.warn(
      `[Bot ${botId}] Warning: Configured Application ID (${bot.discord.applicationId}) does not match the bot token's Application ID (${tokenApplicationId}). Using the token's Application ID.`,
    );
    errors.push(
      `Warning: Configured Application ID (${bot.discord.applicationId}) does not match the bot token's Application ID (${tokenApplicationId}). Using the token's Application ID for command registration.`,
    );
  } else if (!bot.discord.applicationId) {
    console.log(`[Bot ${botId}] Application ID not configured, using token's Application ID: ${tokenApplicationId}`);
  }

  // Get all commands for this bot
  const commands = await listCommands(botId);
  if (commands.length === 0) {
    return { registered: 0, total: 0, errors: [] };
  }

  // Register commands both globally (for DMs) and in the guild (for server)
  // Global commands work in both DMs and servers, but take up to 1 hour to propagate
  // Guild commands work immediately but only in the specific server
  
  // Discord API endpoints
  const globalUrl = `https://discord.com/api/v10/applications/${applicationId}/commands`;
  const guildUrl = `https://discord.com/api/v10/applications/${applicationId}/guilds/${bot.discord.guildId}/commands`;

  let registered = 0;
  let globalRegistered = 0;
  let guildRegistered = 0;

  for (const command of commands) {
    try {
      // Normalize command name to lowercase (Discord requirement)
      const normalizedName = command.name.toLowerCase();
      
      const payload: {
        name: string;
        description: string;
        type?: number;
        options?: unknown[];
      } = {
        name: normalizedName,
        description: command.description,
      };

      if (command.type) {
        payload.type = command.type;
      }

      if (command.options && command.options.length > 0) {
        payload.options = command.options;
      }

      // Register globally (for DMs and all servers)
      let globalCommand: { id: string; name: string } | null = null;
      let globalResponseOk = false;
      try {
        const globalResponse = await fetch(globalUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bot ${botToken}`,
          },
          body: JSON.stringify(payload),
        });
        
        if (globalResponse.ok) {
          globalCommand = (await globalResponse.json()) as { id: string; name: string };
          console.log(`[Bot ${botId}] ✅ Comando "${globalCommand.name}" registrado GLOBALMENTE (funciona em DMs e servidores) com ID: ${globalCommand.id}`);
          globalRegistered++;
          globalResponseOk = true;
        } else {
          const errorText = await globalResponse.text();
          console.warn(`[Bot ${botId}] ⚠️ Falha ao registrar comando "${normalizedName}" globalmente: ${globalResponse.status} ${errorText}`);
        }
      } catch (globalError) {
        console.warn(`[Bot ${botId}] ⚠️ Erro ao registrar comando "${normalizedName}" globalmente:`, globalError);
      }

      // Also register in guild (for immediate availability in the server)
      const response = await fetch(guildUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bot ${botToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `Failed to register command ${command.name} in guild: ${response.status} ${errorText}`;
        
        // Provide helpful error messages
        if (response.status === 400) {
          try {
            const errorData = JSON.parse(errorText || "{}") as {
              code?: number;
              message?: string;
              errors?: Record<string, unknown>;
            };
            if (errorData.code === 50035) {
              // Invalid form body
              const nameErrors = (errorData.errors as { name?: { _errors?: Array<{ code?: string; message?: string }> } })?.name?._errors;
              if (nameErrors?.some((e) => e.code === "APPLICATION_COMMAND_INVALID_NAME")) {
                errorMsg = `Failed to register command ${command.name} in guild: Command name is invalid. Discord requires command names to be lowercase and contain only letters, numbers, hyphens, and underscores. The name "${command.name}" was normalized to "${normalizedName}".`;
              }
            }
          } catch {
            // If parsing fails, use default error message
          }
        } else if (response.status === 403) {
          const errorData = JSON.parse(errorText || "{}") as { code?: number; message?: string };
          if (errorData.code === 20012) {
            errorMsg = `Failed to register command ${command.name} in guild: The bot token does not have permission to register commands for this application. Make sure the Application ID matches the bot's application and the bot is the owner of the application.`;
          } else if (errorData.code === 50001) {
            errorMsg = `Failed to register command ${command.name} in guild: Missing Access (code 50001). The bot is not in the guild ${bot.discord.guildId} or does not have access to it. Please invite the bot to the server first.`;
          }
        }
        
        console.warn(errorMsg);
        // Don't add to errors if global registration succeeded
        if (!globalResponseOk) {
          errors.push(errorMsg);
        }
      } else {
        const guildCommand = (await response.json()) as { id: string; name: string; description: string };
        console.log(`[Bot ${botId}] ✅ Comando "${guildCommand.name}" registrado no SERVIDOR (disponível imediatamente) com ID: ${guildCommand.id}`);
        guildRegistered++;
        // Use guild command ID if global registration failed
        if (!globalResponseOk) {
          await updateCommandDiscordId(command.id, guildCommand.id);
        }
      }

      // If global registration succeeded, use that ID (preferred for DMs)
      if (globalResponseOk && globalCommand) {
        await updateCommandDiscordId(command.id, globalCommand.id);
        registered++;
      } else if (response.ok) {
        registered++;
      }
    } catch (error) {
      const errorMsg = `Error registering command ${command.name}: ${
        error instanceof Error ? error.message : String(error)
      }`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  // Verify commands were registered by fetching them from Discord
  if (registered > 0) {
    try {
      // Verify global commands
      const globalVerifyUrl = `https://discord.com/api/v10/applications/${applicationId}/commands`;
      const globalVerifyResponse = await fetch(globalVerifyUrl, {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      });
      
      if (globalVerifyResponse.ok) {
        const globalCommands = (await globalVerifyResponse.json()) as Array<{ id: string; name: string }>;
        console.log(`[Bot ${botId}] ✅ Verificação GLOBAL: ${globalCommands.length} comando(s) encontrado(s) (funcionam em DMs e servidores):`);
        globalCommands.forEach((cmd) => {
          console.log(`[Bot ${botId}]   - /${cmd.name} (ID: ${cmd.id})`);
        });
      }

      // Verify guild commands
      const guildVerifyUrl = `https://discord.com/api/v10/applications/${applicationId}/guilds/${bot.discord.guildId}/commands`;
      const guildVerifyResponse = await fetch(guildVerifyUrl, {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      });
      
      if (guildVerifyResponse.ok) {
        const guildCommands = (await guildVerifyResponse.json()) as Array<{ id: string; name: string }>;
        console.log(`[Bot ${botId}] ✅ Verificação SERVIDOR: ${guildCommands.length} comando(s) encontrado(s) no servidor:`);
        guildCommands.forEach((cmd) => {
          console.log(`[Bot ${botId}]   - /${cmd.name} (ID: ${cmd.id})`);
        });
      }
      
      console.log(`[Bot ${botId}] ℹ️ Resumo: ${globalRegistered} comando(s) global(is) (DMs + servidores), ${guildRegistered} comando(s) no servidor`);
      console.log(`[Bot ${botId}] ℹ️ Comandos globais podem levar até 1 hora para aparecerem. Comandos de servidor aparecem imediatamente.`);
    } catch (verifyError) {
      console.warn(`[Bot ${botId}] ⚠️ Não foi possível verificar comandos registrados:`, verifyError);
    }
  }

  return { registered, total: commands.length, errors };
}

/**
 * Lista comandos registrados no Discord para um bot
 */
export async function listRegisteredCommandsInDiscord(
  botId: string,
): Promise<Array<{ id: string; name: string; description: string; type?: number }>> {
  const bot = await findBotById(botId);
  if (!bot) {
    throw new Error("Bot not found");
  }

  const botToken = decrypt(env.AUTH_SECRET, bot.discord.token);
  const tokenApplicationId = await getApplicationIdFromToken(botToken);
  
  if (!tokenApplicationId) {
    throw new Error("Could not retrieve Application ID from bot token");
  }

  const applicationId = tokenApplicationId;
  const url = `https://discord.com/api/v10/applications/${applicationId}/guilds/${bot.discord.guildId}/commands`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch commands: ${response.status}`);
    }

    return (await response.json()) as Array<{ id: string; name: string; description: string; type?: number }>;
  } catch (error) {
    console.error("Failed to list registered commands", error);
    throw error;
  }
}

