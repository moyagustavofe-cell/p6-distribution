export const dynamic = "force-dynamic"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { prisma } from "@/lib/prisma"
import { Plus, Upload, Download } from "lucide-react"

export default async function ItemsPage() {
  const items = await prisma.item.findMany({
    include: { category: true, _count: { select: { attachments: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <Header
        title="Items"
        subtitle="Product catalog for oil & gas supplies"
        actions={
          <div className="flex items-center gap-2">
            <a
              href="/api/items/template"
              download
              className="flex items-center gap-2 h-9 px-4 border border-[#E5E5E5] text-sm font-medium text-[#525252] rounded-md hover:bg-[#FAFAFA] transition-colors"
            >
              <Download size={14} />
              Plantilla Excel
            </a>
            <Link
              href="/items/import"
              className="flex items-center gap-2 h-9 px-4 border border-[#E5E5E5] text-sm font-medium text-[#525252] rounded-md hover:bg-[#FAFAFA] transition-colors"
            >
              <Upload size={14} />
              Import Excel
            </Link>
            <Link href="/items/new"
              className="flex items-center gap-2 h-9 px-4 bg-black text-white text-sm font-medium rounded-md hover:bg-[#171717] transition-colors">
              <Plus size={14} />
              New Item
            </Link>
          </div>
        }
      />
      <div className="p-8">
        {items.length === 0 ? (
          <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-12 text-center">
            <p className="text-sm text-[#737373]">No items yet.{" "}
              <Link href="/items/new" className="text-black underline">Add your first item</Link>
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F5F5F5]">
                  {["Name", "Part Number", "Category", "Manufacturer", "UOM", "Files", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-[#F5F5F5] last:border-0 hover:bg-[#FAFAFA] transition-colors cursor-pointer">
                    <td className="px-5 py-3 text-sm font-medium text-[#171717]">{item.name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#737373]">{item.partNumber || "—"}</td>
                    <td className="px-5 py-3 text-sm text-[#525252]">{item.category?.name || "—"}</td>
                    <td className="px-5 py-3 text-sm text-[#525252]">{item.manufacturer || "—"}</td>
                    <td className="px-5 py-3 text-sm text-[#737373]">{item.unitOfMeasure}</td>
                    <td className="px-5 py-3 text-sm text-[#737373]">{item._count.attachments}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2.5 py-1 rounded-full border"
                        style={{ color: item.isActive ? "#16A34A" : "#737373", borderColor: item.isActive ? "#16A34A" : "#E5E5E5" }}>
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/items/${item.id}`} className="text-xs text-[#737373] hover:text-black transition-colors">Edit</Link>
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
