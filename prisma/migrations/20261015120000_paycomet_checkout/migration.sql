-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paycomet_id" TEXT,
ADD COLUMN     "paycomet_order" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_paycomet_order_key" ON "Order"("paycomet_order");
