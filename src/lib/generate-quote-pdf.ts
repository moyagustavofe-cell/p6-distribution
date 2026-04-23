"use client"

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

async function fetchLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch("/p6-logo.png")
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

interface QuoteItem {
  description: string
  partNumber: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  unit: string
}

interface QuoteCustomer {
  name: string
  company: string | null
  taxId: string | null
  email: string | null
  address: string | null
}

interface QuoteData {
  quoteNumber: string
  date: Date | string
  validUntil: Date | string | null
  currency: string
  paymentTerms: string | null
  deliveryTime: string | null
  incoterms: string | null
  notes: string | null
  discountPercent: number | null
  vatPercent: number | null
  customer: QuoteCustomer
  items: QuoteItem[]
}

function fmt(value: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

function fmtDate(d: Date | string | null) {
  if (!d) return ""
  return new Date(d).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export async function generateQuotePdf(quote: QuoteData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15

  // ── Header ──────────────────────────────────────────────────────
  const headerY = margin

  const logoDataUrl = await fetchLogoDataUrl()

  // ── Sender block (above divider, left) ──────────────────────────
  // "DE" label
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 120, 120)
  doc.text("DE", margin, headerY + 5)

  // "P6 Solutions" bold — this line also anchors the logo
  const senderNameY = headerY + 11
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(17, 17, 17)
  doc.text("P6 Solutions", margin, senderNameY)

  // Remaining sender lines
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  const senderLines = ["Tufud SRL", "CUIT: 33718537679", "gustavo@p6solutions.com"]
  senderLines.forEach((line, i) => {
    doc.text(line, margin, senderNameY + 5 + i * 5)
  })

  // Divider — 6mm below last sender line
  const dividerY = senderNameY + 5 + senderLines.length * 5 + 6

  // Logo (top right) aligned with "P6 Solutions" line
  const logoW = 8   // mm
  const logoH = logoW * (163 / 116)
  if (logoDataUrl) {
    // top of logo = cap top of "P6 Solutions" text (~3mm above baseline)
    doc.addImage(logoDataUrl, "PNG", pageWidth - margin - logoW, senderNameY - 3, logoW, logoH)
  }

  // Divider
  doc.setDrawColor(17, 17, 17)
  doc.setLineWidth(0.6)
  doc.line(margin, dividerY, pageWidth - margin, dividerY)

  // ── Quote title + meta (left) ────────────────────────────────────
  const metaY = dividerY + 7
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.setTextColor(17, 17, 17)
  doc.text(`COTIZACIÓN ${quote.quoteNumber}`, margin, metaY)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)

  const metaLines: [string, string][] = [
    ["Fecha de emisión", fmtDate(quote.date)],
  ]
  if (quote.validUntil) metaLines.push(["Válida hasta", fmtDate(quote.validUntil)])
  if (quote.incoterms) metaLines.push(["Incoterms", quote.incoterms])

  metaLines.forEach(([label, value], i) => {
    const y = metaY + 7 + i * 5.5
    doc.setTextColor(120, 120, 120)
    doc.setFont("helvetica", "normal")
    doc.text(label, margin, y)
    doc.setTextColor(17, 17, 17)
    doc.setFont("helvetica", "bold")
    doc.text(value, margin + 36, y)
  })

  // ── Recipient (right) ───────────────────────────────────────────
  const recipX = pageWidth / 2 + 5
  const recipY = metaY

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 120, 120)
  doc.text("PARA", recipX, recipY)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(17, 17, 17)
  doc.text(quote.customer.name, recipX, recipY + 6)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  let recipOffset = 11
  if (quote.customer.company) {
    doc.text(quote.customer.company, recipX, recipY + recipOffset)
    recipOffset += 5
  }
  if (quote.customer.taxId) {
    doc.text(`CUIT/Tax ID: ${quote.customer.taxId}`, recipX, recipY + recipOffset)
    recipOffset += 5
  }
  if (quote.customer.email) {
    doc.text(quote.customer.email, recipX, recipY + recipOffset)
    recipOffset += 5
  }
  let addrLineCount = 0
  if (quote.customer.address) {
    const addrLines = doc.splitTextToSize(quote.customer.address, pageWidth / 2 - margin - 5)
    doc.text(addrLines, recipX, recipY + recipOffset)
    addrLineCount = addrLines.length
  }

  // ── Items table ─────────────────────────────────────────────────
  // tableY must clear BOTH the left meta block AND the right recipient block
  const leftBlockBottom  = metaY + 7 + metaLines.length * 5.5
  const rightBlockBottom = recipY + recipOffset + addrLineCount * 5
  const tableY = Math.max(leftBlockBottom, rightBlockBottom) + 8

  autoTable(doc, {
    startY: tableY,
    margin: { left: margin, right: margin },
    head: [["#", "Descripción", "P/N", "Cant.", "Unidad", "Precio Unit.", "Total"]],
    body: quote.items.map((item, i) => [
      String(i + 1),
      item.description,
      item.partNumber || "—",
      item.quantity,
      item.unit,
      fmt(item.unitPrice, quote.currency),
      fmt(item.totalPrice, quote.currency),
    ]),
    headStyles: {
      fillColor: [17, 17, 17],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: [17, 17, 17] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      2: { cellWidth: 28, font: "courier", fontSize: 7 },
      3: { cellWidth: 14, halign: "center" },
      4: { cellWidth: 14, halign: "center" },
      5: { cellWidth: 28, halign: "right" },
      6: { cellWidth: 28, halign: "right", fontStyle: "bold" },
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY as number

  // ── Totals + conditions ──────────────────────────────────────────
  const subtotal = quote.items.reduce((s, i) => s + i.totalPrice, 0)
  const discountPct = quote.discountPercent ?? 0
  const vatPct = quote.vatPercent ?? 0
  const discountAmt = subtotal * (discountPct / 100)
  const netSubtotal = subtotal - discountAmt
  const vatAmt = netSubtotal * (vatPct / 100)
  const total = netSubtotal + vatAmt

  const condY = finalY + 8
  const totalsX = pageWidth - margin - 72

  // Conditions (left side)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  let condOffset = 0

  if (quote.paymentTerms) {
    doc.setTextColor(120, 120, 120)
    doc.setFont("helvetica", "bold")
    doc.text("CONDICIONES DE PAGO", margin, condY + condOffset)
    condOffset += 4.5
    doc.setFont("helvetica", "normal")
    doc.setTextColor(17, 17, 17)
    doc.text(quote.paymentTerms, margin, condY + condOffset)
    condOffset += 7
  }

  if (quote.deliveryTime) {
    doc.setTextColor(120, 120, 120)
    doc.setFont("helvetica", "bold")
    doc.text("PLAZO DE ENTREGA", margin, condY + condOffset)
    condOffset += 4.5
    doc.setFont("helvetica", "normal")
    doc.setTextColor(17, 17, 17)
    doc.text(quote.deliveryTime, margin, condY + condOffset)
    condOffset += 7
  }

  if (quote.notes) {
    doc.setTextColor(120, 120, 120)
    doc.setFont("helvetica", "bold")
    doc.text("OBSERVACIONES", margin, condY + condOffset)
    condOffset += 4.5
    doc.setFont("helvetica", "normal")
    doc.setTextColor(17, 17, 17)
    const noteLines = doc.splitTextToSize(quote.notes, totalsX - margin - 5)
    doc.text(noteLines, margin, condY + condOffset)
  }

  // Totals (right side)
  let totY = condY
  const labelX = totalsX
  const valueX = pageWidth - margin

  function totRow(label: string, value: string, bold = false, big = false) {
    doc.setFont("helvetica", bold ? "bold" : "normal")
    doc.setFontSize(big ? 10 : 8)
    doc.setTextColor(bold ? 17 : 80, bold ? 17 : 80, bold ? 17 : 80)
    doc.text(label, labelX, totY)
    doc.text(value, valueX, totY, { align: "right" })
    totY += big ? 0 : 5.5  // don't advance after last row (we advance manually)
  }

  totRow("Subtotal", fmt(subtotal, quote.currency))
  if (discountPct > 0) {
    totRow(`Bonificación (${discountPct}%)`, `- ${fmt(discountAmt, quote.currency)}`)
    totRow("Subtotal neto", fmt(netSubtotal, quote.currency))
  }
  if (vatPct > 0) {
    totRow(`IVA (${vatPct}%)`, fmt(vatAmt, quote.currency))
  }

  // Divider — drawn with clear separation above and below
  totY += 3  // gap before line
  doc.setDrawColor(17, 17, 17)
  doc.setLineWidth(0.5)
  doc.line(labelX, totY, valueX, totY)
  totY += 5  // gap between line and TOTAL text

  // TOTAL row (big, bold)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(17, 17, 17)
  doc.text("TOTAL", labelX, totY)
  doc.text(fmt(total, quote.currency), valueX, totY, { align: "right" })

  // ── Page numbers (two-pass) ──────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  const pageH = doc.internal.pageSize.getHeight()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.text(`Página ${p} de ${totalPages}`, pageWidth / 2, pageH - 8, { align: "center" })
  }

  doc.save(`${quote.quoteNumber}.pdf`)
}
