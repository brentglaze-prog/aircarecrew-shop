import { CategoryForm } from "@/components/admin/category-form";
import { createCategory } from "@/app/admin/categories/actions";

export default function NewCategoryPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">New category</h1>
      <div className="mt-6">
        <CategoryForm action={createCategory} />
      </div>
    </div>
  );
}
