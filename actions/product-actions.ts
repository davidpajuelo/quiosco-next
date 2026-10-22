"use server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { db } from "@/src/db"
import { categories, orderProducts, products } from "@/src/db/schema"
import { deleteProductImage, saveProductImage } from "@/src/lib/product-images"
import { ProductIdSchema, ProductImageSchema, ProductSchema, hasImage } from "@/src/schema"

export type ProductActionResponse = { errors: { message: string }[] }

function parseProduct(formData: FormData) {
    return ProductSchema.safeParse({
        name: formData.get('name'),
        price: formData.get('price'),
        categoryId: formData.get('categoryId')
    })
}

async function categoryExists(id: number) {
    return !!await db.query.categories.findFirst({ where: eq(categories.id, id), columns: { id: true } })
}

function findProduct(id: number) {
    return db.query.products.findFirst({ where: eq(products.id, id) })
}

// El listado del admin y las cartas de cliente y quiosco muestran los productos
function revalidateProducts() {
    revalidatePath('/admin/products')
    revalidatePath('/order/[category]', 'page')
    revalidatePath('/admin/quiosco/[category]', 'page')
}

export async function createProduct(formData: FormData): Promise<ProductActionResponse> {
    const result = parseProduct(formData)
    const image = ProductImageSchema.safeParse(formData.get('image'))
    if (!result.success || !image.success) {
        return {
            errors: [
                ...(result.success ? [] : result.error.issues),
                ...(image.success ? [] : image.error.issues)
            ]
        }
    }
    if (!await categoryExists(result.data.categoryId)) {
        return { errors: [{ message: 'La categoría no existe' }] }
    }

    let imageName: string | undefined
    try {
        imageName = await saveProductImage(image.data)
        await db.insert(products).values({ ...result.data, image: imageName })
    } catch (error) {
        console.log(error)
        if (imageName) await deleteProductImage(imageName)
        return { errors: [{ message: 'No se pudo crear el producto' }] }
    }

    revalidateProducts()
    redirect('/admin/products')
}

// Sin imagen nueva se mantiene la actual
export async function updateProduct(id: number, formData: FormData): Promise<ProductActionResponse> {
    const productId = ProductIdSchema.safeParse(id)
    const product = productId.success ? await findProduct(productId.data) : null
    if (!product) {
        return { errors: [{ message: 'El producto no existe' }] }
    }

    const result = parseProduct(formData)
    const newImage = formData.get('image')
    const image = hasImage(newImage) ? ProductImageSchema.safeParse(newImage) : null
    if (!result.success || (image && !image.success)) {
        return {
            errors: [
                ...(result.success ? [] : result.error.issues),
                ...(image && !image.success ? image.error.issues : [])
            ]
        }
    }
    if (!await categoryExists(result.data.categoryId)) {
        return { errors: [{ message: 'La categoría no existe' }] }
    }

    let imageName: string | undefined
    try {
        if (image?.success) imageName = await saveProductImage(image.data)
        const updated = await db.update(products)
            .set({ ...result.data, image: imageName ?? product.image })
            .where(eq(products.id, product.id))
            .returning({ id: products.id })
        // Drizzle no lanza si lo han borrado entretanto; así la imagen nueva se borra en el catch
        if (updated.length === 0) throw new Error(`Producto ${product.id} no encontrado`)
    } catch (error) {
        console.log(error)
        if (imageName) await deleteProductImage(imageName)
        return { errors: [{ message: 'No se pudo guardar el producto' }] }
    }
    if (imageName) await deleteProductImage(product.image)

    revalidateProducts()
    redirect('/admin/products')
}

export type DeleteProductResponse = ProductActionResponse | { success: true }

// Las líneas de pedido del producto se quedan con su nombre y precio, como las manuales,
// para que los pedidos sigan mostrándolo
export async function deleteProduct(id: number): Promise<DeleteProductResponse> {
    const productId = ProductIdSchema.safeParse(id)
    const product = productId.success ? await findProduct(productId.data) : null
    if (!product) {
        return { errors: [{ message: 'El producto no existe' }] }
    }

    try {
        await db.transaction(async (tx) => {
            await tx.update(orderProducts)
                .set({ productId: null, name: product.name, price: product.price })
                .where(eq(orderProducts.productId, product.id))
            await tx.delete(products).where(eq(products.id, product.id))
        })
    } catch (error) {
        console.log(error)
        return { errors: [{ message: 'No se pudo borrar el producto' }] }
    }
    await deleteProductImage(product.image)

    revalidateProducts()
    revalidatePath('/admin/orders')
    return { success: true }
}
