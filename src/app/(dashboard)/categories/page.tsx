export const dynamic = "force-dynamic"

import { Header } from "@/components/layout/header"
import { prisma } from "@/lib/prisma"
import { CategoriesClient } from "@/components/categories/categories-client"

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { items: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <div>
      <Header
        title="Categories"
        subtitle="Item categories for the product catalog"
      />
      <div className="p-8">
        <CategoriesClient categories={categories} />
      </div>
    </div>
  )
}
