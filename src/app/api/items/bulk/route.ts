import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface BulkItemRow {
  name: string
  partNumber?: string
  categoryName?: string
  unitOfMeasure?: string
  manufacturer?: string
  manufacturerPartNo?: string
  hsCode?: string
  description?: string
  isActive?: boolean
}

export async function POST(request: Request) {
  const rows: BulkItemRow[] = await request.json()

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 })
  }

  if (rows.length > 500) {
    return NextResponse.json({ error: "Maximum 500 items per import" }, { status: 400 })
  }

  // Resolve category names → IDs in one query
  const categoryNames = [...new Set(rows.map((r) => r.categoryName).filter(Boolean))] as string[]
  const categories = await prisma.category.findMany({
    where: { name: { in: categoryNames } },
    select: { id: true, name: true },
  })
  const categoryMap = new Map(categories.map((c) => [c.name, c.id]))

  // Find existing partNumbers to skip duplicates
  const partNumbers = rows.map((r) => r.partNumber).filter(Boolean) as string[]
  const existing = await prisma.item.findMany({
    where: { partNumber: { in: partNumbers } },
    select: { partNumber: true },
  })
  const existingSet = new Set(existing.map((e) => e.partNumber))

  const toCreate = rows
    .filter((r) => r.name?.trim())
    .filter((r) => !r.partNumber || !existingSet.has(r.partNumber))
    .map((r) => ({
      name: r.name.trim(),
      partNumber: r.partNumber?.trim() || null,
      categoryId: r.categoryName ? (categoryMap.get(r.categoryName) ?? null) : null,
      unitOfMeasure: r.unitOfMeasure?.trim() || "unit",
      manufacturer: r.manufacturer?.trim() || null,
      manufacturerPartNo: r.manufacturerPartNo?.trim() || null,
      hsCode: r.hsCode?.trim() || null,
      description: r.description?.trim() || null,
      isActive: r.isActive !== false,
    }))

  const skipped = rows.length - toCreate.length

  await prisma.item.createMany({ data: toCreate })

  return NextResponse.json({
    created: toCreate.length,
    skipped,
  })
}
