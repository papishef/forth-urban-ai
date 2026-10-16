import { connectDatabase, disconnectDatabase } from "../apps/server/src/db/connection.js";
import { logger } from "../apps/server/src/config/logger.js";
import { Session } from "../apps/server/src/modules/auth/session.model.js";
import { User } from "../apps/server/src/modules/users/user.model.js";

const shouldApply = process.argv.includes("--apply");

async function migrate(): Promise<void> {
  await connectDatabase();

  const ownerCount = await User.countDocuments({ role: "admin" });
  const legacyUsers = await User.find({ role: "sales" }).select("_id email");
  const legacyIds = legacyUsers.map((user) => user._id);

  logger.info(
    {
      mode: shouldApply ? "apply" : "dry-run",
      ownerCount,
      legacySalesUsers: legacyUsers.length,
    },
    "Sales role migration report",
  );

  if (!shouldApply) {
    await disconnectDatabase();
    return;
  }

  if (ownerCount !== 1) {
    throw new Error(`Refusing to migrate: expected exactly one owner admin, found ${ownerCount}`);
  }

  if (legacyIds.length > 0) {
    await User.updateMany(
      { _id: { $in: legacyIds } },
      { $set: { role: "user", status: "active" }, $unset: { adminAccess: 1 } },
      { runValidators: true },
    );
    await Session.updateMany({ userId: { $in: legacyIds }, revokedAt: null }, { revokedAt: new Date() });
  }

  logger.info({ migratedUsers: legacyIds.length }, "Sales role migration applied");
  await disconnectDatabase();
}

migrate().catch((err: unknown) => {
  logger.error({ err }, "Sales role migration failed");
  process.exitCode = 1;
});