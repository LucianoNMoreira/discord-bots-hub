import { NextResponse } from "next/server";

import { defaultLocale, isLocale } from "@/i18n/config";

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      locale?: unknown;
    };

    const targetLocale = isLocale(body.locale)
      ? body.locale
      : defaultLocale;

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: "locale",
      value: targetLocale,
      path: "/",
      maxAge: THIRTY_DAYS_IN_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Failed to set locale cookie", error);
    return NextResponse.json(
      { error: "Failed to set locale" },
      { status: 500 },
    );
  }
}


