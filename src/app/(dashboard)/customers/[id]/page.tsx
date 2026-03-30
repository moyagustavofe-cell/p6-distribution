export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound } from "next/navigation"
import { Header } from "@/components/layout/header"
import { CustomerForm } from "@/components/customers/customer-form"
import { CustomerAttachments } from "@/components/customers/customer-attachments"
import { prisma } from "@/lib/prisma"
import { formatDate, formatCurrency } from "@/lib/utils"

const STATUS_COLORS: Record<string, string> = {
  DRAFT:    "#737373",
  SENT:     "#2563EB",
  ACCEPTED: "#16A34A",
  REJECTED: "#DC2626",
  EXPIRED:  "#F97316",
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      salesQuotes: { orderBy: { createdAt: "desc" } },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  })
  if (!customer) notFound()

  return (
    <div>
      <Header title={customer.name} subtitle={customer.company || "Customer details"} />
      <div className="p-6 space-y-6">
        <CustomerForm customer={customer} />

        <CustomerAttachments customerId={customer.id} attachments={customer.attachments} />

        {/* Sales Quotes */}
        <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F5F5]">
            <h2 className="text-sm font-semibold text-[#171717]">Sales Quotes</h2>
            <Link href={`/sales-quotes/new?customerId=${customer.id}`}
              className="text-xs text-[#737373] hover:text-black transition-colors">
              + New Quote
            </Link>
          </div>
          {customer.salesQuotes.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[#737373]">No sales quotes for this customer yet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F5F5F5]">
                  {["Number", "Date", "Status", "Total", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customer.salesQuotes.map((q) => {
                  const color = STATUS_COLORS[q.status] || "#737373"
                  return (
                    <tr key={q.id} className="border-b border-[#F5F5F5] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-5 py-3 font-mono text-xs font-medium text-[#171717]">{q.quoteNumber}</td>
                      <td className="px-5 py-3 text-sm text-[#737373]">{formatDate(q.date)}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2.5 py-1 rounded-full border" style={{ color, borderColor: color }}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-[#171717]">
                        {q.totalAmount ? formatCurrency(q.totalAmount, q.currency) : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Link href={`/sales-quotes/${q.id}`} className="text-xs text-[#737373] hover:text-black transition-colors">View</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
