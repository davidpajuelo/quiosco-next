import ProductCard from "@/components/product/ProductCard"
import Heading from "@/components/ui/Heading"
import { db } from "@/src/db"
import { categories, products } from "@/src/db/schema"
import { eq, inArray } from "drizzle-orm"

async function getProducts(category: string){
  return db.select().from(products).where(inArray(
    products.categoryId,
    db.select({ id: categories.id }).from(categories).where(eq(categories.slug, category))
  ))
}

export default async function OrderPage({params}:{params:{category: string}}) {
 const productList = await getProducts(params.category)
  return (
    <>
    <Heading>Elige y personaliza tu pedido a continuación</Heading>
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 items-start">
      {productList.map(product =>(
        <ProductCard
        key={product.id}
        product={product}/>
      ))}
    </div>
    </>
  )
}


