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

const inp = "h-9 w-full px-3 border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:border-black focus:border-[1.5px] bg-white"
const lbl = "block text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium mb-1.5"
const cellInp = "w-full h-7 px-2 border border-[#E5E5E5] rounded text-xs focus:outline-none focus:border-black bg-white"

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
        return { ...li, itemId: value as string, description: item?.name || li.description, partNumber: item?.partNumber || li.partNumber, unit: item?.unitOfMeasure || li.unit }
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
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
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

  async function handleDelete() {
    if (!quotation || !confirm(`Delete quotation ${quotation.quotationNumber}? This cannot be undone.`)) return
    const res = await fetch(`/api/quotations/${quotation.id}`, { method: "DELETE" })
    if (res.ok) {
      router.push("/quotations")
      router.refresh()
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quotation Details */}
        <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#737373]">Quotation Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Supplier *</label>
              <select name="supplierId" required defaultValue={quotation?.supplierId || ""} className={inp}>
                <option value="">Select supplier...</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select name="status" defaultValue={quotation?.status || "DRAFT"} className={inp}>
                {["DRAFT","SENT_RFQ","RECEIVED","UNDER_REVIEW","APPROVED","REJECTED","EXPIRED"].map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Date</label>
              <input type="date" name="date" className={inp}
                defaultValue={quotation?.date ? new Date(quotation.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} />
            </div>
            <div>
              <label className={lbl}>Valid Until</label>
              <input type="date" name="validUntil" className={inp}
                defaultValue={quotation?.validUntil ? new Date(quotation.validUntil).toISOString().split("T")[0] : ""} />
            </div>
            <div>
              <label className={lbl}>Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inp}>
                {["USD","EUR","GBP","ARS"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Incoterms</label>
              <select name="incoterms" defaultValue={quotation?.incoterms || ""} className={inp}>
                <option value="">None</option>
                {["EXW","FOB","CIF","DAP","DDP","FCA","CPT","CIP"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Payment Terms</label>
              <input name="paymentTerms" defaultValue={quotation?.paymentTerms || ""} className={inp}
                placeholder="e.g. 30% advance, 70% before shipment" />
            </div>
            <div>
              <label className={lbl}>Delivery Time</label>
              <input name="deliveryTime" defaultValue={quotation?.deliveryTime || ""} className={inp}
                placeholder="e.g. 8-10 weeks ARO" />
            </div>
          </div>
          <div>
            <label className={lbl}>Notes</label>
            <textarea name="notes" defaultValue={quotation?.notes || ""} rows={2}
              className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:border-black focus:border-[1.5px] bg-white resize-none" />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F5F5]">
            <h2 className="text-sm font-semibold text-[#171717]">Line Items</h2>
            <button type="button" onClick={addLineItem}
              className="flex items-center gap-1.5 h-7 px-3 border border-[#E5E5E5] text-xs font-medium text-[#525252] rounded-md hover:bg-[#FAFAFA] transition-colors">
              <Plus size={12} />
              Add Item
            </button>
          </div>

          {lineItems.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-[#737373]">No items yet. Click &quot;Add Item&quot; to start.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F5F5F5]">
                    <th className="text-left px-3 py-2 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium w-44">Catalog Item</th>
                    <th className="text-left px-3 py-2 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium">Description</th>
                    <th className="text-left px-3 py-2 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium w-28">Part No.</th>
                    <th className="text-left px-3 py-2 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium w-20">Qty</th>
                    <th className="text-left px-3 py-2 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium w-16">Unit</th>
                    <th className="text-left px-3 py-2 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium w-28">Unit Price</th>
                    <th className="text-left px-3 py-2 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium w-28">Total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li, index) => (
                    <tr key={index} className="border-b border-[#F5F5F5] last:border-0">
                      <td className="px-3 py-2">
                        <select value={li.itemId || ""} onChange={(e) => updateLineItem(index, "itemId", e.target.value)} className={cellInp}>
                          <option value="">Free text</option>
                          {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input value={li.description} onChange={(e) => updateLineItem(index, "description", e.target.value)}
                          className={cellInp} placeholder="Description" required />
                      </td>
                      <td className="px-3 py-2">
                        <input value={li.partNumber} onChange={(e) => updateLineItem(index, "partNumber", e.target.value)}
                          className={cellInp} placeholder="Part #" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={li.quantity} min={0.01} step={0.01}
                          onChange={(e) => updateLineItem(index, "quantity", parseFloat(e.target.value) || 0)}
                          className={cellInp} />
                      </td>
                      <td className="px-3 py-2">
                        <input value={li.unit} onChange={(e) => updateLineItem(index, "unit", e.target.value)}
                          className={cellInp} placeholder="unit" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={li.unitPrice} min={0} step={0.01}
                          onChange={(e) => updateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                          className={cellInp} />
                      </td>
                      <td className="px-3 py-2 text-sm font-medium text-[#171717] whitespace-nowrap">
                        {formatCurrency(li.quantity * li.unitPrice, currency)}
                      </td>
                      <td className="px-2 py-2">
                        <button type="button" onClick={() => removeLineItem(index)}
                          className="text-[#D4D4D4] hover:text-[#DC2626] transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#E5E5E5] bg-[#FAFAFA]">
                    <td colSpan={6} className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.05em] text-[#737373]">Total</td>
                    <td className="px-3 py-3 text-sm font-extrabold text-[#171717]">{formatCurrency(totalAmount, currency)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="h-9 px-5 bg-black text-white text-sm font-medium rounded-md hover:bg-[#171717] disabled:opacity-50 transition-colors">
            {loading ? "Saving..." : quotation ? "Save Changes" : "Create Quotation"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="h-9 px-5 border border-[#E5E5E5] text-sm font-medium text-[#525252] rounded-md hover:bg-[#FAFAFA] transition-colors">
            Cancel
          </button>
          {quotation && (
            <button type="button" onClick={handleDelete}
              className="h-9 px-5 ml-auto border border-[#FCA5A5] text-sm font-medium text-[#DC2626] rounded-md hover:bg-[#FEF2F2] transition-colors">
              Delete Quotation
            </button>
          )}
        </div>
      </form>

      {/* Attachments */}
      <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="px-5 py-4 border-b border-[#F5F5F5]">
          <h2 className="text-sm font-semibold text-[#171717]">Attachments</h2>
        </div>
        <div className="p-5">
          {!quotation ? (
            <p className="text-sm text-[#A3A3A3]">Save the quotation first to add attachments.</p>
          ) : (
            <>
              <label className="flex items-center justify-center cursor-pointer rounded-lg border-2 border-dashed border-[#E5E5E5] p-4 hover:border-[#A3A3A3] transition-colors">
                <input type="file" className="hidden" onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
                <span className="text-sm text-[#737373]">Click to upload quotation PDF or other files</span>
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-2 rounded-lg bg-[#F5F5F5] px-3 py-2">
                    <a href={att.url} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-[#171717] hover:underline">
                      {att.originalName}
                    </a>
                    <button onClick={() => handleDeleteAttachment(att.id)}
                      className="text-xs text-[#DC2626] hover:text-red-700 transition-colors">×</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
