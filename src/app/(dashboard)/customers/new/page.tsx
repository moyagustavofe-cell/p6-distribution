export const dynamic = "force-dynamic"

import { Header } from "@/components/layout/header"
import { CustomerForm } from "@/components/customers/customer-form"

export default function NewCustomerPage() {
  return (
    <div>
      <Header title="New Customer" subtitle="Add a new customer" />
      <div className="p-6">
        <CustomerForm />
      </div>
    </div>
  )
}
