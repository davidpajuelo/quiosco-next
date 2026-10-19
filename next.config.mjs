/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            // Las imágenes de producto llegan en el FormData (máximo 4 MB, ver PRODUCT_IMAGE_MAX_SIZE)
            bodySizeLimit: '5mb'
        }
    }
};

export default nextConfig;
