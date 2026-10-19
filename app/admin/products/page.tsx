import Link from 'next/link'
import ProductTable from '@/components/product/ProductTable'
import Heading from '@/components/ui/Heading'
import { prisma } from '@/src/lib/prisma'

async function getProducts() {
  const products = await prisma.product.findMany({
    orderBy: [
      { categoryId: 'asc' },
      { name: 'asc' }
    ],
    include: {
      category: true
    }
  })
  return products
}

export default async function ProductsPage() {
  const products = await getProducts()
  return (
    <>
      <Heading>Administrar Productos</Heading>
      <div className="flex justify-end my-5">
        <Link
          href="/admin/products/new"
          className="py-3 px-10 rounded uppercase text-black bg-primary hover:bg-primary-dark text-center w-full lg:w-auto"
        >
          Crear producto
        </Link>
      </div>
      <ProductTable products={products} />
    </>
  )
}
