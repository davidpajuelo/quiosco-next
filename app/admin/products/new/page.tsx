import { createProduct } from '@/actions/product-actions'
import GoBackLink from '@/components/product/GoBackLink'
import ProductForm from '@/components/product/ProductForm'
import Heading from '@/components/ui/Heading'
import { prisma } from '@/src/lib/prisma'

export default async function CreateProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } })
  return (
    <>
      <Heading>Nuevo producto</Heading>
      <GoBackLink />
      <ProductForm action={createProduct} categories={categories} />
    </>
  )
}
