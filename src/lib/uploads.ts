import { promises as fs } from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export async function saveAvatarFile(file: File) {
  const mimeType = file.type || "application/octet-stream";
  const extension = EXTENSION_BY_MIME[mimeType] ?? "png";
  console.log("[Uploads] Ensuring uploads directory exists...");
  await ensureUploadsDir();
  const filename = `${uuid()}.${extension}`;
  const targetPath = path.join(UPLOADS_DIR, filename);
  console.log("[Uploads] Target path:", targetPath);
  const buffer = Buffer.from(await file.arrayBuffer());
  console.log("[Uploads] Writing file, buffer size:", buffer.length);
  await fs.writeFile(targetPath, buffer);
  console.log("[Uploads] File written successfully!");
  // Retornar URL através da API para garantir que funciona em standalone
  return `/api/uploads/${filename}`;
}


