import { discordBotManager } from "./discord-bot-manager";

let initialized = false;

export async function initializeBots() {
  if (initialized) {
    return;
  }

  // Only initialize in production or when explicitly enabled
  if (process.env.NODE_ENV === "production" || process.env.AUTO_START_BOTS === "true") {
    console.log("Initializing Discord bots...");
    await discordBotManager.initialize();
    initialized = true;
  }
}

