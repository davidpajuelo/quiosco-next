CREATE TYPE "public"."room_element_kind" AS ENUM('table', 'stool', 'bar', 'obstacle');--> statement-breakpoint
CREATE TYPE "public"."room_element_shape" AS ENUM('rect', 'circle');--> statement-breakpoint
CREATE TABLE "room_elements" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "room_elements_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"room_id" integer NOT NULL,
	"kind" "room_element_kind" NOT NULL,
	"shape" "room_element_shape" DEFAULT 'rect' NOT NULL,
	"x" double precision NOT NULL,
	"y" double precision NOT NULL,
	"width" double precision NOT NULL,
	"height" double precision NOT NULL,
	"rotation" double precision DEFAULT 0 NOT NULL,
	"label" text,
	"table_id" text,
	CONSTRAINT "room_elements_tableId_unique" UNIQUE("table_id")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "rooms_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"outline" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "room_elements" ADD CONSTRAINT "room_elements_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_elements" ADD CONSTRAINT "room_elements_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "room_elements_room_id_index" ON "room_elements" USING btree ("room_id");