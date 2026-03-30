import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File
  const itemId = formData.get("itemId") as string | null
  const quotationId = formData.get("quotationId") as string | null
  const salesQuoteId = formData.get("salesQuoteId") as string | null
  const customerId = formData.get("customerId") as string | null

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())

  const attachment = await prisma.attachment.create({
    data: {
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      data: buffer,
      itemId: itemId || null,
      quotationId: quotationId || null,
      salesQuoteId: salesQuoteId || null,
      customerId: customerId || null,
    },
  })

  // Return metadata only (no binary data in response)
  return NextResponse.json(
    {
      id: attachment.id,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      createdAt: attachment.createdAt,
    },
    { status: 201 },
  )
}
