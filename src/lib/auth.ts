import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

import { env } from "./env";

export const SESSION_COOKIE_NAME = "dbm_session";
const DEFAULT_SESSION_DURATION_SECONDS = 60 * 60 * 8;
const isProduction = process.env.NODE_ENV === "production";

type SessionPayload = {
  sub: string;
  exp: number;
  iat: number;
  jti: string;
};

const base64UrlEncode = (input: string | Buffer) =>
  Buffer.from(input).toString("base64url");

const base64UrlDecode = (input: string) =>
  Buffer.from(input, "base64url").toString("utf8");

function sign(data: string) {
  return createHmac("sha256", env.AUTH_SECRET).update(data).digest("base64url");
}

export function generateSessionToken(username: string) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: username,
    exp: issuedAt + DEFAULT_SESSION_DURATION_SECONDS,
    iat: issuedAt,
    jti: randomBytes(8).toString("hex"),
  };
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(`${encodedHeader}.${encodedPayload}`);
  return {
    token: `${encodedHeader}.${encodedPayload}.${signature}`,
    payload,
  };
}

export function verifySessionToken(token: string | undefined | null) {
  if (!token) return null;
  const segments = token.split(".");
  if (segments.length !== 3) return null;
  const [header, payload, signature] = segments;
  const expectedSignature = sign(`${header}.${payload}`);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    return null;
  }
  try {
    const parsedPayload = JSON.parse(
      base64UrlDecode(payload),
    ) as SessionPayload;
    if (parsedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsedPayload;
  } catch (error) {
    console.error("Failed to parse session token payload", error);
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = verifySessionToken(token);
  if (!payload) return null;
  return { username: payload.sub };
}

export async function persistSession(username: string) {
  const { token, payload } = generateSessionToken(username);
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: payload.exp - Math.floor(Date.now() / 1000),
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}


