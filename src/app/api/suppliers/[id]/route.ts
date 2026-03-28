import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await request.json()
  const supplier = await prisma.supplier.update({ where: { id }, data })
  return NextResponse.json(supplier)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.supplier.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
