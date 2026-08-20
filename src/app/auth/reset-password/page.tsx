// ---------------------------------------------------------------------------
// Reset-password page — DISABLED for future development (2026-08-20).
// Reached only via the email reset link; email sending is off. Re-enable
// alongside email sending.
// ---------------------------------------------------------------------------
//
// import type { Metadata } from "next";
//
// import { ResetPasswordForm } from "@/components/auth/reset-password-form";
//
// export const metadata: Metadata = { title: "Set new password" };
//
// export default function ResetPasswordPage() {
//   return (
//     <div className="flex flex-1 items-center justify-center px-4 py-12">
//       <div className="w-full max-w-sm">
//         <h1 className="mb-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
//           Set a new password
//         </h1>
//         <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
//           Choose a strong password for your account.
//         </p>
//         <ResetPasswordForm />
//       </div>
//     </div>
//   );
// }

import { notFound } from "next/navigation";

export default function DisabledPage() {
  notFound();
}