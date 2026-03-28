import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } })
  return NextResponse.json(suppliers)
}

export async function POST(request: Request) {
  const data = await request.json()
  const supplier = await prisma.supplier.create({ data })
  return NextResponse.json(supplier, { status: 201 })
}
