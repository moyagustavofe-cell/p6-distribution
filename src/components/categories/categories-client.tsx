"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Check, X } from "lucide-react"

interface Category {
  id: string
  name: string
  _count: { items: number }
}

export function CategoriesClient({ categories: initial }: { categories: Category[] }) {
  const router = useRouter()
  const [categories, setCategories] = useState(initial)
  const [newName, setNewName] = useState("")
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  async function handleAdd() {
    if (!newName.trim()) return
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    })
    if (res.ok) {
      setNewName("")
      setAdding(false)
      router.refresh()
      const cat = await res.json()
      setCategories((prev) => [...prev, { ...cat, _count: { items: 0 } }].sort((a, b) => a.name.localeCompare(b.name)))
    }
  }

  async function handleEdit(id: string) {
    if (!editName.trim()) return
    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    })
    if (res.ok) {
      setEditingId(null)
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: editName.trim() } : c)).sort((a, b) => a.name.localeCompare(b.name))
      )
      router.refresh()
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete category "${name}"? Items in this category will be uncategorized.`)) return
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id))
      router.refresh()
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F5F5]">
          <h2 className="text-sm font-semibold text-[#171717]">Categories</h2>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 h-7 px-3 border border-[#E5E5E5] text-xs font-medium text-[#525252] rounded-md hover:bg-[#FAFAFA] transition-colors"
            >
              <Plus size={12} />
              Add Category
            </button>
          )}
        </div>

        {adding && (
          <div className="flex items-center gap-2 px-5 py-3 border-b border-[#F5F5F5] bg-[#FAFAFA]">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setNewName("") } }}
              placeholder="Category name"
              className="h-8 flex-1 px-3 border border-[#E5E5E5] rounded-md text-sm focus:outline-none focus:border-black bg-white"
            />
            <button onClick={handleAdd} className="h-8 px-3 bg-black text-white text-xs font-medium rounded-md hover:bg-[#171717] transition-colors flex items-center gap-1">
              <Check size={12} /> Save
            </button>
            <button onClick={() => { setAdding(false); setNewName("") }} className="h-8 px-3 border border-[#E5E5E5] text-xs text-[#525252] rounded-md hover:bg-white transition-colors">
              <X size={12} />
            </button>
          </div>
        )}

        {categories.length === 0 && !adding ? (
          <div className="p-12 text-center">
            <p className="text-sm text-[#737373]">No categories yet. Add your first category.</p>
          </div>
        ) : (
          <ul>
            {categories.map((cat) => (
              <li key={cat.id} className="flex items-center gap-3 px-5 py-3 border-b border-[#F5F5F5] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                {editingId === cat.id ? (
                  <>
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleEdit(cat.id); if (e.key === "Escape") setEditingId(null) }}
                      className="h-7 flex-1 px-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-black bg-white"
                    />
                    <button onClick={() => handleEdit(cat.id)} className="text-[#16A34A] hover:text-green-700 transition-colors">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-[#737373] hover:text-black transition-colors">
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-[#171717] font-medium">{cat.name}</span>
                    <span className="text-xs text-[#A3A3A3]">{cat._count.items} item{cat._count.items !== 1 ? "s" : ""}</span>
                    <button
                      onClick={() => { setEditingId(cat.id); setEditName(cat.name) }}
                      className="text-[#D4D4D4] hover:text-[#525252] transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="text-[#D4D4D4] hover:text-[#DC2626] transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
