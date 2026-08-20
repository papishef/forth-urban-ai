import type { JwtAccessPayload } from "@forth-urban/shared-types";
import type { UserDocument } from "../modules/users/user.model.js";

declare global {
  namespace Express {
    interface Request {
      /** Populated by `requireAuth` middleware after verifying the access token. */
      auth?: JwtAccessPayload;
      /** Current user loaded from MongoDB by `requireAuth`; never sourced from JWT claims. */
      authUser?: UserDocument;
    }
  }
}

export {};
