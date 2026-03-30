import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const attachment = await prisma.attachment.findUnique({
    where: { id },
    select: { data: true, mimeType: true, originalName: true },
  })
  if (!attachment || !attachment.data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return new Response(attachment.data, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(attachment.originalName)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const attachment = await prisma.attachment.findUnique({ where: { id } })
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.attachment.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
