"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveProduct, deleteProduct, duplicateProduct } from "@/app/admin/products/actions";

export function ProductRowActions({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDuplicate() {
    startTransition(async () => {
      await duplicateProduct(id);
      router.refresh();
    });
  }

  function handleArchive() {
    if (!window.confirm("Archive this product? It will be hidden from the storefront.")) return;
    startTransition(async () => {
      await archiveProduct(id);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!window.confirm("Permanently delete this product? This cannot be undone.")) return;
    startTransition(async () => {
      try {
        await deleteProduct(id);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Could not delete product.");
      }
    });
  }

  return (
    <div className="flex flex-wrap justify-end gap-3 text-sm">
      <button onClick={handleDuplicate} disabled={pending} className="underline">
        Duplicate
      </button>
      {status !== "archived" && (
        <button onClick={handleArchive} disabled={pending} className="underline">
          Archive
        </button>
      )}
      <button onClick={handleDelete} disabled={pending} className="text-red-600 underline">
        Delete
      </button>
    </div>
  );
}
