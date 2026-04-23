export const dynamic = "force-dynamic"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { prisma } from "@/lib/prisma"
import { Plus } from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"
import { DuplicateButton } from "@/components/sales-quotes/duplicate-button"

const STATUS_COLORS: Record<string, string> = {
  DRAFT:    "#737373",
  SENT:     "#2563EB",
  ACCEPTED: "#16A34A",
  REJECTED: "#DC2626",
  EXPIRED:  "#F97316",
}

export default async function SalesQuotesPage() {
  const quotes = await prisma.salesQuote.findMany({
    include: { customer: true, _count: { select: { items: true, attachments: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <Header
        title="Sales Quotes"
        subtitle="Quotations sent to customers"
        actions={
          <Link href="/sales-quotes/new"
            className="flex items-center gap-2 h-9 px-4 bg-black text-white text-sm font-medium rounded-md hover:bg-[#171717] transition-colors">
            <Plus size={14} />
            New Sales Quote
          </Link>
        }
      />
      <div className="p-8">
        {quotes.length === 0 ? (
          <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-12 text-center">
            <p className="text-sm text-[#737373]">No sales quotes yet.{" "}
              <Link href="/sales-quotes/new" className="text-black underline">Create your first sales quote</Link>
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F5F5F5]">
                  {["Number", "Customer", "Date", "Status", "Items", "Total", "Files", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => {
                  const color = STATUS_COLORS[q.status] || "#737373"
                  return (
                    <tr key={q.id} className="border-b border-[#F5F5F5] last:border-0 hover:bg-[#FAFAFA] transition-colors cursor-pointer">
                      <td className="px-5 py-3 font-mono text-xs font-medium text-[#171717]">{q.quoteNumber}</td>
                      <td className="px-5 py-3 text-sm text-[#525252]">
                        <Link href={`/customers/${q.customerId}`} className="hover:underline">{q.customer.name}</Link>
                      </td>
                      <td className="px-5 py-3 text-sm text-[#737373]">{formatDate(q.date)}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2.5 py-1 rounded-full border" style={{ color, borderColor: color }}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-[#737373]">{q._count.items}</td>
                      <td className="px-5 py-3 text-sm font-medium text-[#171717]">
                        {q.totalAmount ? formatCurrency(q.totalAmount, q.currency) : "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-[#737373]">{q._count.attachments}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Link href={`/sales-quotes/${q.id}`} className="text-xs text-[#737373] hover:text-black transition-colors">Edit</Link>
                          <DuplicateButton quoteId={q.id} variant="row" />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
