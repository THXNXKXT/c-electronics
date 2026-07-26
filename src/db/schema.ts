import { pgTable, text, integer, timestamp, boolean, primaryKey } from "drizzle-orm/pg-core";

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

export const services = pgTable("services", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  price: text("price"),
  icon: text("icon").notNull().default("Wrench"),
  image: text("image"),
  features: text("features"),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

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
