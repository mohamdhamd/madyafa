import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "madyafa_secret_fallback_key_2026";
export const AUTH_COOKIE_NAME = "madyafa_auth_token";

export interface TokenPayload {
  userId: string;
  username: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function getAuthUserFromRequest(request: NextRequest): TokenPayload | null {
  // Check HTTP-only cookie first
  const cookie = request.cookies.get(AUTH_COOKIE_NAME);
  if (cookie?.value) {
    const verified = verifyToken(cookie.value);
    if (verified) return verified;
  }

  // Check Authorization Bearer header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    return verifyToken(token);
  }

  return null;
}
