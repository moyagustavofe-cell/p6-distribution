import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { saveFile } from "@/lib/upload"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File
  const itemId = formData.get("itemId") as string | null
  const quotationId = formData.get("quotationId") as string | null
  const salesQuoteId = formData.get("salesQuoteId") as string | null
  const customerId = formData.get("customerId") as string | null

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  const saved = await saveFile(file)
  const attachment = await prisma.attachment.create({
    data: {
      ...saved,
      itemId: itemId || null,
      quotationId: quotationId || null,
      salesQuoteId: salesQuoteId || null,
      customerId: customerId || null,
    },
  })
  return NextResponse.json(attachment, { status: 201 })
}
