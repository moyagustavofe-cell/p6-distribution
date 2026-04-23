import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const quote = await prisma.salesQuote.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { item: true } },
      attachments: true,
    },
  })
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(quote)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { items, ...data } = await request.json()

  await prisma.salesQuoteItem.deleteMany({ where: { salesQuoteId: id } })

  const quote = await prisma.salesQuote.update({
    where: { id },
    data: {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
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
  return NextResponse.json(quote)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await request.json()
  const quote = await prisma.salesQuote.update({ where: { id }, data })
  return NextResponse.json(quote)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.salesQuote.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
