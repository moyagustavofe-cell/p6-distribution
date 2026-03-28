import { Header } from "@/components/layout/header"
import { ItemForm } from "@/components/items/item-form"
import { prisma } from "@/lib/prisma"

export default async function NewItemPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } })
  return (
    <div>
      <Header title="New Item" subtitle="Add a new product to the catalog" />
      <div className="p-6">
        <ItemForm categories={categories} />
      </div>
    </div>
  )
}
