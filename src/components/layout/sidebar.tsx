"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, Building2, FileText, Users, Receipt } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Items", href: "/items", icon: Package },
  { name: "Suppliers", href: "/suppliers", icon: Building2 },
  { name: "Quotations", href: "/quotations", icon: FileText },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Sales Quotes", href: "/sales-quotes", icon: Receipt },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="sticky top-0 flex h-screen w-56 flex-col border-r border-[#E5E5E5] bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-[#E5E5E5] px-5">
        <span className="text-sm font-extrabold tracking-tight text-black">P6 Distribution</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={[
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-[#F5F5F5] font-medium text-[#171717]"
                  : "text-[#737373] hover:bg-[#FAFAFA] hover:text-[#171717]",
              ].join(" ")}
            >
              <item.icon size={15} strokeWidth={isActive ? 2 : 1.5} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#E5E5E5] px-5 py-4">
        <p className="text-[11px] text-[#737373]">Vaca Muerta, Argentina</p>
      </div>
    </div>
  )
}
