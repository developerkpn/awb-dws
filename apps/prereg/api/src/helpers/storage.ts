import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, extname, isAbsolute, resolve } from 'node:path'
import { randomBytes } from 'node:crypto'
import { env } from '../config/env'

export function getUploadRoot(): string {
  const uploadDir = env.UPLOAD_DIR || 'uploads'
  return isAbsolute(uploadDir) ? uploadDir : resolve(process.cwd(), uploadDir)
}

export function generateStorageKey(category: string, originalName: string): string {
  const ext = extname(originalName).toLowerCase()
  const cleanCategory = category.toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'document'
  const randomSuffix = randomBytes(4).toString('hex')
  const timestamp = Date.now()
  return `${cleanCategory}/${timestamp}-${randomSuffix}${ext}`
}

export function getFilePath(fileKey: string): string {
  const root = getUploadRoot()
  const target = resolve(root, fileKey)
  if (!target.startsWith(root)) {
    throw new Error('Invalid file path: path traversal detected')
  }
  return target
}

export async function saveFile(fileKey: string, buffer: Buffer): Promise<string> {
  const fullPath = getFilePath(fileKey)
  const dir = dirname(fullPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(fullPath, buffer)
  return fullPath
}

export function fileExists(fileKey: string): boolean {
  try {
    const fullPath = getFilePath(fileKey)
    return existsSync(fullPath)
  } catch {
    return false
  }
}

export function deleteFile(fileKey: string): void {
  try {
    const fullPath = getFilePath(fileKey)
    if (existsSync(fullPath)) {
      unlinkSync(fullPath)
    }
  } catch {
    // Ignore error if already deleted
  }
}

