import Link from "next/link"
import { Header } from "@/components/layout/header"
import { prisma } from "@/lib/prisma"
import { Plus } from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"

const STATUS_COLORS: Record<string, string> = {
  DRAFT:        "#737373",
  SENT_RFQ:     "#2563EB",
  RECEIVED:     "#0891B2",
  UNDER_REVIEW: "#D97706",
  APPROVED:     "#16A34A",
  REJECTED:     "#DC2626",
  EXPIRED:      "#F97316",
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
            className="flex items-center gap-2 h-9 px-4 bg-black text-white text-sm font-medium rounded-md hover:bg-[#171717] transition-colors">
            <Plus size={14} />
            New Quotation
          </Link>
        }
      />
      <div className="p-8">
        {quotations.length === 0 ? (
          <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-12 text-center">
            <p className="text-sm text-[#737373]">No quotations yet.{" "}
              <Link href="/quotations/new" className="text-black underline">Create your first quotation</Link>
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F5F5F5]">
                  {["Number", "Supplier", "Date", "Status", "Items", "Total", "Files", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => {
                  const color = STATUS_COLORS[q.status] || "#737373"
                  return (
                    <tr key={q.id} className="border-b border-[#F5F5F5] last:border-0 hover:bg-[#FAFAFA] transition-colors cursor-pointer">
                      <td className="px-5 py-3 font-mono text-xs font-medium text-[#171717]">{q.quotationNumber}</td>
                      <td className="px-5 py-3 text-sm text-[#525252]">{q.supplier.name}</td>
                      <td className="px-5 py-3 text-sm text-[#737373]">{formatDate(q.date)}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2.5 py-1 rounded-full border" style={{ color, borderColor: color }}>
                          {q.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-[#737373]">{q._count.items}</td>
                      <td className="px-5 py-3 text-sm font-medium text-[#171717]">
                        {q.totalAmount ? formatCurrency(q.totalAmount, q.currency) : "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-[#737373]">{q._count.attachments}</td>
                      <td className="px-5 py-3">
                        <Link href={`/quotations/${q.id}`} className="text-xs text-[#737373] hover:text-black transition-colors">Edit</Link>
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
