/**
 * Mongoose connection module — Phase 1.
 *
 * Owns: connection bootstrap with retry/backoff, and base schema plugin
 * adding createdAt/updatedAt/deletedAt/version to every model
 * (see docs/ARCHITECTURE.md#5-database-schema-mongodb-atlas).
 */
import dns from "node:dns";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const MAX_RETRY_DELAY_MS = 30_000;
const INITIAL_RETRY_DELAY_MS = 1_000;
const FALLBACK_DNS_SERVERS = ["1.1.1.1", "8.8.8.8"];

let usingFallbackDns = false;

// Some resolvers (e.g. mobile hotspots) return SRV answers Node's c-ares
// rejects with EBADRESP, which breaks `mongodb+srv://` URIs. Switch to public
// resolvers once so the connection can recover.
function switchToFallbackDnsIfSrvFailed(err: unknown): boolean {
  const syscall = (err as { syscall?: string } | null)?.syscall;
  if (usingFallbackDns || syscall !== "querySrv") return false;
  dns.setServers(FALLBACK_DNS_SERVERS);
  usingFallbackDns = true;
  logger.warn({ servers: FALLBACK_DNS_SERVERS }, "MongoDB SRV lookup failed, switching to fallback DNS servers");
  return true;
}

/**
 * Connects to MongoDB with exponential backoff retry. Resolves once connected;
 * never gives up (this is a small app — a down DB should keep retrying rather
 * than crash-loop the process).
 */
export async function connectDatabase(uri: string = env.MONGODB_URI): Promise<typeof mongoose> {
  mongoose.set("strictQuery", true);

  let attempt = 0;
  for (;;) {
    try {
      const connection = await mongoose.connect(uri);
      logger.info("Connected to MongoDB");
      return connection;
    } catch (err) {
      if (switchToFallbackDnsIfSrvFailed(err)) continue;
      attempt += 1;
      const delay = Math.min(INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS);
      logger.error({ err, attempt, delay }, "MongoDB connection failed, retrying");
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB connection lost");
});

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB connection restored");
});

