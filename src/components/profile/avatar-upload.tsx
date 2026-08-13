"use client";

import { useRef, useState } from "react";

import { setAvatarAction } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export function AvatarUpload({
  userId,
  avatarUrl,
}: {
  userId: string;
  avatarUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Only JPG, PNG, or WebP images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    const supabase = createClient();
    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;

    setUploading(true);
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setUploading(false);
      setError("Upload failed. Please try again.");
      return;
    }

    const formData = new FormData();
    formData.set("path", path);
    await setAvatarAction(formData);
    setUploading(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl ?? "/avatar-placeholder.svg"}
          alt="Your avatar"
          width={96}
          height={96}
          className="h-24 w-24 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
        />
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Spinner className="h-4 w-4 animate-spin" /> Uploading…
              </>
            ) : (
              "Change avatar"
            )}
          </Button>
        </div>
      </div>
      {error && <Alert>{error}</Alert>}
    </div>
  );
}