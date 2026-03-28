"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Quotation, QuotationItem, Supplier, Item, Attachment } from "@prisma/client"
import { formatCurrency } from "@/lib/utils"
import { Plus, Trash2 } from "lucide-react"

type QuotationWithRelations = Quotation & {
  supplier: Supplier
  items: (QuotationItem & { item: Item | null })[]
  attachments: Attachment[]
}

interface LineItem {
  id?: string
  itemId?: string
  description: string
  partNumber: string
  quantity: number
  unitPrice: number
  unit: string
  leadTimeDays?: number
  notes?: string
}

interface QuotationFormProps {
  quotation?: QuotationWithRelations
  suppliers: Supplier[]
  items: Item[]
}

export function QuotationForm({ quotation, suppliers, items }: QuotationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currency, setCurrency] = useState(quotation?.currency || "USD")
  const [attachments, setAttachments] = useState<Attachment[]>(quotation?.attachments || [])
  const [lineItems, setLineItems] = useState<LineItem[]>(
    quotation?.items.map((i) => ({
      id: i.id,
      itemId: i.itemId || undefined,
      description: i.description,
      partNumber: i.partNumber || "",
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      unit: i.unit,
      leadTimeDays: i.leadTimeDays || undefined,
      notes: i.notes || undefined,
    })) || []
  )

  const totalAmount = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0)

  function addLineItem() {
    setLineItems([...lineItems, { description: "", partNumber: "", quantity: 1, unitPrice: 0, unit: "unit" }])
  }

  function removeLineItem(index: number) {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string | number) {
    setLineItems(lineItems.map((li, i) => {
      if (i !== index) return li
      if (field === "itemId" && value) {
        const item = items.find((it) => it.id === value)
        return {
          ...li,
          itemId: value as string,
          description: item?.name || li.description,
          partNumber: item?.partNumber || li.partNumber,
          unit: item?.unitOfMeasure || li.unit,
        }
      }
      return { ...li, [field]: value }
    }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    const data = {
      supplierId: formData.get("supplierId") as string,
      date: formData.get("date") as string,
      validUntil: formData.get("validUntil") as string || null,
      currency,
      status: formData.get("status") as string,
      paymentTerms: formData.get("paymentTerms") as string,
      deliveryTime: formData.get("deliveryTime") as string,
      incoterms: formData.get("incoterms") as string,
      notes: formData.get("notes") as string,
      totalAmount,
      items: lineItems,
    }

    const url = quotation ? `/api/quotations/${quotation.id}` : "/api/quotations"
    const method = quotation ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      const result = await res.json()
      router.push(`/quotations/${result.id}`)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!quotation || !e.target.files?.length) return
    const file = e.target.files[0]
    const fd = new FormData()
    fd.append("file", file)
    fd.append("quotationId", quotation.id)
    const res = await fetch("/api/attachments", { method: "POST", body: fd })
    if (res.ok) {
      const att = await res.json()
      setAttachments((prev) => [...prev, att])
    }
  }

  async function handleDeleteAttachment(id: string) {
    const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" })
    if (res.ok) setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Info */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-medium text-gray-900">Quotation Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
              <select name="supplierId" required defaultValue={quotation?.supplierId || ""}
                className={inputClass}>
                <option value="">Select supplier...</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" defaultValue={quotation?.status || "DRAFT"} className={inputClass}>
                {["DRAFT","SENT_RFQ","RECEIVED","UNDER_REVIEW","APPROVED","REJECTED","EXPIRED"].map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" name="date"
                defaultValue={quotation?.date ? new Date(quotation.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
              <input type="date" name="validUntil"
                defaultValue={quotation?.validUntil ? new Date(quotation.validUntil).toISOString().split("T")[0] : ""}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                {["USD","EUR","GBP","ARS"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Incoterms</label>
              <select name="incoterms" defaultValue={quotation?.incoterms || ""} className={inputClass}>
                <option value="">None</option>
                {["EXW","FOB","CIF","DAP","DDP","FCA","CPT","CIP"].map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
              <input name="paymentTerms" defaultValue={quotation?.paymentTerms || ""} className={inputClass}
                placeholder="e.g. 30% advance, 70% before shipment" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time</label>
              <input name="deliveryTime" defaultValue={quotation?.deliveryTime || ""} className={inputClass}
                placeholder="e.g. 8-10 weeks ARO" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" defaultValue={quotation?.notes || ""} rows={2} className={inputClass} />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-medium text-gray-900">Line Items</h2>
            <button type="button" onClick={addLineItem}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors">
              <Plus className="h-3.5 w-3.5" />
              Add Item
            </button>
          </div>

          {lineItems.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No items yet. Click &quot;Add Item&quot; to start.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600 w-48">Catalog Item</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Description</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600 w-32">Part No.</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600 w-20">Qty</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600 w-20">Unit</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600 w-28">Unit Price</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600 w-28">Total</th>
                    <th className="w-8 px-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lineItems.map((li, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <select value={li.itemId || ""} onChange={(e) => updateLineItem(index, "itemId", e.target.value)}
                          className="w-full rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option value="">Free text</option>
                          {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input value={li.description} onChange={(e) => updateLineItem(index, "description", e.target.value)}
                          className="w-full rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Description" required />
                      </td>
                      <td className="px-3 py-2">
                        <input value={li.partNumber} onChange={(e) => updateLineItem(index, "partNumber", e.target.value)}
                          className="w-full rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Part #" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={li.quantity} min={0.01} step={0.01}
                          onChange={(e) => updateLineItem(index, "quantity", parseFloat(e.target.value) || 0)}
                          className="w-full rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </td>
                      <td className="px-3 py-2">
                        <input value={li.unit} onChange={(e) => updateLineItem(index, "unit", e.target.value)}
                          className="w-full rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="unit" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={li.unitPrice} min={0} step={0.01}
                          onChange={(e) => updateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="w-full rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </td>
                      <td className="px-3 py-2 text-gray-700 font-medium whitespace-nowrap">
                        {formatCurrency(li.quantity * li.unitPrice, currency)}
                      </td>
                      <td className="px-2 py-2">
                        <button type="button" onClick={() => removeLineItem(index)}
                          className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan={6} className="px-3 py-3 text-right font-medium text-gray-700">Total:</td>
                    <td className="px-3 py-3 font-bold text-gray-900">{formatCurrency(totalAmount, currency)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? "Saving..." : quotation ? "Save Changes" : "Create Quotation"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="rounded-lg border px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>

      {/* Attachments */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-medium text-gray-900 mb-4">Attachments</h2>
        {!quotation ? (
          <p className="text-sm text-gray-400">Save the quotation first to add attachments</p>
        ) : (
          <>
            <label className="flex items-center gap-2 cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-4 hover:border-blue-400 transition-colors">
              <input type="file" className="hidden" onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
              <span className="text-sm text-gray-500">Click to upload quotation PDF or other files</span>
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <a href={att.url} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline">
                    {att.originalName}
                  </a>
                  <button onClick={() => handleDeleteAttachment(att.id)}
                    className="text-xs text-red-500 hover:text-red-700">×</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
