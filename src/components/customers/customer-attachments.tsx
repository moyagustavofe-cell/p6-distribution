"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Paperclip, Upload, Trash2, FileText, FileImage, File, AlertTriangle } from "lucide-react"

interface Attachment {
  id: string
  originalName: string
  mimeType: string
  size: number
  createdAt: string | Date
  hasData: boolean
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <FileImage size={16} className="text-[#737373]" />
  if (mimeType === "application/pdf") return <FileText size={16} className="text-[#737373]" />
  return <File size={16} className="text-[#737373]" />
}

export function CustomerAttachments({
  customerId,
  attachments: initial,
}: {
  customerId: string
  attachments: Attachment[]
}) {
  const [attachments, setAttachments] = useState<Attachment[]>(initial)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append("file", file)
        fd.append("customerId", customerId)
        const res = await fetch("/api/attachments", { method: "POST", body: fd })
        if (!res.ok) throw new Error("Upload failed")
        const att = await res.json()
        setAttachments((prev) => [{ ...att, hasData: true }, ...prev])
      }
    } catch {
      setError("Error al subir el archivo. Intentá de nuevo.")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
      startTransition(() => router.refresh())
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este archivo?")) return
    setDeletingId(id)
    try {
      await fetch(`/api/attachments/${id}`, { method: "DELETE" })
      setAttachments((prev) => prev.filter((a) => a.id !== id))
      startTransition(() => router.refresh())
    } finally {
      setDeletingId(null)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleUpload(e.dataTransfer.files)
  }

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F5F5]">
        <h2 className="text-sm font-semibold text-[#171717] flex items-center gap-2">
          <Paperclip size={14} />
          Archivos adjuntos
        </h2>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs text-[#737373] hover:text-black transition-colors disabled:opacity-50"
        >
          <Upload size={13} />
          {uploading ? "Subiendo..." : "Subir archivo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {attachments.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="p-8 text-center cursor-pointer border-2 border-dashed border-[#E5E5E5] rounded-b-lg hover:border-[#D4D4D4] transition-colors"
        >
          <Upload size={20} className="mx-auto mb-2 text-[#D4D4D4]" />
          <p className="text-sm text-[#737373]">Arrastrá archivos aquí o hacé click para seleccionar</p>
          <p className="text-xs text-[#A3A3A3] mt-1">Certificados, contratos, documentos, etc.</p>
        </div>
      ) : (
        <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
          <ul className="divide-y divide-[#F5F5F5]">
            {attachments.map((att) => (
              <li
                key={att.id}
                className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                  att.hasData ? "hover:bg-[#FAFAFA]" : "bg-[#FFFBEB]"
                }`}
              >
                {att.hasData ? (
                  <FileIcon mimeType={att.mimeType} />
                ) : (
                  <AlertTriangle size={16} className="text-[#F59E0B] shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  {att.hasData ? (
                    <a
                      href={`/api/attachments/${att.id}`}
                      download={att.originalName}
                      className="text-sm text-[#171717] hover:underline truncate block"
                    >
                      {att.originalName}
                    </a>
                  ) : (
                    <span className="text-sm text-[#A3A3A3] line-through truncate block">
                      {att.originalName}
                    </span>
                  )}
                  <span className="text-xs text-[#A3A3A3]">
                    {att.hasData
                      ? `${formatBytes(att.size)} · ${new Date(att.createdAt).toLocaleDateString("es-AR")}`
                      : "Archivo perdido — eliminá y volvé a subir"}
                  </span>
                </div>

                <button
                  onClick={() => handleDelete(att.id)}
                  disabled={deletingId === att.id}
                  className="p-1 text-[#D4D4D4] hover:text-[#DC2626] transition-colors disabled:opacity-50 shrink-0"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
          <div className="px-5 py-3 border-t border-[#F5F5F5]">
            <p className="text-xs text-[#A3A3A3]">Arrastrá más archivos aquí para adjuntarlos</p>
          </div>
        </div>
      )}

      {error && (
        <p className="px-5 py-3 text-xs text-[#DC2626] border-t border-[#F5F5F5]">{error}</p>
      )}
    </div>
  )
}
