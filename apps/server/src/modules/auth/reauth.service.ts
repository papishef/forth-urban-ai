import { ApiError } from "../../middleware/error-handler.js";
import { compareSecret, generateOpaqueToken, hashSecret } from "../../lib/crypto.util.js";
import { User } from "../users/user.model.js";
import { ReauthToken } from "./reauth-token.model.js";

const REAUTH_TOKEN_TTL_MS = 5 * 60 * 1000;

export async function issueReauthToken(userId: string, password: string): Promise<string> {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user?.passwordHash) throw new ApiError(401, "Incorrect password");

  const valid = await compareSecret(password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Incorrect password");

  const token = generateOpaqueToken();
  await ReauthToken.create({
    userId: user._id,
    tokenHash: await hashSecret(token),
    purpose: "admin-access-change",
    expiresAt: new Date(Date.now() + REAUTH_TOKEN_TTL_MS),
  });
  return token;
}

export async function consumeReauthToken(userId: string, token: string): Promise<void> {
  const candidates = await ReauthToken.find({
    userId,
    purpose: "admin-access-change",
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  for (const candidate of candidates) {
    if (!(await compareSecret(token, candidate.tokenHash))) continue;
    const consumed = await ReauthToken.findOneAndUpdate(
      { _id: candidate._id, consumedAt: null },
      { consumedAt: new Date() },
      { new: true },
    );
    if (consumed) return;
  }

  throw new ApiError(401, "A recent password confirmation is required");
}