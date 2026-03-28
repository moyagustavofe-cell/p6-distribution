export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { Header } from "@/components/layout/header"
import { ItemForm } from "@/components/items/item-form"
import { prisma } from "@/lib/prisma"

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [item, categories] = await Promise.all([
    prisma.item.findUnique({
      where: { id },
      include: { category: true, attachments: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ])

  if (!item) notFound()

  return (
    <div>
      <Header title={item.name} subtitle="Edit item details" />
      <div className="p-6">
        <ItemForm item={item} categories={categories} />
      </div>
    </div>
  )
}
