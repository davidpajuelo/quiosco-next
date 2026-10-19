import { notFound } from 'next/navigation'
import { updateProduct } from '@/actions/product-actions'
import GoBackLink from '@/components/product/GoBackLink'
import ProductForm from '@/components/product/ProductForm'
import Heading from '@/components/ui/Heading'
import { prisma } from '@/src/lib/prisma'
import { ProductIdSchema } from '@/src/schema'

async function getProduct(id: string) {
  const productId = ProductIdSchema.safeParse(id)
  if (!productId.success) return null
  return prisma.product.findUnique({ where: { id: productId.data } })
}

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id)
  if (!product) notFound()
  const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } })

  return (
    <>
      <Heading>Editar producto: {product.name}</Heading>
      <GoBackLink />
      <ProductForm
        action={updateProduct.bind(null, product.id)}
        categories={categories}
        product={product}
      />
    </>
  )
}
