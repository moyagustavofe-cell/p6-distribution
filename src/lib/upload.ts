import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./public/uploads"

export async function saveFile(file: File): Promise<{
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
}> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = file.name.split(".").pop() || "bin"
  const filename = `${randomUUID()}.${ext}`
  const uploadPath = join(process.cwd(), UPLOAD_DIR)

  await mkdir(uploadPath, { recursive: true })
  await writeFile(join(uploadPath, filename), buffer)

  return {
    filename,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    url: `/uploads/${filename}`,
  }
}

export async function deleteFile(filename: string): Promise<void> {
  const { unlink } = await import("fs/promises")
  const filePath = join(process.cwd(), UPLOAD_DIR, filename)
  try {
    await unlink(filePath)
  } catch {
    // File may not exist, ignore
  }
}
