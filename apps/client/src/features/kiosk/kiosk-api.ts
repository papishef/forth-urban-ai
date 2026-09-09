import type { KioskSessionDTO } from "@forth-urban/shared-types";
import { API_BASE_URL } from "../../lib/api-client.js";

const KIOSK_SESSION_STORAGE_KEY = "forth-urban.kiosk-session";
const KIOSK_DEVICE_ID_STORAGE_KEY = "forth-urban.kiosk-device-id";
let memoryDeviceId: string | null = null;

function isKioskSession(value: unknown): value is KioskSessionDTO {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<KioskSessionDTO>;
  return (
    typeof session.token === "string" &&
    typeof session.expiresAt === "string" &&
    Boolean(session.user) &&
    typeof session.user?.email === "string"
  );
}

export function readKioskSession(): KioskSessionDTO | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(KIOSK_SESSION_STORAGE_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (!isKioskSession(parsed) || new Date(parsed.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(KIOSK_SESSION_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveKioskSession(session: KioskSessionDTO): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KIOSK_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // The in-memory provider state still protects the active tab.
  }
}

export function clearKioskSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KIOSK_SESSION_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function getKioskDeviceId(): string {
  if (memoryDeviceId) return memoryDeviceId;
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(KIOSK_DEVICE_ID_STORAGE_KEY);
      if (stored) {
        memoryDeviceId = stored;
        return stored;
      }
    } catch {
      // Fall through to an in-memory identifier.
    }
  }

  const generated = globalThis.crypto?.randomUUID?.() ?? `kiosk-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  memoryDeviceId = generated;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KIOSK_DEVICE_ID_STORAGE_KEY, generated);
    } catch {
      // The generated in-memory identifier is still useful for this session.
    }
  }
  return generated;
}

export function kioskFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const session = readKioskSession();
  if (session) headers.set("Authorization", `Bearer ${session.token}`);
  headers.set("X-Kiosk-Device-Id", getKioskDeviceId());
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers, credentials: "include" });
}