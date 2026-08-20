import { Spinner } from "@/components/ui/spinner";

export default function AuthLoading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <Spinner className="h-8 w-8 animate-spin" />
    </div>
  );
}