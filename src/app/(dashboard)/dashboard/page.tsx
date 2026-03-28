export const dynamic = "force-dynamic"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"

const QUOT_STATUS_COLORS: Record<string, string> = {
  DRAFT:        "#737373",
  SENT_RFQ:     "#2563EB",
  RECEIVED:     "#0891B2",
  UNDER_REVIEW: "#D97706",
  APPROVED:     "#16A34A",
  REJECTED:     "#DC2626",
  EXPIRED:      "#F97316",
}

const SQ_STATUS_COLORS: Record<string, string> = {
  DRAFT:    "#737373",
  SENT:     "#2563EB",
  ACCEPTED: "#16A34A",
  REJECTED: "#DC2626",
  EXPIRED:  "#F97316",
}

async function getStats() {
  const [itemsCount, suppliersCount, quotationsCount, quotationsTotal, customersCount, salesQuotesCount, salesQuotesTotal] = await Promise.all([
    prisma.item.count({ where: { isActive: true } }),
    prisma.supplier.count({ where: { isActive: true } }),
    prisma.quotation.count(),
    prisma.quotation.aggregate({ _sum: { totalAmount: true } }),
    prisma.customer.count({ where: { isActive: true } }),
    prisma.salesQuote.count(),
    prisma.salesQuote.aggregate({ _sum: { totalAmount: true } }),
  ])
  return {
    itemsCount, suppliersCount, quotationsCount,
    quotationsTotal: quotationsTotal._sum.totalAmount || 0,
    customersCount, salesQuotesCount,
    salesQuotesTotal: salesQuotesTotal._sum.totalAmount || 0,
  }
}

async function getRecentQuotations() {
  return prisma.quotation.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { supplier: true },
  })
}

async function getRecentSalesQuotes() {
  return prisma.salesQuote.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { customer: true },
  })
}

export default async function DashboardPage() {
  const [stats, recentQuotations, recentSalesQuotes] = await Promise.all([
    getStats(), getRecentQuotations(), getRecentSalesQuotes(),
  ])

  const statCards = [
    { name: "Active Items",          value: stats.itemsCount,                       href: "/items" },
    { name: "Suppliers",             value: stats.suppliersCount,                   href: "/suppliers" },
    { name: "Customers",             value: stats.customersCount,                   href: "/customers" },
    { name: "Quotations (Buy)",      value: stats.quotationsCount,                  href: "/quotations" },
    { name: "Sales Quotes",          value: stats.salesQuotesCount,                 href: "/sales-quotes" },
    { name: "Total Purchased (USD)", value: formatCurrency(stats.quotationsTotal),  href: "/quotations" },
    { name: "Total Sold (USD)",      value: formatCurrency(stats.salesQuotesTotal), href: "/sales-quotes" },
  ]

  return (
    <div>
      <Header title="Dashboard" subtitle="Overview of P6 Distribution operations" />
      <div className="p-8 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Link key={stat.name} href={stat.href}
              className="bg-white border border-[#E5E5E5] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-[#A3A3A3] transition-colors">
              <p className="text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium mb-2">{stat.name}</p>
              <p className="text-2xl font-extrabold text-black">{stat.value}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Purchase Quotations */}
          <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F5F5]">
              <h2 className="text-sm font-semibold text-[#171717]">Recent Quotations</h2>
              <Link href="/quotations" className="text-xs text-[#737373] hover:text-black transition-colors">View all</Link>
            </div>
            {recentQuotations.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-[#737373]">No quotations yet.{" "}
                  <Link href="/quotations/new" className="text-black underline">Create one</Link>
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F5F5F5]">
                    {["Number", "Supplier", "Date", "Status", "Total"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentQuotations.map((q) => {
                    const color = QUOT_STATUS_COLORS[q.status] || "#737373"
                    return (
                      <tr key={q.id} className="border-b border-[#F5F5F5] last:border-0 hover:bg-[#FAFAFA] transition-colors cursor-pointer">
                        <td className="px-5 py-3 font-mono text-xs font-medium text-[#171717]">
                          <Link href={`/quotations/${q.id}`}>{q.quotationNumber}</Link>
                        </td>
                        <td className="px-5 py-3 text-sm text-[#525252]">{q.supplier.name}</td>
                        <td className="px-5 py-3 text-sm text-[#737373]">{formatDate(q.date)}</td>
                        <td className="px-5 py-3">
                          <span className="text-xs px-2.5 py-1 rounded-full border" style={{ color, borderColor: color }}>
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

          {/* Recent Sales Quotes */}
          <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F5F5]">
              <h2 className="text-sm font-semibold text-[#171717]">Recent Sales Quotes</h2>
              <Link href="/sales-quotes" className="text-xs text-[#737373] hover:text-black transition-colors">View all</Link>
            </div>
            {recentSalesQuotes.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-[#737373]">No sales quotes yet.{" "}
                  <Link href="/sales-quotes/new" className="text-black underline">Create one</Link>
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F5F5F5]">
                    {["Number", "Customer", "Date", "Status", "Total"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentSalesQuotes.map((q) => {
                    const color = SQ_STATUS_COLORS[q.status] || "#737373"
                    return (
                      <tr key={q.id} className="border-b border-[#F5F5F5] last:border-0 hover:bg-[#FAFAFA] transition-colors cursor-pointer">
                        <td className="px-5 py-3 font-mono text-xs font-medium text-[#171717]">
                          <Link href={`/sales-quotes/${q.id}`}>{q.quoteNumber}</Link>
                        </td>
                        <td className="px-5 py-3 text-sm text-[#525252]">
                          <Link href={`/customers/${q.customerId}`} className="hover:underline">{q.customer.name}</Link>
                        </td>
                        <td className="px-5 py-3 text-sm text-[#737373]">{formatDate(q.date)}</td>
                        <td className="px-5 py-3">
                          <span className="text-xs px-2.5 py-1 rounded-full border" style={{ color, borderColor: color }}>
                            {q.status}
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
    </div>
  )
}
