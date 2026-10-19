export function formatCurrency(amount: number){
    return new Intl.NumberFormat('es-ES',{
        style: 'currency',
        currency : 'EUR'
    }).format(amount)
}

// Las imágenes del seed están en public/products y se guardan sin extensión;
// las subidas desde el admin llevan extensión y las sirve app/uploads/products/[file]/route.ts
export function getImagePath(image: string) {
    return image.includes('.') ? `/uploads/products/${image}` : `/products/${image}.jpg`
}