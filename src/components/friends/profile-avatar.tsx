export function ProfileAvatar({
  avatarUrl,
  displayName,
  size = "md",
}: {
  avatarUrl: string | null;
  displayName: string;
  size?: "sm" | "md" | "lg";
}) {
  const px =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-16 w-16" : "h-10 w-10";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl ?? "/avatar-placeholder.svg"}
      alt={`${displayName}'s avatar`}
      className={`${px} shrink-0 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-800`}
    />
  );
}