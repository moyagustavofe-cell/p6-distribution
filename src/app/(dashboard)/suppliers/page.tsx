import Link from "next/link"
import { Header } from "@/components/layout/header"
import { prisma } from "@/lib/prisma"
import { Plus, Building2 } from "lucide-react"

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
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />
            New Supplier
          </Link>
        }
      />
      <div className="p-6">
        {suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-16">
            <Building2 className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-gray-500">No suppliers yet</p>
            <Link href="/suppliers/new" className="mt-4 text-sm text-blue-600 hover:underline">
              Add your first supplier
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Country</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Quotations</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500">{s.country || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{s.contactName || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{s.email || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{s._count.quotations}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        s.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                      }`}>
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/suppliers/${s.id}`} className="text-blue-600 hover:underline text-xs">Edit</Link>
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
