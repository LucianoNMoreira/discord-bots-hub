import { NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { saveAvatarFile } from "@/lib/uploads";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Avatar file is required" },
      { status: 400 },
    );
  }

  const schema = z.object({
    size: z.number().positive().max(MAX_FILE_SIZE_BYTES),
    type: z
      .string()
      .regex(/^image\//, "Only image uploads are allowed")
      .optional(),
  });

  const validation = schema.safeParse({
    size: file.size,
    type: file.type,
  });

  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Invalid avatar file",
        details: validation.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const url = await saveAvatarFile(file);
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("Failed to upload avatar", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 },
    );
  }
}


