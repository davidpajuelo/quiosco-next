"use server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/src/lib/prisma"
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
    return !!await prisma.category.findUnique({ where: { id } })
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
        await prisma.product.create({
            data: { ...result.data, image: imageName }
        })
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
    const product = productId.success ? await prisma.product.findUnique({ where: { id: productId.data } }) : null
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
        await prisma.product.update({
            where: { id: product.id },
            data: { ...result.data, image: imageName ?? product.image }
        })
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
    const product = productId.success ? await prisma.product.findUnique({ where: { id: productId.data } }) : null
    if (!product) {
        return { errors: [{ message: 'El producto no existe' }] }
    }

    try {
        await prisma.$transaction([
            prisma.orderProduct.updateMany({
                where: { productId: product.id },
                data: { productId: null, name: product.name, price: product.price }
            }),
            prisma.product.delete({ where: { id: product.id } })
        ])
    } catch (error) {
        console.log(error)
        return { errors: [{ message: 'No se pudo borrar el producto' }] }
    }
    await deleteProductImage(product.image)

    revalidateProducts()
    revalidatePath('/admin/orders')
    return { success: true }
}
