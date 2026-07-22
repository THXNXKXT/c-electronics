---
version: alpha
name: C.Electronics
description: Electronics parts retailer and installation service in Chiang Rai. Blue accent on white canvas — trustworthy, clear, energetic.
colors:
  # Brand & Accent — Electronics Blue
  primary: "#174AE6"
  primary-hover: "#0A3BC8"
  primary-active: "#0834B3"
  primary-tint: "#E8EEFD"

  # Surface (replaces Wise's sage canvas)
  canvas: "#FFFFFF"
  canvas-muted: "#F2F5FA"
  surface-card: "#FFFFFF"
  surface-tint: "#EEF2F9"

  # Text
  ink: "#0A0B0D"
  muted: "#6C7278"
  subtle: "#9BA1AB"

  # Semantic
  positive: "#0E9F6E"
  positive-tint: "#DCFCE7"
  warning: "#C4770A"
  warning-tint: "#FEF3C7"
  negative: "#DA1E28"
  negative-tint: "#FEE2E2"

typography:
  # Hero display — heavy, like Wise weight 900
  hero-display:
    fontFamily: "Inter, Sukhumvit Set, sans-serif"
    fontSize: 5rem
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  hero-display-sm:
    fontFamily: "Inter, Sukhumvit Set, sans-serif"
    fontSize: 3rem
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"

  # Sub-display & section headings — weight 700
  section-title:
    fontFamily: "Inter, Sukhumvit Set, sans-serif"
    fontSize: 1.75rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  card-title:
    fontFamily: "Inter, Sukhumvit Set, sans-serif"
    fontSize: 1.25rem
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"

  # Body — weight 400-500
  body-lg:
    fontFamily: "Inter, Sukhumvit Set, sans-serif"
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: "Inter, Sukhumvit Set, sans-serif"
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Inter, Sukhumvit Set, sans-serif"
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.45

  # Label — uppercase, tracked, like Wise nav/eyebrow
  label:
    fontFamily: "Inter, Sukhumvit Set, sans-serif"
    fontSize: 0.75rem
    fontWeight: 600
    letterSpacing: "0.06em"
    textTransform: uppercase

  # Numbers — tabular for prices/stock
  number-display:
    fontFamily: "Inter, Sukhumvit Set, sans-serif"
    fontSize: 2rem
    fontWeight: 700
    fontVariantNumeric: tabular-nums
    letterSpacing: "-0.02em"

rounded:
  pill: 24px
  card: 20px
  input: 12px
  chip: 999px
  sm: 8px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px

components:
  # Primary CTA — pill, blue, white text
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: 14px 28px
    typography:
      fontFamily: "Inter, Sukhumvit Set, sans-serif"
      fontSize: 1rem
      fontWeight: 600
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-primary-active:
    backgroundColor: "{colors.primary-active}"

  # Secondary — white card, ink text, hairline border
  button-secondary:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: 14px 28px

  # Ghost — transparent, blue text
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: 10px 16px

  # Feature card — white on canvas-muted, surface contrast IS the elevation
  card-feature:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: 32px

  # Service card — tinted background for grouping
  card-service:
    backgroundColor: "{colors.surface-tint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: 24px

  # Input — 12px radius, hairline border
  input-field:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: 12px 16px
---

## Overview

C.Electronics — ร้านอะไหล่อิเล็กทรอนิกส์และรับติดตั้งในจังหวัดเชียงราย
สไตล์ต่อยอดจาก Wise design system: pill shapes, heavy display type,
surface contrast แทน shadow. เปลี่ยน sage→ขาว, green→น้ำเงิน.

## Colors

**3 โทนหลัก + accent:**
- **Canvas (#FFFFFF / #F2F5FA):** พื้นหลังขาว สลับบานเฉียงฟ้าอ่อน — surface contrast ทำงานบนนี้
- **Primary (#174AE6):** Electronics blue — CTA, link, accent เดียวที่ขับในหน้า
- **Ink (#0A0B0D) / Muted (#6C7278):** 2 ระดับ text เท่านั้น — ink สำหรับ heading/body, muted สำหรับ secondary

**Semantic (ใช้เฉพาะ status):** positive/warning/negative มี tint สำหรับ badge และ status indicator

## Typography

สองระดับน้ำหนัก คั่น hero กับส่วนอื่น — เหมือน Wise ใช้ 900 vs 600:
- **Hero: weight 800, ขนาดใหญ่ (80px→48px responsive)** — สำหรับหัวข้อหลักใน landing เท่านั้น
- **ทุกอย่างอื่น: weight 400-700** — section title 700, body 400, label uppercase tracked

Font: **Inter** (next/font, Latin) + **Sukhumvit Set** (system fallback บน Apple).
บน Windows/Android ที่ไม่มี Sukhumvit Set → Inter แสดงแทน ภาษาไทยอ่านง่าย

## Elevation

Surface contrast แทน drop shadow — เหมือน Wise:
1. **Flat:** สีขาวบนขาว = default
2. **Hairline:** 1px solid border (#E5E7EB) สำหรับ input, secondary button
3. **Soft-card:** การ์ดสีขาวบน canvas-muted (#F2F5FA) = ดูลอยโดยไม่ต้องมี shadow

## Shapes

- **Pill (24px):** button ทั้งหมด — signature shape
- **Card (20px):** feature card, service card
- **Input (12px):** text field, search, select
- **Chip (999px):** tag, filter, status badge

## Motion

Framer Motion — spring physics ไม่ใช่ linear:
- **Spring:** stiffness 300, damping 30, mass 0.8 (default สำหรับ interaction)
- **Page reveal:** y:12→0, opacity 0→1, duration 0.45s
- **Stagger:** service cards, product grid — delay ตามลำดับ 0.05s
- **Hover:** button scale 1.02, card y -2px

## Layout

- **Max-width:** 1200px (desktop), full-bleed mobile
- **Section padding:** 48px desktop → 32px tablet → 20px mobile
- **Grid:** 12-col desktop, 2-col mobile
- **Navbar:** sticky, transparent→solid on scroll
