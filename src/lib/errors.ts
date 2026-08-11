/**
 * Classified application errors. User errors are safe to show verbatim;
 * provider and infrastructure errors are logged and surfaced generically.
 */
export class AppError extends Error {
  constructor(
    public readonly kind: AppErrorKind,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }

  static user(message: string, code?: string) {
    return new AppError("user", message, code);
  }

  static provider(message: string, code?: string) {
    return new AppError("provider", message, code);
  }

  static infrastructure(message: string, code?: string) {
    return new AppError("infrastructure", message, code);
  }
}

export type AppErrorKind = "user" | "provider" | "infrastructure";

/** Returns a user-safe message for any thrown error. */
export function toUserMessage(error: unknown): string {
  if (error instanceof AppError && error.kind === "user") {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

/** Logs technical details server-side without leaking them to the client. */
export function logError(error: unknown) {
  if (error instanceof AppError) {
    console.error(`[${error.kind}] ${error.message}`, error.code ?? "");
  } else {
    console.error("Unexpected error:", error);
  }
}