import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } })

  const wb = XLSX.utils.book_new()

  // --- Sheet 1: Items template ---
  const headers = [
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

  const exampleRow = [
    "FCE Wing Union 2\" FIG 602 BW SCH XXS",
    "FCE-WU-2-602-XXS",
    categories[0]?.name ?? "",
    "unit",
    "FCE",
    "WU-602-2",
    "8481.80.99",
    "Wing union fig 602, 2 pulgadas, butt weld, sch XXS",
    "TRUE",
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow])

  // Column widths
  ws["!cols"] = [
    { wch: 45 }, // name
    { wch: 22 }, // partNumber
    { wch: 22 }, // categoryName
    { wch: 14 }, // unitOfMeasure
    { wch: 18 }, // manufacturer
    { wch: 22 }, // manufacturerPartNo
    { wch: 14 }, // hsCode
    { wch: 45 }, // description
    { wch: 10 }, // isActive
  ]

  XLSX.utils.book_append_sheet(wb, ws, "Items")

  // --- Sheet 2: Valid categories ---
  const catHeaders = ["categoryName"]
  const catRows = categories.map((c) => [c.name])
  const wsCat = XLSX.utils.aoa_to_sheet([catHeaders, ...catRows])
  wsCat["!cols"] = [{ wch: 30 }]
  XLSX.utils.book_append_sheet(wb, wsCat, "Categories")

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="p6-items-template.xlsx"',
    },
  })
}
