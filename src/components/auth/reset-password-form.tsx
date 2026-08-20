// ---------------------------------------------------------------------------
// Reset-password form — DISABLED for future development (2026-08-20).
// Reached only via the email reset link; email sending is off. Re-enable
// alongside email sending.
// ---------------------------------------------------------------------------
//
// "use client";
//
// import { useState } from "react";
//
// import { createClient } from "@/lib/supabase/client";
// import { Alert } from "@/components/ui/alert";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
//
// export function ResetPasswordForm() {
//   const [error, setError] = useState<string | null>(null);
//   const [done, setDone] = useState(false);
//
//   async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     setError(null);
//     const formData = new FormData(e.currentTarget);
//     const password = String(formData.get("password") ?? "");
//
//     if (password.length < 8) {
//       setError("Password must be at least 8 characters.");
//       return;
//     }
//
//     const supabase = createClient();
//     const { error } = await supabase.auth.updateUser({ password });
//     if (error) {
//       setError(error.message);
//       return;
//     }
//     setDone(true);
//   }
//
//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       {done && (
//         <Alert variant="success">
//           Password updated. You can now sign in.
//         </Alert>
//       )}
//       {error && <Alert>{error}</Alert>}
//
//       <div className="space-y-1.5">
//         <Label htmlFor="password">New password</Label>
//         <Input
//           id="password"
//           name="password"
//           type="password"
//           autoComplete="new-password"
//           required
//         />
//       </div>
//
//       <Button type="submit" variant="primary" className="w-full">
//         Update password
//       </Button>
//     </form>
//   );
// }