import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/category-form";
import { updateCategory } from "@/app/admin/categories/actions";
import { getAdminContext } from "@/lib/admin-context";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;
  const { db } = await getAdminContext();
  const { data: category } = await db.from("categories").select("*").eq("id", id).maybeSingle();
  if (!category) notFound();

  const boundAction = updateCategory.bind(null, id);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Edit category</h1>
      <div className="mt-6">
        <CategoryForm category={category} action={boundAction} />
      </div>
    </div>
  );
}
