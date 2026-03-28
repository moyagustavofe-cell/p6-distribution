"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Customer } from "@prisma/client"

interface CustomerFormProps {
  customer?: Customer
}

const inp = "h-9 w-full px-3 border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:border-black focus:border-[1.5px] bg-white"
const lbl = "block text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium mb-1.5"

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      company: formData.get("company") as string || null,
      taxId: formData.get("taxId") as string || null,
      email: formData.get("email") as string || null,
      phone: formData.get("phone") as string || null,
      address: formData.get("address") as string || null,
      country: formData.get("country") as string || null,
      notes: formData.get("notes") as string || null,
      isActive: formData.get("isActive") === "true",
    }
    const url = customer ? `/api/customers/${customer.id}` : "/api/customers"
    const method = customer ? "PUT" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    if (res.ok) {
      const result = await res.json()
      router.push(`/customers/${result.id}`)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!customer || !confirm("Delete this customer?")) return
    const res = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" })
    if (res.ok) {
      router.push("/customers")
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#737373]">Customer Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Name *</label>
            <input name="name" required defaultValue={customer?.name || ""} className={inp} placeholder="Full name" />
          </div>
          <div>
            <label className={lbl}>Company</label>
            <input name="company" defaultValue={customer?.company || ""} className={inp} placeholder="Company name" />
          </div>
          <div>
            <label className={lbl}>Tax ID / CUIT</label>
            <input name="taxId" defaultValue={customer?.taxId || ""} className={inp} placeholder="e.g. 30-12345678-9" />
          </div>
          <div>
            <label className={lbl}>Country</label>
            <input name="country" defaultValue={customer?.country || ""} className={inp} placeholder="Argentina" />
          </div>
          <div>
            <label className={lbl}>Email</label>
            <input type="email" name="email" defaultValue={customer?.email || ""} className={inp} placeholder="contact@company.com" />
          </div>
          <div>
            <label className={lbl}>Phone</label>
            <input name="phone" defaultValue={customer?.phone || ""} className={inp} placeholder="+54 11 1234-5678" />
          </div>
          <div className="col-span-2">
            <label className={lbl}>Address</label>
            <input name="address" defaultValue={customer?.address || ""} className={inp} placeholder="Street, city, province" />
          </div>
          <div className="col-span-2">
            <label className={lbl}>Notes</label>
            <textarea name="notes" defaultValue={customer?.notes || ""} rows={3}
              className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:border-black focus:border-[1.5px] bg-white resize-none" />
          </div>
          <div>
            <label className={lbl}>Status</label>
            <select name="isActive" defaultValue={customer?.isActive !== false ? "true" : "false"} className={inp}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="h-9 px-5 bg-black text-white text-sm font-medium rounded-md hover:bg-[#171717] disabled:opacity-50 transition-colors">
          {loading ? "Saving..." : customer ? "Save Changes" : "Create Customer"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="h-9 px-5 border border-[#E5E5E5] text-sm font-medium text-[#525252] rounded-md hover:bg-[#FAFAFA] transition-colors">
          Cancel
        </button>
        {customer && (
          <button type="button" onClick={handleDelete}
            className="ml-auto h-9 px-5 border border-[#FCA5A5] text-sm font-medium text-[#DC2626] rounded-md hover:bg-[#FEF2F2] transition-colors">
            Delete
          </button>
        )}
      </div>
    </form>
  )
}
