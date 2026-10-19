import { readProductImage } from "@/src/lib/product-images"

// Imágenes de producto subidas desde el admin
export async function GET(_request: Request, { params }: { params: { file: string } }) {
    const image = await readProductImage(params.file)
    if (!image) {
        return new Response('Imagen no encontrada', { status: 404 })
    }
    return new Response(new Uint8Array(image.data), {
        headers: {
            'Content-Type': image.contentType,
            // El nombre es único: una imagen nueva siempre tiene otro nombre
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff'
        }
    })
}
