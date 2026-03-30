export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PrintPage } from "@/components/sales-quotes/print-page"

export default async function SalesQuotePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const quote = await prisma.salesQuote.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { item: true } },
    },
  })
  if (!quote) notFound()

  return <PrintPage quote={quote} />
}
