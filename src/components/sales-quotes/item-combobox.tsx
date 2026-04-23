"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import type { Item } from "@prisma/client"

interface ItemComboboxProps {
  items: Item[]
  value: string
  inputValue: string
  onSelect: (item: Item | null) => void
  onInputChange: (text: string) => void
}

function highlight(text: string, query: string) {
  if (!query.trim()) return <span>{text}</span>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <span>{text}</span>
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 text-inherit font-semibold rounded-sm px-0">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </span>
  )
}

function scoreItem(item: Item, q: string): number {
  const ql = q.toLowerCase()
  const name = item.name.toLowerCase()
  const pn = (item.partNumber ?? "").toLowerCase()
  const mfr = (item.manufacturer ?? "").toLowerCase()

  if (name.startsWith(ql)) return 3
  if (name.includes(ql)) return 2
  if (pn.includes(ql)) return 1
  if (mfr.includes(ql)) return 0.5
  return -1
}

export function ItemCombobox({ items, value, inputValue, onSelect, onInputChange }: ItemComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(inputValue)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(inputValue)
  }, [inputValue])

  // Posicionar el dropdown relativo al input en coordenadas de ventana
  function updatePosition() {
    const rect = inputRef.current?.getBoundingClientRect()
    if (!rect) return
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: 288,
      zIndex: 9999,
    })
  }

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        inputRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return
      setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Reposicionar al hacer scroll o resize
  useEffect(() => {
    if (!open) return
    const update = () => updatePosition()
    window.addEventListener("scroll", update, true)
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update, true)
      window.removeEventListener("resize", update)
    }
  }, [open])

  const suggestions = useCallback(() => {
    if (!query.trim()) return items.slice(0, 8)
    return items
      .map((item) => ({ item, score: scoreItem(item, query) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.item)
  }, [items, query])()

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    onInputChange(v)
    updatePosition()
    setOpen(true)
    if (!v) onSelect(null)
  }

  function handleFocus() {
    updatePosition()
    setOpen(true)
  }

  function handleSelect(item: Item) {
    setQuery(item.name)
    onInputChange(item.name)
    onSelect(item)
    setOpen(false)
  }

  function handleClear() {
    setQuery("")
    onInputChange("")
    onSelect(null)
    setOpen(false)
    inputRef.current?.focus()
  }

  const showDropdown = open && (suggestions.length > 0 || query.trim().length > 0)

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={handleFocus}
          placeholder="Buscar item..."
          className="w-full h-7 pl-2 pr-6 border border-[#E5E5E5] rounded text-xs focus:outline-none focus:border-black bg-white"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1.5 text-[#A3A3A3] hover:text-[#525252] transition-colors leading-none"
            tabIndex={-1}
          >
            ×
          </button>
        )}
      </div>

      {showDropdown && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="bg-white border border-[#E5E5E5] rounded-lg shadow-xl overflow-hidden"
        >
          {suggestions.length > 0 ? (
            suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(item) }}
                className={`w-full text-left px-3 py-2 hover:bg-[#F5F5F5] transition-colors border-b border-[#F5F5F5] last:border-0 ${
                  value === item.id ? "bg-[#F5F5F5]" : ""
                }`}
              >
                <div className="text-xs font-medium text-[#171717] truncate">
                  {highlight(item.name, query)}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.partNumber && (
                    <span className="font-mono text-[10px] text-[#737373]">
                      {highlight(item.partNumber, query)}
                    </span>
                  )}
                  {item.manufacturer && (
                    <span className="text-[10px] text-[#A3A3A3]">
                      {highlight(item.manufacturer, query)}
                    </span>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="px-3 py-2">
              <p className="text-xs text-[#A3A3A3]">Sin resultados para &ldquo;{query}&rdquo;</p>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
