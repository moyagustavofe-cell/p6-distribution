import { Header } from "@/components/layout/header"
import { SupplierForm } from "@/components/suppliers/supplier-form"

export default function NewSupplierPage() {
  return (
    <div>
      <Header title="New Supplier" subtitle="Add a new supplier" />
      <div className="p-6">
        <SupplierForm />
      </div>
    </div>
  )
}
