import type { JwtAccessPayload } from "@forth-urban/shared-types";

declare global {
  namespace Express {
    interface Request {
      /** Populated by `requireAuth` middleware after verifying the access token. */
      auth?: JwtAccessPayload;
    }
  }
}

export {};
