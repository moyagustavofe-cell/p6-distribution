"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"

const STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"] as const
type Status = typeof STATUSES[number]

const STYLE: Record<Status, { color: string; border: string; bg: string }> = {
  DRAFT:    { color: "#737373", border: "#D4D4D4", bg: "#FAFAFA" },
  SENT:     { color: "#2563EB", border: "#93C5FD", bg: "#EFF6FF" },
  ACCEPTED: { color: "#16A34A", border: "#86EFAC", bg: "#F0FDF4" },
  REJECTED: { color: "#DC2626", border: "#FCA5A5", bg: "#FEF2F2" },
  EXPIRED:  { color: "#F97316", border: "#FED7AA", bg: "#FFF7ED" },
}

export function StatusSelect({ quoteId, current }: { quoteId: string; current: Status }) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>(current)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  async function handleSelect(next: Status) {
    if (next === status) { setOpen(false); return }
    setOpen(false)
    setSaving(true)
    const res = await fetch(`/api/sales-quotes/${quoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) {
      setStatus(next)
      router.refresh()
    }
    setSaving(false)
  }

  const s = STYLE[status]

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium transition-opacity disabled:opacity-50 hover:opacity-80"
        style={{ color: s.color, borderColor: s.border, background: s.bg }}
      >
        {saving ? "..." : status}
        <ChevronDown size={11} className="opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-[#E5E5E5] rounded-lg shadow-lg overflow-hidden min-w-[120px]">
          {STATUSES.map((s) => {
            const st = STYLE[s]
            return (
              <button
                key={s}
                onClick={() => handleSelect(s)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#F5F5F5] transition-colors"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: st.color }}
                />
                <span style={{ color: st.color }} className="font-medium">{s}</span>
                {s === status && <span className="ml-auto text-[#A3A3A3]">✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
