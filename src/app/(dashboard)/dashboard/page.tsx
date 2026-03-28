import { Header } from "@/components/layout/header"
import { prisma } from "@/lib/prisma"
import { Package, Building2, FileText, TrendingUp } from "lucide-react"

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
    { name: "Active Items", value: stats.itemsCount, icon: Package, color: "bg-blue-500" },
    { name: "Suppliers", value: stats.suppliersCount, icon: Building2, color: "bg-green-500" },
    { name: "Quotations", value: stats.quotationsCount, icon: FileText, color: "bg-orange-500" },
    { name: "Total Quoted (USD)", value: `$${stats.quotationsTotal.toLocaleString()}`, icon: TrendingUp, color: "bg-purple-500" },
  ]

  return (
    <div>
      <Header title="Dashboard" subtitle="Overview of P6 Distribution operations" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.name} className="bg-white rounded-xl border p-5 flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Quotations */}
        <div className="bg-white rounded-xl border">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Recent Quotations</h2>
          </div>
          <div className="divide-y">
            {recentQuotations.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No quotations yet</p>
            ) : (
              recentQuotations.map((q) => (
                <div key={q.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{q.quotationNumber}</p>
                    <p className="text-sm text-gray-500">{q.supplier.name}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      q.status === "APPROVED" ? "bg-green-100 text-green-800" :
                      q.status === "RECEIVED" ? "bg-blue-100 text-blue-800" :
                      q.status === "REJECTED" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {q.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">{q.currency} {q.totalAmount?.toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
