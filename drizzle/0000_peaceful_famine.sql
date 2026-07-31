CREATE TYPE "public"."article_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "articles" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" jsonb NOT NULL,
	"category" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"cover_image" text,
	"cover_image_alt" text,
	"cover_public_id" text,
	"related_service_id" text,
	"status" "article_status" DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"canonical_url" text,
	"no_index" boolean DEFAULT false NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "article_products" (
	"article_id" text NOT NULL,
	"product_id" text NOT NULL,
	CONSTRAINT "article_products_article_id_product_id_pk" PRIMARY KEY("article_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_related_service_id_services_id_fk" FOREIGN KEY ("related_service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_products" ADD CONSTRAINT "article_products_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_products" ADD CONSTRAINT "article_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "article_products_product_idx" ON "article_products" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "articles_publication_idx" ON "articles" USING btree ("status","archived","published_at");--> statement-breakpoint
CREATE INDEX "articles_category_idx" ON "articles" USING btree ("category");
