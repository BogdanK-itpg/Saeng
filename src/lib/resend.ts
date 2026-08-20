// ---------------------------------------------------------------------------
// Email sending (Resend) — DISABLED for future development (2026-08-20).
// Auth is username-based now; Supabase Auth's synthetic accounts have no real
// inbox, so no app-level email is sent. Re-enable when real email delivery is
// wanted (e.g. shout notifications). The `resend` package stays in
// package.json so this file type-checks when restored.
// ---------------------------------------------------------------------------
//
// import { Resend } from "resend";
//
// import { AppError } from "@/lib/errors";
//
// // Server-only Resend client. Requires the `RESEND_API_KEY` environment
// // variable and MUST NEVER be imported from client components.
// export function createResendClient() {
//   const apiKey = process.env.RESEND_API_KEY;
//
//   if (!apiKey) {
//     throw new Error(
//       "Missing RESEND_API_KEY. Set it in your environment before sending email.",
//     );
//   }
//
//   return new Resend(apiKey);
// }
//
// export type SendEmailInput = {
//   to: string;
//   subject: string;
//   html: string;
//   from?: string;
// };
//
// // Sends an email through Resend. Defaults to the `onboarding@resend.dev`
// // sender while no verified domain is configured.
// export async function sendEmail({
//   to,
//   subject,
//   html,
//   from = "onboarding@resend.dev",
// }: SendEmailInput) {
//   try {
//     const { error } = await createResendClient().emails.send({
//       from,
//       to,
//       subject,
//       html,
//     });
//
//     if (error) {
//       throw AppError.provider("Failed to send email", error.name);
//     }
//   } catch (error) {
//     if (error instanceof AppError) throw error;
//     throw AppError.infrastructure("Failed to send email");
//   }
// }