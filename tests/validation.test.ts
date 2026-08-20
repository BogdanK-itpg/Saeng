import { describe, expect, it } from "vitest";

import {
  loginSchema,
  profileSchema,
  reactionSchema,
  registerSchema,
  shoutMessageSchema,
  usernameSchema,
} from "@/lib/validation/schemas";

describe("usernameSchema", () => {
  it("accepts lowercase letters, numbers, underscores", () => {
    expect(usernameSchema.safeParse("alex_baumann").success).toBe(true);
  });
  it("rejects uppercase letters", () => {
    expect(usernameSchema.safeParse("Alex").success).toBe(false);
  });
  it("rejects spaces and symbols", () => {
    expect(usernameSchema.safeParse("alex baumann").success).toBe(false);
    expect(usernameSchema.safeParse("alex!").success).toBe(false);
  });
  it("enforces length bounds", () => {
    expect(usernameSchema.safeParse("ab").success).toBe(false);
    expect(usernameSchema.safeParse("a".repeat(21)).success).toBe(false);
    expect(usernameSchema.safeParse("abc").success).toBe(true);
  });
});

describe("passwordSchema", () => {
  it("requires at least 8 characters", () => {
    expect(registerSchema.safeParse({
      username: "alex",
      displayName: "Alex",
      password: "short1",
    }).success).toBe(false);
    expect(registerSchema.safeParse({
      username: "alex",
      displayName: "Alex",
      password: "longenough1",
    }).success).toBe(true);
  });
});

describe("shoutMessageSchema", () => {
  it("allows empty and null messages", () => {
    expect(shoutMessageSchema.parse("")).toBeNull();
    expect(shoutMessageSchema.parse(null)).toBeNull();
    expect(shoutMessageSchema.parse(undefined)).toBeNull();
  });
  it("transforms a non-empty message to trimmed text", () => {
    expect(shoutMessageSchema.parse("  hi  ")).toBe("hi");
  });
  it("rejects messages over 280 characters", () => {
    expect(shoutMessageSchema.safeParse("x".repeat(281)).success).toBe(false);
  });
});

describe("reactionSchema", () => {
  it("accepts emoji and short strings within 1–32 chars", () => {
    expect(reactionSchema.safeParse("❤️").success).toBe(true);
    expect(reactionSchema.safeParse("fire").success).toBe(true);
    expect(reactionSchema.safeParse("").success).toBe(false);
    expect(reactionSchema.safeParse("x".repeat(33)).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires a non-empty password", () => {
    expect(loginSchema.safeParse({ username: "alex", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ username: "alex", password: "x" }).success).toBe(true);
  });
});

describe("profileSchema", () => {
  it("requires both fields", () => {
    expect(profileSchema.safeParse({ username: "alex", displayName: "" }).success).toBe(false);
    expect(profileSchema.safeParse({ username: "alex", displayName: "Alex" }).success).toBe(true);
  });
});