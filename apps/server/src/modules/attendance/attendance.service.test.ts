import { describe, expect, it } from "vitest";
import { createStaff, updateStaff } from "./attendance.service.js";
import { Staff } from "./staff.model.js";

const baseStaffInput = {
  firstName: "Ada",
  lastName: "Lovelace",
  department: "Operations",
  role: "Coordinator",
};

describe("attendance staff service", () => {
  it("allows multiple staff members without badge IDs", async () => {
    await Staff.init();

    const first = await createStaff({
      ...baseStaffInput,
      email: "ada@example.com",
    });
    const second = await createStaff({
      ...baseStaffInput,
      email: "grace@example.com",
    });
    const third = await createStaff({
      ...baseStaffInput,
      email: "mary@example.com",
      badgeId: null,
    });

    expect(first.badgeId).toBeUndefined();
    expect(second.badgeId).toBeUndefined();
    expect(third.badgeId).toBeUndefined();
  });

  it("unsets a badge ID when it is updated to null", async () => {
    await Staff.init();

    const original = await createStaff({
      ...baseStaffInput,
      email: "alan@example.com",
      badgeId: "badge-001",
    });

    const updated = await updateStaff(original.id, { badgeId: null });
    const replacement = await createStaff({
      ...baseStaffInput,
      email: "margaret@example.com",
      badgeId: "badge-001",
    });

    expect(updated.badgeId).toBeUndefined();
    expect(replacement.badgeId).toBe("badge-001");
  });
});
