"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Copy } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"

interface DuplicateButtonProps {
  quoteId: string
  variant?: "row" | "form"
}

export function DuplicateButton({ quoteId, variant = "row" }: DuplicateButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    const res = await fetch(`/api/sales-quotes/${quoteId}/duplicate`, { method: "POST" })
    if (res.ok) {
      const duplicate = await res.json()
      setOpen(false)
      router.push(`/sales-quotes/${duplicate.id}`)
      router.refresh()
    } else {
      setLoading(false)
    }
  }

  const trigger = variant === "row" ? (
    <button
      onClick={() => setOpen(true)}
      className="text-xs text-[#737373] hover:text-black transition-colors"
    >
      Duplicar
    </button>
  ) : (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 h-9 px-5 border border-[#E5E5E5] text-sm font-medium text-[#525252] rounded-md hover:bg-[#FAFAFA] transition-colors"
    >
      <Copy size={14} />
      Duplicar
    </button>
  )

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-white rounded-xl shadow-xl border border-[#E5E5E5] p-6 focus:outline-none">

          {/* Ícono */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F5F5F5] mb-4">
            <Copy size={18} className="text-[#525252]" />
          </div>

          <Dialog.Title className="text-base font-semibold text-[#171717] mb-1">
            Duplicar cotización
          </Dialog.Title>
          <Dialog.Description className="text-sm text-[#737373] mb-6">
            Se creará un borrador nuevo con los mismos ítems, cliente y condiciones. Podés editarlo antes de enviarlo.
          </Dialog.Description>

          <div className="flex gap-3 justify-end">
            <Dialog.Close asChild>
              <button
                className="h-9 px-4 border border-[#E5E5E5] text-sm font-medium text-[#525252] rounded-md hover:bg-[#FAFAFA] transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
            </Dialog.Close>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="h-9 px-4 bg-black text-white text-sm font-medium rounded-md hover:bg-[#171717] disabled:opacity-50 transition-colors"
            >
              {loading ? "Duplicando..." : "Confirmar"}
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
