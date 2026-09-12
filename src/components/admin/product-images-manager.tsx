"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import type { ProductImage } from "@/lib/types";
import {
  deleteProductImage,
  moveImage,
  setPrimaryImage,
  uploadProductImage,
} from "@/app/admin/products/image-actions";

export function ProductImagesManager({ productId, images }: { productId: string; images: ProductImage[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        await uploadProductImage(productId, formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const sorted = [...images].sort((a, b) => a.display_order - b.display_order);

  return (
    <div>
      {error && <p className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {sorted.map((img, i) => (
          <div key={img.id} className="rounded-md border border-graphite-950/10 p-2">
            <div className="relative aspect-square overflow-hidden rounded bg-graphite-800/5">
              <Image src={img.url} alt={img.alt_text ?? ""} fill sizes="200px" className="object-cover" />
              {img.is_primary && (
                <span className="absolute left-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-graphite-950">
                  Primary
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-xs">
              <div className="flex gap-1">
                <button
                  disabled={i === 0 || pending}
                  onClick={() => startTransition(() => moveImage(img.id, productId, "up"))}
                  className="underline disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  disabled={i === sorted.length - 1 || pending}
                  onClick={() => startTransition(() => moveImage(img.id, productId, "down"))}
                  className="underline disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
              {!img.is_primary && (
                <button
                  disabled={pending}
                  onClick={() => startTransition(() => setPrimaryImage(img.id, productId))}
                  className="underline"
                >
                  Make primary
                </button>
              )}
              <button
                disabled={pending}
                onClick={() => startTransition(() => deleteProductImage(img.id, productId))}
                className="text-red-600 underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <label className="btn-secondary mt-4 inline-flex cursor-pointer">
        Upload image(s)
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          onChange={handleFileChange}
        />
      </label>
      <p className="mt-1 text-xs text-graphite-600">JPEG, PNG, WebP, or AVIF. Max 8 MB each.</p>
    </div>
  );
}
