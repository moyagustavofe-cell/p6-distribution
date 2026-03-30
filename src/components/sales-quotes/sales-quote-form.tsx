"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { SalesQuote, SalesQuoteItem, Customer, Item, Attachment } from "@prisma/client"
import { formatCurrency } from "@/lib/utils"
import { generateQuotePdf } from "@/lib/generate-quote-pdf"
import { Plus, Trash2 } from "lucide-react"

type SalesQuoteWithRelations = SalesQuote & {
  customer: Customer
  items: (SalesQuoteItem & { item: Item | null })[]
  attachments: Attachment[]
}

interface LineItem {
  id?: string
  itemId?: string
  description: string
  partNumber: string
  quantity: number
  unitCost: number
  unitPrice: number
  unit: string
  notes?: string
}

interface SalesQuoteFormProps {
  quote?: SalesQuoteWithRelations
  customers: Customer[]
  items: Item[]
  defaultCustomerId?: string
}

const inp = "h-9 w-full px-3 border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:border-black focus:border-[1.5px] bg-white"
const lbl = "block text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium mb-1.5"
const cellInp = "w-full h-7 px-2 border border-[#E5E5E5] rounded text-xs focus:outline-none focus:border-black bg-white"

export function SalesQuoteForm({ quote, customers, items, defaultCustomerId }: SalesQuoteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currency, setCurrency] = useState(quote?.currency || "USD")
  const [attachments, setAttachments] = useState<Attachment[]>(quote?.attachments || [])
  const [discountPercent, setDiscountPercent] = useState<number>(quote?.discountPercent ?? 0)
  const [vatPercent, setVatPercent] = useState<number>(quote?.vatPercent ?? 0)
  const [lineItems, setLineItems] = useState<LineItem[]>(
    quote?.items.map((i) => ({
      id: i.id,
      itemId: i.itemId || undefined,
      description: i.description,
      partNumber: i.partNumber || "",
      quantity: i.quantity,
      unitCost: i.unitCost || 0,
      unitPrice: i.unitPrice,
      unit: i.unit,
      notes: i.notes || undefined,
    })) || []
  )

  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0)
  const discountAmount = subtotal * (discountPercent / 100)
  const netSubtotal = subtotal - discountAmount
  const vatAmount = netSubtotal * (vatPercent / 100)
  const totalAmount = netSubtotal + vatAmount

  function addLineItem() {
    setLineItems([...lineItems, { description: "", partNumber: "", quantity: 1, unitCost: 0, unitPrice: 0, unit: "unit" }])
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

  function getMargin(li: LineItem): string {
    if (!li.unitCost || !li.unitPrice || li.unitPrice === 0) return "—"
    const margin = ((li.unitPrice - li.unitCost) / li.unitPrice) * 100
    return `${margin.toFixed(1)}%`
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      customerId: formData.get("customerId") as string,
      date: formData.get("date") as string,
      validUntil: formData.get("validUntil") as string || null,
      currency,
      status: formData.get("status") as string,
      paymentTerms: formData.get("paymentTerms") as string || null,
      deliveryTime: formData.get("deliveryTime") as string || null,
      incoterms: formData.get("incoterms") as string || null,
      notes: formData.get("notes") as string || null,
      discountPercent: discountPercent || null,
      vatPercent: vatPercent || null,
      totalAmount,
      items: lineItems,
    }
    const url = quote ? `/api/sales-quotes/${quote.id}` : "/api/sales-quotes"
    const method = quote ? "PUT" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    if (res.ok) {
      const result = await res.json()
      router.push(`/sales-quotes/${result.id}`)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!quote || !confirm("Delete this sales quote?")) return
    const res = await fetch(`/api/sales-quotes/${quote.id}`, { method: "DELETE" })
    if (res.ok) {
      router.push("/sales-quotes")
      router.refresh()
    }
  }

  async function handleExportPdf() {
    if (!quote) return
    await generateQuotePdf({
      quoteNumber: quote.quoteNumber,
      date: quote.date,
      validUntil: quote.validUntil,
      currency: quote.currency,
      paymentTerms: quote.paymentTerms,
      deliveryTime: quote.deliveryTime,
      incoterms: quote.incoterms,
      notes: quote.notes,
      discountPercent: quote.discountPercent,
      vatPercent: quote.vatPercent,
      customer: quote.customer,
      items: quote.items.map((i) => ({
        description: i.description,
        partNumber: i.partNumber,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
        unit: i.unit,
      })),
    })
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!quote || !e.target.files?.length) return
    const file = e.target.files[0]
    const fd = new FormData()
    fd.append("file", file)
    fd.append("salesQuoteId", quote.id)
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

  return (
    <div className="space-y-6 max-w-6xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quote Details */}
        <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#737373]">Quote Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Customer *</label>
              <select name="customerId" required defaultValue={quote?.customerId || defaultCustomerId || ""} className={inp}>
                <option value="">Select customer...</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select name="status" defaultValue={quote?.status || "DRAFT"} className={inp}>
                {["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Date</label>
              <input type="date" name="date" className={inp}
                defaultValue={quote?.date ? new Date(quote.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} />
            </div>
            <div>
              <label className={lbl}>Valid Until</label>
              <input type="date" name="validUntil" className={inp}
                defaultValue={quote?.validUntil ? new Date(quote.validUntil).toISOString().split("T")[0] : ""} />
            </div>
            <div>
              <label className={lbl}>Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inp}>
                {["USD", "EUR", "GBP", "ARS"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Incoterms</label>
              <select name="incoterms" defaultValue={quote?.incoterms || ""} className={inp}>
                <option value="">None</option>
                {["EXW", "FOB", "CIF", "DAP", "DDP", "FCA", "CPT", "CIP"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Payment Terms</label>
              <input name="paymentTerms" defaultValue={quote?.paymentTerms || ""} className={inp}
                placeholder="e.g. 50% advance, 50% on delivery" />
            </div>
            <div>
              <label className={lbl}>Delivery Time</label>
              <input name="deliveryTime" defaultValue={quote?.deliveryTime || ""} className={inp}
                placeholder="e.g. 2–3 weeks" />
            </div>
          </div>
          <div>
            <label className={lbl}>Notes / Observations</label>
            <textarea name="notes" defaultValue={quote?.notes || ""} rows={2}
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
                    <th className="text-left px-3 py-2 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium w-40">Catalog Item</th>
                    <th className="text-left px-3 py-2 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium">Description</th>
                    <th className="text-left px-3 py-2 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium w-28">Part No.</th>
                    <th className="text-left px-3 py-2 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium w-16">Qty</th>
                    <th className="text-left px-3 py-2 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium w-14">Unit</th>
                    <th className="text-left px-3 py-2 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium w-24">Cost</th>
                    <th className="text-left px-3 py-2 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium w-24">Sale Price</th>
                    <th className="text-left px-3 py-2 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium w-16">Margin</th>
                    <th className="text-left px-3 py-2 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium w-24">Total</th>
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
                        <input type="number" value={li.unitCost} min={0} step={0.01}
                          onChange={(e) => updateLineItem(index, "unitCost", parseFloat(e.target.value) || 0)}
                          className={cellInp} placeholder="0.00" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={li.unitPrice} min={0} step={0.01}
                          onChange={(e) => updateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                          className={cellInp} />
                      </td>
                      <td className="px-3 py-2 text-xs font-medium text-[#737373] whitespace-nowrap">
                        {getMargin(li)}
                      </td>
                      <td className="px-3 py-2 text-xs font-medium text-[#171717] whitespace-nowrap">
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
              </table>
            </div>
          )}

          {/* Totals panel */}
          <div className="border-t border-[#E5E5E5] bg-[#FAFAFA] px-5 py-4">
            <div className="ml-auto max-w-xs space-y-2">
              <div className="flex justify-between text-sm text-[#525252]">
                <span>Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal, currency)}</span>
              </div>

              {/* Discount */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-[#525252]">
                  <span className="whitespace-nowrap">Discount (bonif.)</span>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={discountPercent}
                      min={0}
                      max={100}
                      step={0.1}
                      onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                      className="w-16 h-6 px-2 border border-[#E5E5E5] rounded text-xs focus:outline-none focus:border-black bg-white text-right"
                    />
                    <span className="ml-1 text-xs text-[#737373]">%</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-[#525252]">
                  {discountPercent > 0 ? `− ${formatCurrency(discountAmount, currency)}` : "—"}
                </span>
              </div>

              {discountPercent > 0 && (
                <div className="flex justify-between text-sm text-[#525252]">
                  <span>Net Subtotal</span>
                  <span className="font-medium">{formatCurrency(netSubtotal, currency)}</span>
                </div>
              )}

              {/* IVA */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-[#525252]">
                  <span>IVA</span>
                  <select
                    value={vatPercent}
                    onChange={(e) => setVatPercent(parseFloat(e.target.value))}
                    className="h-6 px-2 border border-[#E5E5E5] rounded text-xs focus:outline-none focus:border-black bg-white"
                  >
                    <option value={0}>None</option>
                    <option value={10.5}>10.5%</option>
                    <option value={21}>21%</option>
                  </select>
                </div>
                <span className="text-sm font-medium text-[#525252]">
                  {vatPercent > 0 ? formatCurrency(vatAmount, currency) : "—"}
                </span>
              </div>

              <div className="flex justify-between border-t border-[#E5E5E5] pt-2">
                <span className="text-sm font-semibold text-[#171717]">Total</span>
                <span className="text-sm font-extrabold text-[#171717]">{formatCurrency(totalAmount, currency)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="h-9 px-5 bg-black text-white text-sm font-medium rounded-md hover:bg-[#171717] disabled:opacity-50 transition-colors">
            {loading ? "Saving..." : quote ? "Save Changes" : "Create Sales Quote"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="h-9 px-5 border border-[#E5E5E5] text-sm font-medium text-[#525252] rounded-md hover:bg-[#FAFAFA] transition-colors">
            Cancel
          </button>
          {quote && (
            <>
              <button type="button" onClick={handleExportPdf}
                className="h-9 px-5 border border-[#E5E5E5] text-sm font-medium text-[#525252] rounded-md hover:bg-[#FAFAFA] transition-colors">
                Export PDF
              </button>
              <button type="button" onClick={handleDelete}
                className="ml-auto h-9 px-5 border border-[#FCA5A5] text-sm font-medium text-[#DC2626] rounded-md hover:bg-[#FEF2F2] transition-colors">
                Delete
              </button>
            </>
          )}
        </div>
      </form>

      {/* Attachments */}
      <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="px-5 py-4 border-b border-[#F5F5F5]">
          <h2 className="text-sm font-semibold text-[#171717]">Attachments</h2>
        </div>
        <div className="p-5">
          {!quote ? (
            <p className="text-sm text-[#A3A3A3]">Save the quote first to add attachments.</p>
          ) : (
            <>
              <label className="flex items-center justify-center cursor-pointer rounded-lg border-2 border-dashed border-[#E5E5E5] p-4 hover:border-[#A3A3A3] transition-colors">
                <input type="file" className="hidden" onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
                <span className="text-sm text-[#737373]">Click to upload quote PDF or other files</span>
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-2 rounded-lg bg-[#F5F5F5] px-3 py-2">
                    <a href={`/api/attachments/${att.id}`} download={att.originalName} target="_blank" rel="noopener noreferrer"
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
