import { createProduct } from '@/actions/product-actions'
import GoBackLink from '@/components/product/GoBackLink'
import ProductForm from '@/components/product/ProductForm'
import Heading from '@/components/ui/Heading'
import { db } from '@/src/db'
import { categories } from '@/src/db/schema'
import { asc } from 'drizzle-orm'

export default async function CreateProductPage() {
  const categoryList = await db.query.categories.findMany({ orderBy: [asc(categories.id)] })
  return (
    <>
      <Heading>Nuevo producto</Heading>
      <GoBackLink />
      <ProductForm action={createProduct} categories={categoryList} />
    </>
  )
}
