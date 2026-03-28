import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Seed categories
  const categories = [
    "Valves",
    "Fittings",
    "Pumps",
    "Instrumentation",
    "Safety Equipment",
    "Pipes & Tubing",
    "Flanges",
    "Gaskets & Seals",
    "Filters",
    "Electrical",
  ]

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  console.log("Seed complete")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
