import { mkdir, open, rename, unlink } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { env } from '../config/env'

export const uploadRoot = resolve(env.UPLOAD_DIR)
export const incomingDirectory = resolve(uploadRoot, '.incoming')

export function getFilePath(key: string): string {
  const target = resolve(uploadRoot, key)
  const path = relative(uploadRoot, target)

  if (!path || isAbsolute(path) || path === '..' || path.startsWith(`..${sep}`)) {
    throw new Error('Invalid storage key')
  }

  return target
}

export async function prepareIncoming() {
  await mkdir(incomingDirectory, {
    recursive: true,
    mode: 0o700,
  })
}

export async function removeFile(path: string) {
  try {
    await unlink(path)
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error
  }
}

export async function detectFileType(path: string) {
  const file = await open(path, 'r')

  try {
    const buffer = Buffer.alloc(16)

    await file.read(buffer, 0, buffer.length, 0)

    if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      return {
        extension: '.png',
        mimeType: 'image/png',
      }
    }

    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return {
        extension: '.jpg',
        mimeType: 'image/jpeg',
      }
    }

    if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
      return {
        extension: '.pdf',
        mimeType: 'application/pdf',
      }
    }

    return null
  } finally {
    await file.close()
  }
}

export async function storeFile(source: string, category: string, extension: string) {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '/')
  const key = `${category}/${date}/${randomUUID()}${extension}`
  const destination = getFilePath(key)

  await mkdir(resolve(destination, '..'), {
    recursive: true,
    mode: 0o700,
  })

  await rename(source, destination)

  return key
}
