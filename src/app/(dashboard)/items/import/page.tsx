"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import { Upload, Download, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

interface ParsedRow {
  name: string
  partNumber: string
  categoryName: string
  unitOfMeasure: string
  manufacturer: string
  manufacturerPartNo: string
  hsCode: string
  description: string
  isActive: string
  _error?: string
}

const REQUIRED_COLS = ["name"]
const EXPECTED_COLS = [
  "name",
  "partNumber",
  "categoryName",
  "unitOfMeasure",
  "manufacturer",
  "manufacturerPartNo",
  "hsCode",
  "description",
  "isActive",
]

export default function ImportItemsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState("")
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null)
  const [globalError, setGlobalError] = useState("")

  function parseFile(file: File) {
    setGlobalError("")
    setResult(null)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: "array" })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" })

        if (raw.length === 0) {
          setGlobalError("El archivo está vacío.")
          setRows([])
          return
        }

        const parsed: ParsedRow[] = raw.map((r, i) => {
          const row: ParsedRow = {
            name: String(r["name"] ?? "").trim(),
            partNumber: String(r["partNumber"] ?? "").trim(),
            categoryName: String(r["categoryName"] ?? "").trim(),
            unitOfMeasure: String(r["unitOfMeasure"] ?? "unit").trim() || "unit",
            manufacturer: String(r["manufacturer"] ?? "").trim(),
            manufacturerPartNo: String(r["manufacturerPartNo"] ?? "").trim(),
            hsCode: String(r["hsCode"] ?? "").trim(),
            description: String(r["description"] ?? "").trim(),
            isActive: String(r["isActive"] ?? "TRUE").trim(),
          }

          const missing = REQUIRED_COLS.filter((col) => !row[col as keyof ParsedRow])
          if (missing.length > 0) {
            row._error = `Fila ${i + 2}: falta campo obligatorio "${missing.join(", ")}"`
          }
          return row
        })

        setRows(parsed)
      } catch {
        setGlobalError("No se pudo leer el archivo. Asegurate de que sea un .xlsx válido.")
        setRows([])
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  const validRows = rows.filter((r) => !r._error)
  const errorRows = rows.filter((r) => r._error)

  async function handleImport() {
    if (validRows.length === 0) return
    setImporting(true)
    setGlobalError("")
    try {
      const payload = validRows.map((r) => ({
        ...r,
        isActive: r.isActive.toUpperCase() !== "FALSE",
      }))
      const res = await fetch("/api/items/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setGlobalError(data.error ?? "Error al importar.")
      } else {
        setResult(data)
        setRows([])
        setFileName("")
      }
    } catch {
      setGlobalError("Error de red al importar.")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-[#F5F5F5] bg-white">
        <div className="flex items-center gap-3">
          <Link href="/items" className="text-[#737373] hover:text-black transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-[#171717]">Import Items</h1>
            <p className="text-xs text-[#737373]">Cargá múltiples items desde un archivo Excel</p>
          </div>
        </div>
        <a
          href="/api/items/template"
          download
          className="flex items-center gap-2 h-9 px-4 border border-[#E5E5E5] text-sm font-medium text-[#525252] rounded-md hover:bg-[#FAFAFA] transition-colors"
        >
          <Download size={14} />
          Descargar plantilla
        </a>
      </div>

      <div className="p-8 max-w-5xl space-y-6">

        {/* Success */}
        {result && (
          <div className="flex items-start gap-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-4">
            <CheckCircle size={18} className="text-[#16A34A] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#15803D]">
                Importación exitosa — {result.created} item{result.created !== 1 ? "s" : ""} creado{result.created !== 1 ? "s" : ""}
              </p>
              {result.skipped > 0 && (
                <p className="text-xs text-[#16A34A] mt-0.5">
                  {result.skipped} fila{result.skipped !== 1 ? "s" : ""} omitida{result.skipped !== 1 ? "s" : ""} (partNumber duplicado o nombre vacío)
                </p>
              )}
              <button
                onClick={() => router.push("/items")}
                className="mt-2 text-xs font-medium text-[#15803D] underline"
              >
                Ver items →
              </button>
            </div>
          </div>
        )}

        {/* Global error */}
        {globalError && (
          <div className="flex items-start gap-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-4">
            <AlertCircle size={18} className="text-[#DC2626] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[#DC2626]">{globalError}</p>
          </div>
        )}

        {/* Instructions */}
        {rows.length === 0 && !result && (
          <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#737373]">Instrucciones</h2>
            <ol className="text-sm text-[#525252] space-y-1.5 list-decimal list-inside">
              <li>Descargá la plantilla con el botón <strong>"Descargar plantilla"</strong></li>
              <li>Completá las filas con tus items (no modifiques los encabezados)</li>
              <li>El único campo obligatorio es <strong>name</strong></li>
              <li>En la hoja <strong>Categories</strong> encontrás los nombres de categoría válidos</li>
              <li>El campo <strong>isActive</strong> acepta <code className="bg-[#F5F5F5] px-1 rounded">TRUE</code> o <code className="bg-[#F5F5F5] px-1 rounded">FALSE</code></li>
              <li>Subí el archivo completado abajo</li>
            </ol>
            <div className="pt-1">
              <p className="text-xs text-[#A3A3A3]">Columnas: {EXPECTED_COLS.join(", ")}</p>
            </div>
          </div>
        )}

        {/* Drop zone */}
        {rows.length === 0 && !result && (
          <div
            className="bg-white border-2 border-dashed border-[#E5E5E5] rounded-lg p-12 text-center cursor-pointer hover:border-[#A3A3A3] transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={28} className="mx-auto text-[#A3A3A3] mb-3" />
            <p className="text-sm font-medium text-[#525252]">
              Arrastrá tu archivo acá o <span className="text-black underline">hacé click para seleccionar</span>
            </p>
            <p className="text-xs text-[#A3A3A3] mt-1">Solo archivos .xlsx — máximo 500 filas</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* Preview */}
        {rows.length > 0 && (
          <div className="space-y-4">
            {/* Summary bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#525252]">
                  Archivo: <strong>{fileName}</strong>
                </span>
                <span className="text-[#16A34A] font-medium">{validRows.length} válidas</span>
                {errorRows.length > 0 && (
                  <span className="text-[#DC2626] font-medium">{errorRows.length} con error</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setRows([]); setFileName("") }}
                  className="h-9 px-4 border border-[#E5E5E5] text-sm font-medium text-[#525252] rounded-md hover:bg-[#FAFAFA] transition-colors"
                >
                  Cambiar archivo
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || validRows.length === 0}
                  className="h-9 px-5 bg-black text-white text-sm font-medium rounded-md hover:bg-[#171717] disabled:opacity-50 transition-colors"
                >
                  {importing ? "Importando..." : `Importar ${validRows.length} item${validRows.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>

            {/* Error rows */}
            {errorRows.length > 0 && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-4 space-y-1">
                <p className="text-xs font-semibold text-[#DC2626] uppercase tracking-[0.05em] mb-2">Filas con errores (serán omitidas)</p>
                {errorRows.map((r, i) => (
                  <p key={i} className="text-xs text-[#DC2626]">{r._error}</p>
                ))}
              </div>
            )}

            {/* Table */}
            <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-[#F5F5F5]">
                    {["#", "Name", "Part Number", "Category", "UOM", "Manufacturer", "HS Code", "Active", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.05em] text-[#737373] font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-[#F5F5F5] last:border-0 ${row._error ? "bg-[#FFF5F5]" : "hover:bg-[#FAFAFA]"}`}
                    >
                      <td className="px-4 py-2.5 text-xs text-[#A3A3A3]">{i + 2}</td>
                      <td className="px-4 py-2.5 text-sm text-[#171717] font-medium max-w-[200px] truncate">{row.name || <span className="text-[#DC2626]">—</span>}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-[#737373]">{row.partNumber || "—"}</td>
                      <td className="px-4 py-2.5 text-sm text-[#525252]">{row.categoryName || "—"}</td>
                      <td className="px-4 py-2.5 text-sm text-[#737373]">{row.unitOfMeasure}</td>
                      <td className="px-4 py-2.5 text-sm text-[#525252]">{row.manufacturer || "—"}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-[#737373]">{row.hsCode || "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${row.isActive.toUpperCase() !== "FALSE" ? "text-[#16A34A] border-[#16A34A]" : "text-[#737373] border-[#E5E5E5]"}`}>
                          {row.isActive.toUpperCase() !== "FALSE" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {row._error && <AlertCircle size={14} className="text-[#DC2626]" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
