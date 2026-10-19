-- AlterTable
ALTER TABLE "OrderProduct" ADD COLUMN     "name" TEXT,
ADD COLUMN     "price" DOUBLE PRECISION,
ALTER COLUMN "productId" DROP NOT NULL;
