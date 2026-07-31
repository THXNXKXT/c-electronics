import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { ArticleDocument } from "@/lib/articles";
import type { ServiceFaq, ServiceProcessStep } from "@/lib/services";

// ===== Better-Auth required tables =====
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===== App tables =====
export const products = pgTable("products", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  price: integer("price").notNull(),
  compareAtPrice: integer("compare_at_price"),
  stock: boolean("stock").notNull().default(true),
  archived: boolean("archived").notNull().default(false),
  description: text("description"),
  image: text("image"), // cover image URL
  publicId: text("public_id"), // Cloudinary public_id for cover (for delete)
  images: text("images"), // gallery: comma-separated URLs
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const serviceStatus = pgEnum("service_status", ["draft", "published"]);

export const services = pgTable(
  "services",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    price: text("price"),
    icon: text("icon").notNull().default("Wrench"),
    image: text("image"),
    features: text("features"),
    content: jsonb("content").$type<ArticleDocument>().notNull().default({
      type: "doc", content: [{ type: "paragraph", content: [] }],
    }),
    processSteps: jsonb("process_steps").$type<ServiceProcessStep[]>().notNull().default([]),
    faqs: jsonb("faqs").$type<ServiceFaq[]>().notNull().default([]),
    imageAlt: text("image_alt"),
    imagePublicId: text("image_public_id"),
    status: serviceStatus("status").notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    canonicalUrl: text("canonical_url"),
    noIndex: boolean("no_index").notNull().default(false),
    archived: boolean("archived").notNull().default(false),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    index("services_publication_idx").on(
      table.status,
      table.archived,
      table.publishedAt,
    ),
  ],
);

export const serviceSlugRedirects = pgTable(
  "service_slug_redirects",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    serviceId: text("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("service_slug_redirects_service_idx").on(table.serviceId)],
);

export const articleStatus = pgEnum("article_status", ["draft", "published"]);

export const articles = pgTable(
  "articles",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    excerpt: text("excerpt").notNull(),
    content: jsonb("content").$type<ArticleDocument>().notNull(),
    category: text("category").notNull(),
    tags: text("tags").array().notNull().default([]),
    coverImage: text("cover_image"),
    coverImageAlt: text("cover_image_alt"),
    coverPublicId: text("cover_public_id"),
    relatedServiceId: text("related_service_id").references(() => services.id, {
      onDelete: "set null",
    }),
    status: articleStatus("status").notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    canonicalUrl: text("canonical_url"),
    noIndex: boolean("no_index").notNull().default(false),
    archived: boolean("archived").notNull().default(false),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("articles_publication_idx").on(
      table.status,
      table.archived,
      table.publishedAt,
    ),
    index("articles_category_idx").on(table.category),
  ],
);

export const articleProducts = pgTable(
  "article_products",
  {
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      name: "article_products_article_id_product_id_pk",
      columns: [table.articleId, table.productId],
    }),
    index("article_products_product_idx").on(table.productId),
  ],
);

// ponytail: single-row settings table — contact info editable from admin
export const settings = pgTable("settings", {
  id: text("id").primaryKey().$defaultFn(() => "singleton"),
  phone: text("phone"),
  line: text("line"),
  email: text("email"),
  address: text("address"),
  mondayFriday: text("monday_friday"),
  saturday: text("saturday"),
  sunday: text("sunday"),
  mapsEmbed: text("maps_embed"),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const bookings = pgTable("bookings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ref: text("ref"), // ponytail: booking reference number, generated server-side
  serviceType: text("service_type").notNull(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  district: text("district"),
  address: text("address"),
  preferredDate: text("preferred_date"),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending | contacted | scheduled | done
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
