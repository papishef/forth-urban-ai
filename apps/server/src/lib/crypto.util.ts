import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

export function generateNumericCode(length = 6): string {
  const max = 10 ** length;
  const value = crypto.randomInt(0, max);
  return value.toString().padStart(length, "0");
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function hashSecret(secret: string): Promise<string> {
  return bcrypt.hash(secret, BCRYPT_ROUNDS);
}

export async function compareSecret(secret: string, hash: string): Promise<boolean> {
  return bcrypt.compare(secret, hash);
}
