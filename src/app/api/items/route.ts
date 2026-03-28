import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const items = await prisma.item.findMany({
    include: { category: true, attachments: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(items)
}

export async function POST(request: Request) {
  const data = await request.json()
  const item = await prisma.item.create({ data })
  return NextResponse.json(item, { status: 201 })
}
