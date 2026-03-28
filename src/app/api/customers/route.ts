import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const customers = await prisma.customer.findMany({
    include: { _count: { select: { salesQuotes: true } } },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(customers)
}

export async function POST(request: Request) {
  const data = await request.json()
  const customer = await prisma.customer.create({ data })
  return NextResponse.json(customer, { status: 201 })
}
