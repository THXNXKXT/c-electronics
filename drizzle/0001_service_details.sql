CREATE TYPE "public"."service_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "service_slug_redirects" (
	"id" text PRIMARY KEY NOT NULL,
	"service_id" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_slug_redirects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "content" jsonb DEFAULT '{"type":"doc","content":[{"type":"paragraph","content":[]}]}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "process_steps" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "faqs" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "image_alt" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "image_public_id" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "status" "service_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "seo_title" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "seo_description" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "canonical_url" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "no_index" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "service_slug_redirects" ADD CONSTRAINT "service_slug_redirects_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_slug_redirects_service_idx" ON "service_slug_redirects" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "services_publication_idx" ON "services" USING btree ("status","archived","published_at");