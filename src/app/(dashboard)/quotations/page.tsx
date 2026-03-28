import Link from "next/link"
import { Header } from "@/components/layout/header"
import { prisma } from "@/lib/prisma"
import { Plus, FileText } from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT_RFQ: "bg-blue-100 text-blue-700",
  RECEIVED: "bg-cyan-100 text-cyan-700",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-700",
}

export default async function QuotationsPage() {
  const quotations = await prisma.quotation.findMany({
    include: { supplier: true, _count: { select: { items: true, attachments: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <Header
        title="Quotations"
        subtitle="Supplier quotations and RFQ management"
        actions={
          <Link href="/quotations/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />
            New Quotation
          </Link>
        }
      />
      <div className="p-6">
        {quotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-16">
            <FileText className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-gray-500">No quotations yet</p>
            <Link href="/quotations/new" className="mt-4 text-sm text-blue-600 hover:underline">
              Create your first quotation
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Number</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Supplier</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Items</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Files</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">{q.quotationNumber}</td>
                    <td className="px-4 py-3 text-gray-700">{q.supplier.name}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(q.date)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[q.status]}`}>
                        {q.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{q._count.items}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {q.totalAmount ? formatCurrency(q.totalAmount, q.currency) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{q._count.attachments}</td>
                    <td className="px-4 py-3">
                      <Link href={`/quotations/${q.id}`} className="text-blue-600 hover:underline text-xs">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
