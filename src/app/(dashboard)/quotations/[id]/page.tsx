import { notFound } from "next/navigation"
import { Header } from "@/components/layout/header"
import { QuotationForm } from "@/components/quotations/quotation-form"
import { prisma } from "@/lib/prisma"

export default async function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [quotation, suppliers, items] = await Promise.all([
    prisma.quotation.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { item: true } },
        attachments: true,
      },
    }),
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.item.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ])
  if (!quotation) notFound()
  return (
    <div>
      <Header title={quotation.quotationNumber} subtitle="Edit quotation" />
      <div className="p-6">
        <QuotationForm quotation={quotation} suppliers={suppliers} items={items} />
      </div>
    </div>
  )
}
