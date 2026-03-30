import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { supplier: true, items: { include: { item: true } }, attachments: true },
  })
  if (!quotation) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(quotation)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { items, ...data } = await request.json()

  // Delete existing items and recreate
  await prisma.quotationItem.deleteMany({ where: { quotationId: id } })

  const quotation = await prisma.quotation.update({
    where: { id },
    data: {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      items: {
        create: items.map((item: { itemId?: string; description: string; partNumber?: string; quantity: number; unitPrice: number; unit: string; weightKg?: number; leadTimeDays?: number; notes?: string }) => ({
          itemId: item.itemId || null,
          description: item.description,
          partNumber: item.partNumber || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          unit: item.unit,
          weightKg: item.weightKg || null,
          leadTimeDays: item.leadTimeDays || null,
          notes: item.notes || null,
        })),
      },
    },
  })
  return NextResponse.json(quotation)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.quotation.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
