"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { ProductImage } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  createProductImageUploadUrl,
  deleteProductImage,
  finalizeProductImageUpload,
  moveImage,
  setPrimaryImage,
} from "@/app/admin/products/image-actions";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_BYTES = 8 * 1024 * 1024;

export function ProductImagesManager({ productId, images }: { productId: string; images: ProductImage[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      const supabase = createClient();

      for (const file of Array.from(files)) {
        if (!ALLOWED_TYPES.has(file.type)) {
          setError(`${file.name}: Only JPEG, PNG, WebP, or AVIF images are allowed.`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          setError(`${file.name}: Image is larger than the 8 MB limit.`);
          continue;
        }

        const ticket = await createProductImageUploadUrl(
          productId,
          file.name,
          file.type,
          file.size
        );

        if (!ticket.ok) {
          setError(`${file.name}: ${ticket.error}`);
          continue;
        }

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .uploadToSignedUrl(ticket.path, ticket.token, file);

        if (uploadError) {
          setError(`${file.name}: Upload failed — ${uploadError.message}`);
          continue;
        }

        const result = await finalizeProductImageUpload(productId, ticket.path);
        if (!result.ok) {
          setError(`${file.name}: ${result.error}`);
        }
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const sorted = [...images].sort((a, b) => a.display_order - b.display_order);
  const busy = pending || uploading;

  return (
    <div>
      {error && <p className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {sorted.map((img, i) => (
          <div key={img.id} className="rounded-md border border-graphite-950/10 p-2">
            <div className="relative aspect-square overflow-hidden rounded bg-graphite-800/5">
              <Image src={img.url} alt={img.alt_text ?? ""} fill sizes="200px" className="object-cover" />
              {img.is_primary && (
                <span className="absolute left-1 top-1 rounded bg-violet-500 px-1.5 py-0.5 text-[10px] font-semibold text-offwhite">
                  Primary
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-xs">
              <div className="flex gap-1">
                <button
                  disabled={i === 0 || busy}
                  onClick={() => startTransition(() => moveImage(img.id, productId, "up"))}
                  className="underline disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  disabled={i === sorted.length - 1 || busy}
                  onClick={() => startTransition(() => moveImage(img.id, productId, "down"))}
                  className="underline disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
              {!img.is_primary && (
                <button
                  disabled={busy}
                  onClick={() => startTransition(() => setPrimaryImage(img.id, productId))}
                  className="underline disabled:opacity-30"
                >
                  Make primary
                </button>
              )}
              <button
                disabled={busy}
                onClick={() => startTransition(() => deleteProductImage(img.id, productId))}
                className="text-red-600 underline disabled:opacity-30"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <label className={`btn-secondary mt-4 inline-flex ${busy ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
        {uploading ? "Uploading…" : "Upload image(s)"}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          disabled={busy}
          className="sr-only"
          onChange={handleFileChange}
        />
      </label>
      <p className="mt-1 text-xs text-graphite-600">
        JPEG, PNG, WebP, or AVIF. Max 8 MB each. Images upload directly to secure storage.
      </p>
    </div>
  );
}