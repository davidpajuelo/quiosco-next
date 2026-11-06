ALTER TABLE "order_products" ADD COLUMN "paid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Los pedidos ya pagados tienen todos sus productos pagados
UPDATE "order_products" SET "paid" = true WHERE "order_id" IN (SELECT "id" FROM "orders" WHERE "payment_status" = 'paid');
