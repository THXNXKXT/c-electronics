<div align="center">

# 🔌 C.Electronics · ช.อิเล็กทรอนิกส์

### Electronics Parts & Installation Service — Chiang Rai

ร้านอะไหล่อิเล็กทรอนิกส์และรับติดตั้ง แอร์ กล้องวงจรปิด ระบบไฟฟ้า จานดาวเทียม และซ่อมเครื่องใช้ไฟฟ้า ในจังหวัดเชียงราย

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/NeonDB-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech)
[![Better-Auth](https://img.shields.io/badge/Better--Auth-18181B?style=flat-square&logo=authelia&logoColor=white)](https://www.better-auth.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white)](https://cloudinary.com)

</div>

---

## ✨ Features

| | Feature | Description |
|---|---------|-------------|
| 🏠 | **Landing Page** | Hero + trust badges + services showcase + featured products + booking CTA |
| 📦 | **Product Catalog** | ค้นหา + กรองหมวดหมู่ + เรียงราคา + ราคาปกติ/พิเศษ |
| 🔍 | **Product Detail** | Gallery (multi-image) + breadcrumb + stock status + สอบถาม LINE/โทร |
| 🛠️ | **Services Page** | รายการบริการ + รูป + features + ราคา + จองบริการ |
| 📅 | **Booking System** | ฟอร์มจอง + validation + reference number (server-generated) |
| 📞 | **Contact** | ข้อมูลร้าน + เวลาทำการ + Google Maps embed + LINE QR |
| 🔐 | **Admin Panel** | จัดการสินค้า/บริการ/การจอง/ข้อมูลร้าน — มี auth guard |
| 📸 | **Image Upload** | Cloudinary unsigned upload + auto WebP/AVIF optimization |
| 🗄️ | **Archive System** | เก็บสินค้า/บริการที่ไม่ใช้ (ไม่ลบ) — ซ่อนจากหน้าเว็บ |
| 🔍 | **SEO** | LocalBusiness Schema + sitemap.xml + robots.txt + per-page metadata |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **UI** | React 19 + Tailwind CSS v4 + Framer Motion |
| **Language** | TypeScript 5 (strict mode) |
| **Database** | NeonDB (PostgreSQL serverless) + Drizzle ORM |
| **Auth** | Better-Auth (email/password, session cookies, `requireAdmin()` guards) |
| **Image** | Cloudinary (unsigned upload, f_auto/q_auto optimization, signed delete) |
| **Icons** | lucide-react |
| **Font** | Sukhumvit Set (self-hosted, 6 weights) |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** — `npm install -g pnpm`
- [NeonDB](https://neon.tech) database
- [Cloudinary](https://cloudinary.com) account

### Installation

```bash
git clone <repo-url> && cd c-electronics
pnpm install
cp .env.local.example .env.local  # Edit with your values
npx drizzle-kit push              # Create database tables
npx tsx src/db/seed.ts            # Seed admin user
pnpm dev
```

→ Open **http://localhost:3000** · Admin at **/admin/login**

---

## ⚙️ Environment Variables

```env
DATABASE_URL=postgresql://user:***@host/dbname?sslmode=require
AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (public)/          # Public pages (Nav + Footer)
│   │   ├── page.tsx       # Landing
│   │   ├── products/      # Catalog + [slug] detail
│   │   ├── services/      # Services list
│   │   ├── booking/       # Booking form
│   │   ├── contact/       # Contact info + map
│   │   └── about/         # About page
│   ├── admin/
│   │   ├── login/         # Auth (outside protected group)
│   │   └── (protected)/   # Admin (auth required)
│   │       ├── products/  # CRUD + edit/[id]
│   │       ├── services/  # CRUD + edit/[id]
│   │       ├── bookings/  # Status management
│   │       └── contact/   # Settings editor
│   ├── api/auth/[...all]/ # Better-Auth API
│   ├── layout.tsx         # Root (SEO, Schema, favicon)
│   ├── robots.ts          # /robots.txt
│   └── sitemap.ts         # /sitemap.xml
├── components/            # Nav, Footer, ImageUpload, ConfirmModal
├── db/                    # Drizzle schema + client + seed
└── lib/                   # auth.ts, cloudinary.ts
```

---

## 🔐 Security

- `requireAdmin()` guard on all mutating server actions
- Input validation (null/NaN checks) on trust boundaries
- Booking status enum whitelist
- iframe sandbox on maps embed
- Cloudinary signed delete (sha1, server-side)

---

## 📝 License

Private project — © 2025 C.Electronics · ช.อิเล็กทรอนิกส์
