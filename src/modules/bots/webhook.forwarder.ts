import axios from 'axios';
import type { Message } from 'discord.js';

import { logger } from '../../logger.js';
import type { BotRecord } from './bot.types.js';

export class WebhookForwarder {
  async forwardMessage(bot: BotRecord, message: Message): Promise<void> {
    try {
      await axios.post(
        bot.webhookUrl,
        {
          botId: bot.id,
          botName: bot.name,
          interactionOrigin: bot.interactionOrigin,
          guildId: message.guildId,
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
        },
        {
          timeout: 10_000,
        },
      );
    } catch (error) {
      logger.error({ error }, `Failed to forward message from bot ${bot.id}`);
    }
  }
}

