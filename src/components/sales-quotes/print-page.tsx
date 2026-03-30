"use client"

import { useEffect } from "react"
import type { SalesQuote, SalesQuoteItem, Customer, Item } from "@prisma/client"

type QuoteWithRelations = SalesQuote & {
  customer: Customer
  items: (SalesQuoteItem & { item: Item | null })[]
}

function fmt(value: number, currency: string) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, minimumFractionDigits: 2 }).format(value)
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function PrintPage({ quote }: { quote: QuoteWithRelations }) {
  useEffect(() => {
    window.print()
  }, [])

  const subtotal = quote.items.reduce((s, i) => s + i.totalPrice, 0)
  const discountPct = quote.discountPercent ?? 0
  const vatPct = quote.vatPercent ?? 0
  const discountAmt = subtotal * (discountPct / 100)
  const netSubtotal = subtotal - discountAmt
  const vatAmt = netSubtotal * (vatPct / 100)
  const total = netSubtotal + vatAmt

  return (
    <>
      <style>{`
        @media screen {
          body * { visibility: hidden; }
          #print-root, #print-root * { visibility: visible; }
          #print-root { position: fixed; inset: 0; overflow: auto; background: white; padding: 24px; z-index: 9999; }
        }
        @media print {
          @page { size: A4; margin: 15mm 15mm 15mm 15mm; }
          body * { visibility: hidden; }
          #print-root, #print-root * { visibility: visible; }
          #print-root { position: fixed; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div id="print-root" style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#111", background: "#fff", padding: "0", lineHeight: "1.4" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", borderBottom: "2px solid #111", paddingBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "-0.5px", marginBottom: "2px" }}>P6 Distribution</div>
            <div style={{ fontSize: "11px", color: "#555" }}>Vaca Muerta, Argentina</div>
          </div>
          {/* P6 logo */}
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="56" height="56" rx="8" fill="#111"/>
            <text x="28" y="40" textAnchor="middle" fill="white" fontSize="32" fontWeight="800" fontFamily="Arial, sans-serif">6</text>
          </svg>
        </div>

        {/* Title + meta */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "6px" }}>COTIZACIÓN {quote.quoteNumber}</div>
            <table style={{ borderCollapse: "collapse", fontSize: "11px" }}>
              <tbody>
                <tr>
                  <td style={{ paddingRight: "12px", color: "#555", paddingBottom: "3px" }}>Fecha de emisión</td>
                  <td style={{ fontWeight: "600", paddingBottom: "3px" }}>{fmtDate(quote.date)}</td>
                </tr>
                {quote.validUntil && (
                  <tr>
                    <td style={{ paddingRight: "12px", color: "#555", paddingBottom: "3px" }}>Válida hasta</td>
                    <td style={{ fontWeight: "600", paddingBottom: "3px" }}>{fmtDate(quote.validUntil)}</td>
                  </tr>
                )}
                {quote.incoterms && (
                  <tr>
                    <td style={{ paddingRight: "12px", color: "#555", paddingBottom: "3px" }}>Incoterms</td>
                    <td style={{ fontWeight: "600", paddingBottom: "3px" }}>{quote.incoterms}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Recipient */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#555", marginBottom: "4px" }}>Para</div>
            <div style={{ fontWeight: "700", fontSize: "13px" }}>{quote.customer.name}</div>
            {quote.customer.company && <div style={{ color: "#333" }}>{quote.customer.company}</div>}
            {quote.customer.taxId && <div style={{ color: "#555" }}>CUIT/Tax ID: {quote.customer.taxId}</div>}
            {quote.customer.email && <div style={{ color: "#555" }}>{quote.customer.email}</div>}
            {quote.customer.address && <div style={{ color: "#555" }}>{quote.customer.address}</div>}
          </div>
        </div>

        {/* Items table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
          <thead>
            <tr style={{ background: "#111", color: "#fff" }}>
              <th style={{ textAlign: "left", padding: "7px 8px", fontWeight: "600", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>#</th>
              <th style={{ textAlign: "left", padding: "7px 8px", fontWeight: "600", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Descripción</th>
              <th style={{ textAlign: "left", padding: "7px 8px", fontWeight: "600", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>P/N</th>
              <th style={{ textAlign: "center", padding: "7px 8px", fontWeight: "600", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Cant.</th>
              <th style={{ textAlign: "center", padding: "7px 8px", fontWeight: "600", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Unidad</th>
              <th style={{ textAlign: "right", padding: "7px 8px", fontWeight: "600", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Precio Unit.</th>
              <th style={{ textAlign: "right", padding: "7px 8px", fontWeight: "600", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((li, idx) => (
              <tr key={li.id} style={{ background: idx % 2 === 0 ? "#fff" : "#F8F8F8", borderBottom: "1px solid #E5E5E5" }}>
                <td style={{ padding: "6px 8px", color: "#888" }}>{idx + 1}</td>
                <td style={{ padding: "6px 8px" }}>{li.description}</td>
                <td style={{ padding: "6px 8px", fontFamily: "monospace", fontSize: "10px", color: "#555" }}>{li.partNumber || "—"}</td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>{li.quantity}</td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>{li.unit}</td>
                <td style={{ padding: "6px 8px", textAlign: "right" }}>{fmt(li.unitPrice, quote.currency)}</td>
                <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "600" }}>{fmt(li.totalPrice, quote.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals + conditions */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "24px", marginBottom: "24px" }}>
          {/* Conditions */}
          <div style={{ flex: 1 }}>
            {quote.paymentTerms && (
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#555", display: "block", marginBottom: "2px" }}>Condiciones de pago</span>
                <span style={{ fontWeight: "600" }}>{quote.paymentTerms}</span>
              </div>
            )}
            {quote.deliveryTime && (
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#555", display: "block", marginBottom: "2px" }}>Plazo de entrega</span>
                <span style={{ fontWeight: "600" }}>{quote.deliveryTime}</span>
              </div>
            )}
            {quote.notes && (
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#555", display: "block", marginBottom: "2px" }}>Observaciones</span>
                <span style={{ whiteSpace: "pre-wrap" }}>{quote.notes}</span>
              </div>
            )}
          </div>

          {/* Totals */}
          <div style={{ minWidth: "220px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "4px 8px", color: "#555" }}>Subtotal</td>
                  <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: "600" }}>{fmt(subtotal, quote.currency)}</td>
                </tr>
                {discountPct > 0 && (
                  <>
                    <tr>
                      <td style={{ padding: "4px 8px", color: "#555" }}>Bonificación ({discountPct}%)</td>
                      <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: "600", color: "#555" }}>− {fmt(discountAmt, quote.currency)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "4px 8px", color: "#555" }}>Subtotal neto</td>
                      <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: "600" }}>{fmt(netSubtotal, quote.currency)}</td>
                    </tr>
                  </>
                )}
                {vatPct > 0 && (
                  <tr>
                    <td style={{ padding: "4px 8px", color: "#555" }}>IVA ({vatPct}%)</td>
                    <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: "600" }}>{fmt(vatAmt, quote.currency)}</td>
                  </tr>
                )}
                <tr style={{ borderTop: "2px solid #111" }}>
                  <td style={{ padding: "8px 8px 4px", fontWeight: "700", fontSize: "13px" }}>TOTAL</td>
                  <td style={{ padding: "8px 8px 4px", textAlign: "right", fontWeight: "800", fontSize: "14px" }}>{fmt(total, quote.currency)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #E5E5E5", paddingTop: "10px", fontSize: "10px", color: "#888", textAlign: "center" }}>
          P6 Distribution — {quote.quoteNumber} — Emitida el {fmtDate(quote.date)}
        </div>
      </div>
    </>
  )
}
