export const dynamic = "force-dynamic"

import { Header } from "@/components/layout/header"
import { SalesQuoteForm } from "@/components/sales-quotes/sales-quote-form"
import { prisma } from "@/lib/prisma"

export default async function NewSalesQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>
}) {
  const { customerId } = await searchParams
  const [customers, items] = await Promise.all([
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.item.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ])
  return (
    <div>
      <Header title="New Sales Quote" subtitle="Create a quotation for a customer" />
      <div className="p-6">
        <SalesQuoteForm customers={customers} items={items} defaultCustomerId={customerId} />
      </div>
    </div>
  )
}
