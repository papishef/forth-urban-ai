import type { Schema } from "mongoose";

/**
 * Shared audit-field plugin applied to every Mongoose schema in the app
 * (AGENTS.md rule #3: createdAt/updatedAt/deletedAt/version, no hard deletes).
 *
 * - `createdAt`/`updatedAt` come from Mongoose's built-in `timestamps` option.
 * - `deletedAt` implements soft delete; queries exclude soft-deleted documents
 *   by default unless `{ withDeleted: true }` is passed as a query option.
 * - `version` is a plain incrementing counter (kept separate from Mongoose's
 *   internal `__v` optimistic-concurrency key, which is disabled here).
 */
export function applyBaseSchema(schema: Schema): void {
  schema.set("timestamps", true);
  schema.set("versionKey", false);

  schema.add({
    deletedAt: { type: Date, default: null },
    version: { type: Number, default: 0 },
  });

  schema.pre("save", function preSave(next) {
    if (!this.isNew) {
      this.set("version", (this.get("version") as number) + 1);
    }
    next();
  });

  const excludeSoftDeleted = function excludeSoftDeleted(this: {
    getQuery: () => Record<string, unknown>;
    getOptions: () => Record<string, unknown>;
    where: (cond: Record<string, unknown>) => unknown;
  }) {
    const options = this.getOptions();
    const query = this.getQuery();
    if (!options.withDeleted && query.deletedAt === undefined) {
      this.where({ deletedAt: null });
    }
  };

  schema.pre(["find", "findOne", "countDocuments", "findOneAndUpdate"], excludeSoftDeleted);

  schema.methods.softDelete = function softDelete() {
    this.set("deletedAt", new Date());
    return this.save();
  };
}
