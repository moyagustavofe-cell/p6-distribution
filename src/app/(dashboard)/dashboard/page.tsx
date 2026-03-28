export const dynamic = "force-dynamic"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"

const STATUS_COLORS: Record<string, { color: string }> = {
  DRAFT:        { color: "#737373" },
  SENT_RFQ:     { color: "#2563EB" },
  RECEIVED:     { color: "#0891B2" },
  UNDER_REVIEW: { color: "#D97706" },
  APPROVED:     { color: "#16A34A" },
  REJECTED:     { color: "#DC2626" },
  EXPIRED:      { color: "#F97316" },
}

async function getStats() {
  const [itemsCount, suppliersCount, quotationsCount, quotationsTotal] = await Promise.all([
    prisma.item.count({ where: { isActive: true } }),
    prisma.supplier.count({ where: { isActive: true } }),
    prisma.quotation.count(),
    prisma.quotation.aggregate({ _sum: { totalAmount: true } }),
  ])
  return { itemsCount, suppliersCount, quotationsCount, quotationsTotal: quotationsTotal._sum.totalAmount || 0 }
}

async function getRecentQuotations() {
  return prisma.quotation.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { supplier: true },
  })
}

export default async function DashboardPage() {
  const [stats, recentQuotations] = await Promise.all([getStats(), getRecentQuotations()])

  const statCards = [
    { name: "Active Items",      value: stats.itemsCount },
    { name: "Suppliers",         value: stats.suppliersCount },
    { name: "Quotations",        value: stats.quotationsCount },
    { name: "Total Quoted (USD)", value: formatCurrency(stats.quotationsTotal) },
  ]

  return (
    <div>
      <Header title="Dashboard" subtitle="Overview of P6 Distribution operations" />
      <div className="p-8 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.name} className="bg-white border border-[#E5E5E5] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <p className="text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium mb-2">{stat.name}</p>
              <p className="text-2xl font-extrabold text-black">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Quotations */}
        <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F5F5]">
            <h2 className="text-sm font-semibold text-[#171717]">Recent Quotations</h2>
            <Link href="/quotations" className="text-xs text-[#737373] hover:text-black transition-colors">View all</Link>
          </div>
          {recentQuotations.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-[#737373]">No quotations yet.{" "}
                <Link href="/quotations/new" className="text-black underline">Create one</Link>
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F5F5F5]">
                  <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium">Number</th>
                  <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium">Supplier</th>
                  <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium">Date</th>
                  <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentQuotations.map((q) => {
                  const sc = STATUS_COLORS[q.status] || { color: "#737373" }
                  return (
                    <tr key={q.id} className="border-b border-[#F5F5F5] last:border-0 hover:bg-[#FAFAFA] transition-colors cursor-pointer">
                      <td className="px-5 py-3 font-mono text-xs font-medium text-[#171717]">{q.quotationNumber}</td>
                      <td className="px-5 py-3 text-sm text-[#525252]">{q.supplier.name}</td>
                      <td className="px-5 py-3 text-sm text-[#737373]">{formatDate(q.date)}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2.5 py-1 rounded-full border" style={{ color: sc.color, borderColor: sc.color }}>
                          {q.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-[#171717]">
                        {q.totalAmount ? formatCurrency(q.totalAmount, q.currency) : "—"}
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
