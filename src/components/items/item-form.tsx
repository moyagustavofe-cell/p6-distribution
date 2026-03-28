"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Item, Category, Attachment } from "@prisma/client"

type ItemWithRelations = Item & { category: Category | null; attachments: Attachment[] }

interface ItemFormProps {
  item?: ItemWithRelations
  categories: Category[]
}

export function ItemForm({ item, categories }: ItemFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>(item?.attachments || [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const formData = new FormData(form)

    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      partNumber: formData.get("partNumber") as string,
      categoryId: formData.get("categoryId") as string || null,
      unitOfMeasure: formData.get("unitOfMeasure") as string,
      manufacturer: formData.get("manufacturer") as string,
      manufacturerPartNo: formData.get("manufacturerPartNo") as string,
      hsCode: formData.get("hsCode") as string,
      isActive: formData.get("isActive") === "on",
    }

    const url = item ? `/api/items/${item.id}` : "/api/items"
    const method = item ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      const result = await res.json()
      router.push(`/items/${result.id}`)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!item || !e.target.files?.length) return
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append("file", file)
    formData.append("itemId", item.id)

    const res = await fetch("/api/attachments", { method: "POST", body: formData })
    if (res.ok) {
      const attachment = await res.json()
      setAttachments((prev) => [...prev, attachment])
    }
  }

  async function handleDeleteAttachment(attachmentId: string) {
    const res = await fetch(`/api/attachments/${attachmentId}`, { method: "DELETE" })
    if (res.ok) {
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-medium text-gray-900">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input name="name" defaultValue={item?.name} required
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" defaultValue={item?.description || ""} rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
              <input name="partNumber" defaultValue={item?.partNumber || ""}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="categoryId" defaultValue={item?.categoryId || ""}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-medium text-gray-900">Technical Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <input name="manufacturer" defaultValue={item?.manufacturer || ""}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer Part No.</label>
              <input name="manufacturerPartNo" defaultValue={item?.manufacturerPartNo || ""}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
              <input name="unitOfMeasure" defaultValue={item?.unitOfMeasure || "unit"}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HS Code</label>
              <input name="hsCode" defaultValue={item?.hsCode || ""}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" name="isActive" id="isActive" defaultChecked={item?.isActive ?? true}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active item</label>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? "Saving..." : item ? "Save Changes" : "Create Item"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="rounded-lg border px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>

      {/* Attachments Panel */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-medium text-gray-900 mb-4">Attachments</h2>
          {!item ? (
            <p className="text-sm text-gray-400">Save the item first to add attachments</p>
          ) : (
            <>
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-4 hover:border-blue-400 transition-colors">
                <input type="file" className="hidden" onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
                <span className="text-sm text-gray-500">Click to upload file</span>
              </label>
              <div className="mt-4 space-y-2">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <a href={att.url} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate max-w-[160px]">
                      {att.originalName}
                    </a>
                    <button onClick={() => handleDeleteAttachment(att.id)}
                      className="text-xs text-red-500 hover:text-red-700 ml-2 flex-shrink-0">
                      Delete
                    </button>
                  </div>
                ))}
                {attachments.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">No files attached</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
