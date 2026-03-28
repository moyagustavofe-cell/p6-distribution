import Link from "next/link"
import { Header } from "@/components/layout/header"
import { prisma } from "@/lib/prisma"
import { Plus } from "lucide-react"

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { quotations: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <div>
      <Header
        title="Suppliers"
        subtitle="International suppliers for oil & gas supplies"
        actions={
          <Link href="/suppliers/new"
            className="flex items-center gap-2 h-9 px-4 bg-black text-white text-sm font-medium rounded-md hover:bg-[#171717] transition-colors">
            <Plus size={14} />
            New Supplier
          </Link>
        }
      />
      <div className="p-8">
        {suppliers.length === 0 ? (
          <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-12 text-center">
            <p className="text-sm text-[#737373]">No suppliers yet.{" "}
              <Link href="/suppliers/new" className="text-black underline">Add your first supplier</Link>
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F5F5F5]">
                  {["Name", "Country", "Contact", "Email", "Quotations", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id} className="border-b border-[#F5F5F5] last:border-0 hover:bg-[#FAFAFA] transition-colors cursor-pointer">
                    <td className="px-5 py-3 text-sm font-medium text-[#171717]">{s.name}</td>
                    <td className="px-5 py-3 text-sm text-[#525252]">{s.country || "—"}</td>
                    <td className="px-5 py-3 text-sm text-[#525252]">{s.contactName || "—"}</td>
                    <td className="px-5 py-3 text-sm text-[#737373]">{s.email || "—"}</td>
                    <td className="px-5 py-3 text-sm text-[#737373]">{s._count.quotations}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2.5 py-1 rounded-full border"
                        style={{ color: s.isActive ? "#16A34A" : "#737373", borderColor: s.isActive ? "#16A34A" : "#E5E5E5" }}>
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/suppliers/${s.id}`} className="text-xs text-[#737373] hover:text-black transition-colors">Edit</Link>
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
