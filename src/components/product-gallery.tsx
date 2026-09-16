"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/lib/types";

export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-lg bg-offwhite text-graphite-600">
        No image yet
      </div>
    );
  }

  const active = images[activeIndex] ?? images[0]!;

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-offwhite">
        <Image
          src={active.url}
          alt={active.alt_text ?? productName}
          fill
          priority
          unoptimized
          sizes="(min-width: 1280px) 42vw, (min-width: 1024px) 50vw, 100vw"
          className="object-contain p-4"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === activeIndex}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border-2 bg-offwhite ${
                i === activeIndex ? "border-graphite-950" : "border-transparent"
              }`}
            >
              <Image src={img.url} alt="" fill unoptimized sizes="64px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
