"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Supplier } from "@prisma/client"

interface SupplierFormProps {
  supplier?: Supplier
}

const input = "h-9 w-full px-3 border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:border-black focus:border-[1.5px] bg-white"
const label = "block text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium mb-1.5"

export function SupplierForm({ supplier }: SupplierFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!supplier || !confirm(`Delete "${supplier.name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/suppliers/${supplier.id}`, { method: "DELETE" })
    if (res.ok) {
      router.push("/suppliers")
      router.refresh()
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      country: formData.get("country") as string,
      contactName: formData.get("contactName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      website: formData.get("website") as string,
      notes: formData.get("notes") as string,
      isActive: formData.get("isActive") === "on",
    }
    const url = supplier ? `/api/suppliers/${supplier.id}` : "/api/suppliers"
    const method = supplier ? "PUT" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    if (res.ok) {
      const result = await res.json()
      router.push(`/suppliers/${result.id}`)
      router.refresh()
    }
    setLoading(false)
  }

  const field = (labelText: string, name: string, props?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label className={label}>{labelText}</label>
      <input name={name} defaultValue={(supplier as Record<string, unknown>)?.[name] as string || ""}
        className={input} {...props} />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#737373]">Supplier Information</h2>

        {field("Name *", "name", { required: true })}
        {field("Country", "country")}
        {field("Contact Name", "contactName")}
        {field("Email", "email", { type: "email" })}
        {field("Phone", "phone", { type: "tel" })}
        {field("Website", "website", { type: "url" })}

        <div>
          <label className={label}>Notes</label>
          <textarea name="notes" defaultValue={supplier?.notes || ""} rows={3}
            className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:border-black focus:border-[1.5px] bg-white resize-none" />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="isActive" id="isActive" defaultChecked={supplier?.isActive ?? true}
            className="rounded border-[#E5E5E5]" />
          <label htmlFor="isActive" className="text-sm text-[#525252]">Active supplier</label>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="h-9 px-5 bg-black text-white text-sm font-medium rounded-md hover:bg-[#171717] disabled:opacity-50 transition-colors">
          {loading ? "Saving..." : supplier ? "Save Changes" : "Create Supplier"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="h-9 px-5 border border-[#E5E5E5] text-sm font-medium text-[#525252] rounded-md hover:bg-[#FAFAFA] transition-colors">
          Cancel
        </button>
        {supplier && (
          <button type="button" onClick={handleDelete}
            className="h-9 px-5 ml-auto border border-[#FCA5A5] text-sm font-medium text-[#DC2626] rounded-md hover:bg-[#FEF2F2] transition-colors">
            Delete Supplier
          </button>
        )}
      </div>
    </form>
  )
}
