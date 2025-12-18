import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { v4 as uuidv4 } from 'uuid'

// Ensure storage directory exists
const STORAGE_DIR = path.join(process.cwd(), 'storage')

async function ensureStorageDir() {
    try {
        await fs.access(STORAGE_DIR)
    } catch {
        await fs.mkdir(STORAGE_DIR, { recursive: true })
    }
}

// Initialize storage on module load (or lazily)
ensureStorageDir().catch(console.error)

/**
 * Save a file to the storage directory
 * @param buffer File content
 * @param extension File extension (e.g., 'pdf')
 * @returns generated file ID
 */
export async function saveFile(buffer: Buffer | Uint8Array, extension: string = 'pdf'): Promise<string> {
    await ensureStorageDir()
    const id = uuidv4()
    const filename = `${id}.${extension}`
    const filepath = path.join(STORAGE_DIR, filename)
    const tempFilepath = `${filepath}.tmp`

    try {
        // Write to temp file first
        await fs.writeFile(tempFilepath, buffer)
        // Atomic rename to target file
        await fs.rename(tempFilepath, filepath)
        return id
    } catch (error) {
        // Cleanup temp file if error occurs
        try {
            await fs.unlink(tempFilepath)
        } catch { /* ignore */ }
        throw error
    }
}

/**
 * Read a file from storage
 * @param id File ID
 * @param extension File extension
 */
export async function readFile(id: string, extension: string = 'pdf'): Promise<Buffer> {
    const filepath = path.join(STORAGE_DIR, `${id}.${extension}`)
    return await fs.readFile(filepath)
}

/**
 * Get the absolute path to a file
 * @param id File ID
 * @param extension File extension
 */
export function getFilePath(id: string, extension: string = 'pdf'): string {
    return path.join(STORAGE_DIR, `${id}.${extension}`)
}
