import { promises as fs } from 'fs';
import path from 'path';

import { logger } from '../../../logger.js';
import { BotRepository } from '../bot.repository.js';
import { BotRecord } from '../bot.types.js';

const STORAGE_DIR = path.resolve(process.cwd(), 'storage');
const STORAGE_FILE = path.resolve(STORAGE_DIR, 'bots.json');

export class FileBotRepository implements BotRepository {
  private readonly ready: Promise<void>;

  constructor() {
    this.ready = this.ensureStorage();
  }

  async list(): Promise<BotRecord[]> {
    await this.ready;
    const data = await this.readFile();
    return data.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async findById(id: string): Promise<BotRecord | null> {
    await this.ready;
    const data = await this.readFile();
    return data.find((bot) => bot.id === id) ?? null;
  }

  async create(record: BotRecord): Promise<void> {
    await this.ready;
    const data = await this.readFile();
    data.push(record);
    await this.writeFile(data);
  }

  async update(record: BotRecord): Promise<void> {
    await this.ready;
    const data = await this.readFile();
    const index = data.findIndex((bot) => bot.id === record.id);
    if (index < 0) {
      throw new Error(`Bot ${record.id} not found for update.`);
    }
    data[index] = record;
    await this.writeFile(data);
  }

  async delete(id: string): Promise<void> {
    await this.ready;
    const data = await this.readFile();
    const filtered = data.filter((bot) => bot.id !== id);
    await this.writeFile(filtered);
  }

  private async ensureStorage(): Promise<void> {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    try {
      await fs.access(STORAGE_FILE);
    } catch {
      await fs.writeFile(STORAGE_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  private async readFile(): Promise<BotRecord[]> {
    try {
      const raw = await fs.readFile(STORAGE_FILE, 'utf-8');
      if (!raw) return [];
      const data = JSON.parse(raw) as BotRecord[];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      logger.error({ error }, 'Failed to read bots from storage');
      return [];
    }
  }

  private async writeFile(data: BotRecord[]): Promise<void> {
    await fs.writeFile(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }
}

