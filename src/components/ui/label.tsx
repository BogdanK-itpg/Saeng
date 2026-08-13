import { cn } from "@/utils/cn";

export function Label({
  htmlFor,
  children,
  className,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("block text-sm font-medium text-zinc-800 dark:text-zinc-200", className)}
    >
      {children}
    </label>
  );
}