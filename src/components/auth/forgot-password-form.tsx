// ---------------------------------------------------------------------------
// Forgot-password form — DISABLED for future development (2026-08-20).
// Email-driven password reset is off. Re-enable alongside email sending.
// ---------------------------------------------------------------------------
//
// "use client";
//
// import { useActionState } from "react";
// import Link from "next/link";
//
// import { forgotPasswordAction } from "@/app/actions/auth";
// import { Alert } from "@/components/ui/alert";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
//
// export function ForgotPasswordForm({ sent }: { sent?: boolean }) {
//   const [state, action, pending] = useActionState(forgotPasswordAction, {
//     error: "",
//   });
//
//   return (
//     <form action={action} className="space-y-4">
//       {sent && (
//         <Alert variant="success">
//           If that email has an account, a reset link is on its way.
//         </Alert>
//       )}
//       {state.error && <Alert>{state.error}</Alert>}
//
//       <div className="space-y-1.5">
//         <Label htmlFor="email">Email</Label>
//         <Input id="email" name="email" type="email" autoComplete="email" required />
//       </div>
//
//       <Button
//         type="submit"
//         variant="primary"
//         disabled={pending}
//         className="w-full"
//       >
//         {pending ? "Sending…" : "Send reset link"}
//       </Button>
//
//       <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
//         <Link href="/login" className="font-medium hover:underline">
//           Back to sign in
//         </Link>
//       </p>
//     </form>
//   );
// }