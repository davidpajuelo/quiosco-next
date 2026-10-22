import Link from 'next/link'
import ProductTable from '@/components/product/ProductTable'
import Heading from '@/components/ui/Heading'
import { db } from '@/src/db'
import { products } from '@/src/db/schema'
import { asc } from 'drizzle-orm'

async function getProducts() {
  return db.query.products.findMany({
    orderBy: [asc(products.categoryId), asc(products.name)],
    with: {
      category: true
    }
  })
}

export default async function ProductsPage() {
  const productList = await getProducts()
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
      <ProductTable products={productList} />
    </>
  )
}
