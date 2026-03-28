export const dynamic = "force-dynamic"

import { Header } from "@/components/layout/header"
import { QuotationForm } from "@/components/quotations/quotation-form"
import { prisma } from "@/lib/prisma"

export default async function NewQuotationPage() {
  const [suppliers, items] = await Promise.all([
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.item.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ])
  return (
    <div>
      <Header title="New Quotation" subtitle="Create a new quotation" />
      <div className="p-6">
        <QuotationForm suppliers={suppliers} items={items} />
      </div>
    </div>
  )
}
