import Image from "next/image"
import Link from "next/link"
import { PencilSquareIcon } from "@heroicons/react/24/outline"
import DeleteProductButton from "./DeleteProductButton"
import { ProductWithCategory } from "@/src/types"
import { formatCurrency, getImagePath } from "@/src/utils"

type ProductTableProps = {
    products: ProductWithCategory[]
}

export default function ProductTable({ products }: ProductTableProps) {
    if (products.length === 0) {
        return <p className="text-center my-10">Todavía no hay productos</p>
    }

    return (
        <div className="shadow overflow-x-auto">
            <table className="min-w-full text-left">
                <thead className="border-b border-gray-200">
                    <tr>
                        <th scope="col" className="p-3">Imagen</th>
                        <th scope="col" className="p-3">Producto</th>
                        <th scope="col" className="p-3">Precio</th>
                        <th scope="col" className="p-3">Categoría</th>
                        <th scope="col" className="p-3"><span className="sr-only">Acciones</span></th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <tr key={product.id} className="border-b border-gray-100 last:border-b-0">
                            <td className="p-3">
                                <Image
                                    src={getImagePath(product.image)}
                                    alt={`Imagen de ${product.name}`}
                                    width={64}
                                    height={80}
                                    className="w-16 h-20 object-cover"
                                />
                            </td>
                            <td className="p-3 font-bold">{product.name}</td>
                            <td className="p-3 whitespace-nowrap">{formatCurrency(product.price)}</td>
                            <td className="p-3">{product.category.name}</td>
                            <td className="p-3">
                                <div className="flex justify-end items-center gap-2">
                                    <Link
                                        href={`/admin/products/${product.id}/edit`}
                                        aria-label={`Editar ${product.name}`}
                                        title="Editar"
                                        className="p-1 rounded text-[#C65D3B] hover:bg-orange-50"
                                    >
                                        <PencilSquareIcon className="size-6" aria-hidden="true" />
                                    </Link>
                                    <DeleteProductButton id={product.id} name={product.name} />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
