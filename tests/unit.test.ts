import { describe, expect, it } from "vitest";

import { AppError, toUserMessage } from "@/lib/errors";
import { authEmailForUsername } from "@/lib/auth/username-email";
import { cn } from "@/utils/cn";
import { rateLimit } from "@/lib/rate-limit";

describe("AppError / toUserMessage", () => {
  it("classifies errors by kind", () => {
    expect(AppError.user("bad").kind).toBe("user");
    expect(AppError.provider("down").kind).toBe("provider");
    expect(AppError.infrastructure("db", "42P01").kind).toBe("infrastructure");
    expect(AppError.user("bad").code).toBeUndefined();
  });

  it("surfaces only user errors verbatim", () => {
    expect(toUserMessage(AppError.user("That username is taken."))).toBe(
      "That username is taken.",
    );
    expect(toUserMessage(AppError.infrastructure("boom"))).toBe(
      "Something went wrong. Please try again.",
    );
    expect(toUserMessage(new Error("secret detail"))).toBe(
      "Something went wrong. Please try again.",
    );
  });
});

describe("authEmailForUsername", () => {
  it("lowercases and maps to the synthetic domain", () => {
    expect(authEmailForUsername("Alex")).toBe("alex@songshout.local");
    expect(authEmailForUsername("alex_baumann")).toBe(
      "alex_baumann@songshout.local",
    );
  });
});

describe("cn", () => {
  it("joins truthy values and drops falsy ones", () => {
    expect(cn("a", false, "b", null, undefined, "c")).toBe("a b c");
    expect(cn()).toBe("");
  });
});

describe("rateLimit", () => {
  it("allows requests up to the limit, then blocks with a retry window", () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    let last: { ok: boolean; retryAfter: number } = { ok: true, retryAfter: 0 };
    for (let i = 0; i < 3; i++) {
      last = rateLimit(key, 3, 60_000);
      expect(last.ok).toBe(true);
    }
    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });
});