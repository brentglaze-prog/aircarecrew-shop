"use client";

import { useTransition } from "react";
import { deleteCategory } from "@/app/admin/categories/actions";

export function DeleteCategoryButton({
  id,
  name,
  productCount,
}: {
  id: string;
  name: string;
  productCount: number;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const warning =
      productCount > 0
        ? `Delete "${name}"? ${productCount} product(s) in this category will become uncategorized (they will NOT be deleted).`
        : `Delete "${name}"?`;
    if (!window.confirm(warning)) return;
    startTransition(() => deleteCategory(id));
  }

  return (
    <button onClick={handleClick} disabled={pending} className="text-sm text-red-600 underline">
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
