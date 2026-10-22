import { notFound } from 'next/navigation'
import { updateProduct } from '@/actions/product-actions'
import GoBackLink from '@/components/product/GoBackLink'
import ProductForm from '@/components/product/ProductForm'
import Heading from '@/components/ui/Heading'
import { db } from '@/src/db'
import { categories, products } from '@/src/db/schema'
import { ProductIdSchema } from '@/src/schema'
import { asc, eq } from 'drizzle-orm'

async function getProduct(id: string) {
  const productId = ProductIdSchema.safeParse(id)
  if (!productId.success) return null
  return db.query.products.findFirst({ where: eq(products.id, productId.data) })
}

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id)
  if (!product) notFound()
  const categoryList = await db.query.categories.findMany({ orderBy: [asc(categories.id)] })

  return (
    <>
      <Heading>Editar producto: {product.name}</Heading>
      <GoBackLink />
      <ProductForm
        action={updateProduct.bind(null, product.id)}
        categories={categoryList}
        product={product}
      />
    </>
  )
}
