import { isAxiosError } from "axios";

/** Extracts a user-facing message from our API's `{success,message,data,errors}` envelope. */
export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
