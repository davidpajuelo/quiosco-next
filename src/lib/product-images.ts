import { randomUUID } from "crypto"
import { mkdir, readFile, unlink, writeFile } from "fs/promises"
import path from "path"

// Fuera de public/: Next solo sirve los ficheros que había en public/ al compilar
const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'products')

const EXTENSIONS: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
}

const CONTENT_TYPES: Record<string, string> = {
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp'
}

// Solo los nombres que genera saveProductImage, así nunca se sale de UPLOADS_DIR
const UPLOADED_IMAGE = /^[0-9a-f-]{36}\.(jpg|png|webp)$/

// El File ya viene validado con ProductImageSchema; devuelve el valor que se guarda en Product.image
export async function saveProductImage(file: File) {
    const name = `${randomUUID()}.${EXTENSIONS[file.type]}`
    await mkdir(UPLOADS_DIR, { recursive: true })
    await writeFile(path.join(UPLOADS_DIR, name), Buffer.from(await file.arrayBuffer()))
    return name
}

export async function readProductImage(name: string) {
    const match = UPLOADED_IMAGE.exec(name)
    if (!match) return null
    try {
        const data = await readFile(path.join(UPLOADS_DIR, name))
        return { data, contentType: CONTENT_TYPES[match[1]] }
    } catch {
        return null
    }
}

// Las imágenes del seed (public/products) no se borran nunca
export async function deleteProductImage(image: string) {
    if (!UPLOADED_IMAGE.test(image)) return
    await unlink(path.join(UPLOADS_DIR, image)).catch(console.log)
}
