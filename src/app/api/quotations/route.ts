import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateQuotationNumber } from "@/lib/utils"

export async function GET() {
  const quotations = await prisma.quotation.findMany({
    include: { supplier: true, items: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(quotations)
}

export async function POST(request: Request) {
  const { items, ...data } = await request.json()

  const quotation = await prisma.quotation.create({
    data: {
      ...data,
      quotationNumber: generateQuotationNumber(),
      date: data.date ? new Date(data.date) : new Date(),
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      items: {
        create: items.map((item: { itemId?: string; description: string; partNumber?: string; quantity: number; unitPrice: number; unit: string; leadTimeDays?: number; notes?: string }) => ({
          itemId: item.itemId || null,
          description: item.description,
          partNumber: item.partNumber || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          unit: item.unit,
          leadTimeDays: item.leadTimeDays || null,
          notes: item.notes || null,
        })),
      },
    },
  })
  return NextResponse.json(quotation, { status: 201 })
}
