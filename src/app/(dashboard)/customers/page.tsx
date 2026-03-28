export const dynamic = "force-dynamic"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { prisma } from "@/lib/prisma"
import { Plus } from "lucide-react"

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    include: { _count: { select: { salesQuotes: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <div>
      <Header
        title="Customers"
        subtitle="Client accounts for P6 Distribution"
        actions={
          <Link href="/customers/new"
            className="flex items-center gap-2 h-9 px-4 bg-black text-white text-sm font-medium rounded-md hover:bg-[#171717] transition-colors">
            <Plus size={14} />
            New Customer
          </Link>
        }
      />
      <div className="p-8">
        {customers.length === 0 ? (
          <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-12 text-center">
            <p className="text-sm text-[#737373]">No customers yet.{" "}
              <Link href="/customers/new" className="text-black underline">Add your first customer</Link>
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F5F5F5]">
                  {["Name", "Company", "Country", "Email", "Phone", "Quotes", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-[#F5F5F5] last:border-0 hover:bg-[#FAFAFA] transition-colors cursor-pointer">
                    <td className="px-5 py-3 text-sm font-medium text-[#171717]">{c.name}</td>
                    <td className="px-5 py-3 text-sm text-[#525252]">{c.company || "—"}</td>
                    <td className="px-5 py-3 text-sm text-[#525252]">{c.country || "—"}</td>
                    <td className="px-5 py-3 text-sm text-[#737373]">{c.email || "—"}</td>
                    <td className="px-5 py-3 text-sm text-[#737373]">{c.phone || "—"}</td>
                    <td className="px-5 py-3 text-sm text-[#737373]">{c._count.salesQuotes}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2.5 py-1 rounded-full border"
                        style={{ color: c.isActive ? "#16A34A" : "#737373", borderColor: c.isActive ? "#16A34A" : "#E5E5E5" }}>
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/customers/${c.id}`} className="text-xs text-[#737373] hover:text-black transition-colors">Edit</Link>
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
