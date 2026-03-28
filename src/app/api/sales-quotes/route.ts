import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateSalesQuoteNumber } from "@/lib/utils"

export async function GET() {
  const quotes = await prisma.salesQuote.findMany({
    include: { customer: true, _count: { select: { items: true, attachments: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(quotes)
}

export async function POST(request: Request) {
  const { items, ...data } = await request.json()

  const quote = await prisma.salesQuote.create({
    data: {
      ...data,
      quoteNumber: generateSalesQuoteNumber(),
      date: data.date ? new Date(data.date) : new Date(),
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      items: {
        create: items.map((item: {
          itemId?: string; description: string; partNumber?: string
          quantity: number; unitCost?: number; unitPrice: number; unit: string; notes?: string
        }) => ({
          itemId: item.itemId || null,
          description: item.description,
          partNumber: item.partNumber || null,
          quantity: item.quantity,
          unitCost: item.unitCost || null,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          unit: item.unit,
          notes: item.notes || null,
        })),
      },
    },
  })
  return NextResponse.json(quote, { status: 201 })
}
