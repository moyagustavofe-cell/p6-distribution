export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound } from "next/navigation"
import { Header } from "@/components/layout/header"
import { SalesQuoteForm } from "@/components/sales-quotes/sales-quote-form"
import { prisma } from "@/lib/prisma"

export default async function SalesQuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [quote, customers, items] = await Promise.all([
    prisma.salesQuote.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { item: true } },
        attachments: true,
      },
    }),
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.item.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ])
  if (!quote) notFound()

  return (
    <div>
      <Header
        title={quote.quoteNumber}
        subtitle={
          <span>
            Sales quote for{" "}
            <Link href={`/customers/${quote.customerId}`} className="underline hover:text-black transition-colors">
              {quote.customer.name}
            </Link>
          </span>
        }
      />
      <div className="p-6">
        <SalesQuoteForm quote={quote} customers={customers} items={items} />
      </div>
    </div>
  )
}
