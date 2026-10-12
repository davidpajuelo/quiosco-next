import { Product } from "@/src/generated/prisma/client"
import { formatCurrency } from "@/src/utils"
import Image from "next/image"
import AddProductButton from "./AddProductButton"

type ProductCardProps = {
    product: Product
}
export default function ProductCard({product}: ProductCardProps) {
  return (
    <div className="border">
        <Image 
        width={400}
        height={500}
        src={`/products/${product.image}.jpg`}
        alt={`Imagen platillo ${product.name}`}
        />
        <div className="p-5 ">
            <h3 className="text-2xl">{product.name}</h3>
            <p className="mt-5 text-4xl text-[#C65D3B]">
                { formatCurrency(product.price )}
            </p>
           <AddProductButton 
           product={product}
           />
        </div>
    </div>
  )
}
