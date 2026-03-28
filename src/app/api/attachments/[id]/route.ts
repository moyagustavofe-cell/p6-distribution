import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { deleteFile } from "@/lib/upload"

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const attachment = await prisma.attachment.findUnique({ where: { id } })
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await deleteFile(attachment.filename)
  await prisma.attachment.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
