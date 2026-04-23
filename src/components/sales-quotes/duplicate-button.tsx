"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Copy } from "lucide-react"

interface DuplicateButtonProps {
  quoteId: string
  variant?: "row" | "form"  // row = link-style en tabla, form = botón en el form de edición
}

export function DuplicateButton({ quoteId, variant = "row" }: DuplicateButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDuplicate() {
    if (!confirm("¿Duplicar esta cotización? Se creará un borrador con los mismos ítems.")) return
    setLoading(true)
    const res = await fetch(`/api/sales-quotes/${quoteId}/duplicate`, { method: "POST" })
    if (res.ok) {
      const duplicate = await res.json()
      router.push(`/sales-quotes/${duplicate.id}`)
      router.refresh()
    } else {
      alert("Error al duplicar la cotización.")
    }
    setLoading(false)
  }

  if (variant === "row") {
    return (
      <button
        onClick={handleDuplicate}
        disabled={loading}
        className="text-xs text-[#737373] hover:text-black disabled:opacity-40 transition-colors"
      >
        {loading ? "..." : "Duplicar"}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleDuplicate}
      disabled={loading}
      className="flex items-center gap-2 h-9 px-5 border border-[#E5E5E5] text-sm font-medium text-[#525252] rounded-md hover:bg-[#FAFAFA] disabled:opacity-50 transition-colors"
    >
      <Copy size={14} />
      {loading ? "Duplicando..." : "Duplicar"}
    </button>
  )
}
