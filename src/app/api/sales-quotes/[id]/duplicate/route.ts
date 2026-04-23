import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateSalesQuoteNumber } from "@/lib/utils"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const original = await prisma.salesQuote.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!original) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const duplicate = await prisma.salesQuote.create({
    data: {
      quoteNumber:  generateSalesQuoteNumber(),
      customerId:   original.customerId,
      status:       "DRAFT",
      date:         new Date(),
      validUntil:   null,
      currency:     original.currency,
      incoterms:    original.incoterms,
      paymentTerms: original.paymentTerms,
      deliveryTime: original.deliveryTime,
      notes:        original.notes,
      discountPercent: original.discountPercent,
      vatPercent:   original.vatPercent,
      totalAmount:  original.totalAmount,
      items: {
        create: original.items.map((item) => ({
          itemId:      item.itemId,
          description: item.description,
          partNumber:  item.partNumber,
          quantity:    item.quantity,
          unitCost:    item.unitCost,
          unitPrice:   item.unitPrice,
          totalPrice:  item.totalPrice,
          unit:        item.unit,
          notes:       item.notes,
        })),
      },
    },
  })

  return NextResponse.json(duplicate, { status: 201 })
}
