import jwt from "jsonwebtoken";
import type { JwtAccessPayload, UserRole } from "@forth-urban/shared-types";
import { env } from "../../config/env.js";

const ACCESS_TOKEN_TYPE = "access";
const REFRESH_TOKEN_TYPE = "refresh";
const KIOSK_TOKEN_TYPE = "kiosk";

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  type: typeof REFRESH_TOKEN_TYPE;
}

export function signAccessToken(payload: { sub: string; role: UserRole; email: string }): string {
  return jwt.sign({ ...payload, type: ACCESS_TOKEN_TYPE }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
  if (decoded.type !== ACCESS_TOKEN_TYPE) throw new Error("Invalid token type");
  return { sub: decoded.sub as string, role: decoded.role as UserRole, email: decoded.email as string };
}

export interface KioskTokenPayload {
  sub: string;
  role: UserRole;
  email: string;
  type: typeof KIOSK_TOKEN_TYPE;
}

export function signKioskToken(
  payload: { sub: string; role: UserRole; email: string },
  durationHours: number,
): string {
  return jwt.sign({ ...payload, type: KIOSK_TOKEN_TYPE }, env.JWT_ACCESS_SECRET, {
    expiresIn: `${durationHours}h` as jwt.SignOptions["expiresIn"],
  });
}

export function verifyKioskToken(token: string): KioskTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
  if (decoded.type !== KIOSK_TOKEN_TYPE) throw new Error("Invalid token type");
  return {
    sub: decoded.sub as string,
    role: decoded.role as UserRole,
    email: decoded.email as string,
    type: KIOSK_TOKEN_TYPE,
  };
}

export function signRefreshToken(payload: { sub: string; sessionId: string }): string {
  return jwt.sign({ ...payload, type: REFRESH_TOKEN_TYPE }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL as jwt.SignOptions["expiresIn"],
  });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
  if (decoded.type !== REFRESH_TOKEN_TYPE) throw new Error("Invalid token type");
  return { sub: decoded.sub as string, sessionId: decoded.sessionId as string, type: REFRESH_TOKEN_TYPE };
}

/** Reads the `exp` claim off any signed JWT and returns it as an ISO timestamp. */
export function getTokenExpiry(token: string): string {
  const decoded = jwt.decode(token) as jwt.JwtPayload | null;
  return new Date((decoded?.exp ?? 0) * 1000).toISOString();
}
