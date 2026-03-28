import { notFound } from "next/navigation"
import { Header } from "@/components/layout/header"
import { SupplierForm } from "@/components/suppliers/supplier-form"
import { prisma } from "@/lib/prisma"

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supplier = await prisma.supplier.findUnique({ where: { id } })
  if (!supplier) notFound()
  return (
    <div>
      <Header title={supplier.name} subtitle="Edit supplier details" />
      <div className="p-6">
        <SupplierForm supplier={supplier} />
      </div>
    </div>
  )
}
