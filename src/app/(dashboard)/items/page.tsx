import Link from "next/link"
import { Header } from "@/components/layout/header"
import { prisma } from "@/lib/prisma"
import { Plus, Package } from "lucide-react"

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
          <Link
            href="/items/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Item
          </Link>
        }
      />
      <div className="p-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-16">
            <Package className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-gray-500">No items yet</p>
            <Link href="/items/new" className="mt-4 text-sm text-blue-600 hover:underline">
              Add your first item
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Part Number</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Manufacturer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">UOM</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Files</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.partNumber || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{item.category?.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{item.manufacturer || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{item.unitOfMeasure}</td>
                    <td className="px-4 py-3 text-gray-500">{item._count.attachments}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                      }`}>
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/items/${item.id}`} className="text-blue-600 hover:underline text-xs">
                        Edit
                      </Link>
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
