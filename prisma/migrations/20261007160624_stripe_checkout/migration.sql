-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'cancelled', 'refunded', 'payment_failed');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "amount" INTEGER,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "stripe_checkout_session_id" TEXT,
ADD COLUMN     "stripe_payment_intent_id" TEXT;

-- Backfill de los pedidos existentes: importe en céntimos y fecha de creación
UPDATE "Order" SET "amount" = ROUND("total"::numeric * 100)::integer, "created_at" = "date";
ALTER TABLE "Order" ALTER COLUMN "amount" SET NOT NULL;

-- CreateTable
CREATE TABLE "stripe_events" (
    "id" SERIAL NOT NULL,
    "stripe_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stripe_events_stripe_event_id_key" ON "stripe_events"("stripe_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripe_checkout_session_id_key" ON "Order"("stripe_checkout_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripe_payment_intent_id_key" ON "Order"("stripe_payment_intent_id");
