"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Supplier } from "@prisma/client"

interface SupplierFormProps {
  supplier?: Supplier
}

export function SupplierForm({ supplier }: SupplierFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

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

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      const result = await res.json()
      router.push(`/suppliers/${result.id}`)
      router.refresh()
    }
    setLoading(false)
  }

  const field = (label: string, name: string, props?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input name={name} defaultValue={(supplier as Record<string, unknown>)?.[name] as string || ""}
        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...props} />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-medium text-gray-900">Supplier Information</h2>
        {field("Name *", "name", { required: true })}
        {field("Country", "country")}
        {field("Contact Name", "contactName")}
        {field("Email", "email", { type: "email" })}
        {field("Phone", "phone", { type: "tel" })}
        {field("Website", "website", { type: "url" })}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea name="notes" defaultValue={supplier?.notes || ""} rows={3}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="isActive" id="isActive" defaultChecked={supplier?.isActive ?? true}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <label htmlFor="isActive" className="text-sm text-gray-700">Active supplier</label>
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? "Saving..." : supplier ? "Save Changes" : "Create Supplier"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="rounded-lg border px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
