"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Item, Category, Attachment } from "@prisma/client"

type ItemWithRelations = Item & { category: Category | null; attachments: Attachment[] }

interface ItemFormProps {
  item?: ItemWithRelations
  categories: Category[]
}

const input = "h-9 w-full px-3 border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:border-black focus:border-[1.5px] bg-white"
const label = "block text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium mb-1.5"

export function ItemForm({ item, categories }: ItemFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>(item?.attachments || [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
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
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
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
    const fd = new FormData()
    fd.append("file", file)
    fd.append("itemId", item.id)
    const res = await fetch("/api/attachments", { method: "POST", body: fd })
    if (res.ok) {
      const attachment = await res.json()
      setAttachments((prev) => [...prev, attachment])
    }
  }

  async function handleDeleteAttachment(id: string) {
    const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" })
    if (res.ok) setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  async function handleDeleteItem() {
    if (!item) return
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" })
    if (res.ok) {
      router.push("/items")
      router.refresh()
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
        {/* Basic Information */}
        <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#737373]">Basic Information</h2>

          <div>
            <label className={label}>Name *</label>
            <input name="name" defaultValue={item?.name} required className={input} />
          </div>

          <div>
            <label className={label}>Description</label>
            <textarea name="description" defaultValue={item?.description || ""} rows={3}
              className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:border-black focus:border-[1.5px] bg-white resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Part Number</label>
              <input name="partNumber" defaultValue={item?.partNumber || ""} className={input} />
            </div>
            <div>
              <label className={label}>Category</label>
              <select name="categoryId" defaultValue={item?.categoryId || ""} className={input}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#737373]">Technical Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Manufacturer</label>
              <input name="manufacturer" defaultValue={item?.manufacturer || ""} className={input} />
            </div>
            <div>
              <label className={label}>Manufacturer Part No.</label>
              <input name="manufacturerPartNo" defaultValue={item?.manufacturerPartNo || ""} className={input} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Unit of Measure</label>
              <input name="unitOfMeasure" defaultValue={item?.unitOfMeasure || "unit"} className={input} />
            </div>
            <div>
              <label className={label}>HS Code</label>
              <input name="hsCode" defaultValue={item?.hsCode || ""} className={input} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" name="isActive" id="isActive" defaultChecked={item?.isActive ?? true}
              className="rounded border-[#E5E5E5]" />
            <label htmlFor="isActive" className="text-sm text-[#525252]">Active item</label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="h-9 px-5 bg-black text-white text-sm font-medium rounded-md hover:bg-[#171717] disabled:opacity-50 transition-colors">
            {loading ? "Saving..." : item ? "Save Changes" : "Create Item"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="h-9 px-5 border border-[#E5E5E5] text-sm font-medium text-[#525252] rounded-md hover:bg-[#FAFAFA] transition-colors">
            Cancel
          </button>
          {item && (
            <button type="button" onClick={handleDeleteItem}
              className="h-9 px-5 ml-auto border border-[#FCA5A5] text-sm font-medium text-[#DC2626] rounded-md hover:bg-[#FEF2F2] transition-colors">
              Delete Item
            </button>
          )}
        </div>
      </form>

      {/* Attachments */}
      <div>
        <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="px-5 py-4 border-b border-[#F5F5F5]">
            <h2 className="text-sm font-semibold text-[#171717]">Attachments</h2>
          </div>
          <div className="p-5">
            {!item ? (
              <p className="text-sm text-[#A3A3A3]">Save the item first to add attachments.</p>
            ) : (
              <>
                <label className="flex items-center justify-center cursor-pointer rounded-lg border-2 border-dashed border-[#E5E5E5] p-4 hover:border-[#A3A3A3] transition-colors">
                  <input type="file" className="hidden" onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
                  <span className="text-sm text-[#737373]">Click to upload file</span>
                </label>
                <div className="mt-4 space-y-2">
                  {attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between rounded-lg bg-[#F5F5F5] px-3 py-2">
                      <a href={att.url} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-[#171717] hover:underline truncate max-w-[160px]">
                        {att.originalName}
                      </a>
                      <button onClick={() => handleDeleteAttachment(att.id)}
                        className="text-xs text-[#DC2626] hover:text-red-700 ml-2 flex-shrink-0 transition-colors">
                        Delete
                      </button>
                    </div>
                  ))}
                  {attachments.length === 0 && (
                    <p className="text-xs text-[#A3A3A3] text-center py-2">No files attached</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
