# Service Detail Pages and Service CMS Design

Date: 2026-07-31
Status: Approved design, pending implementation plan

## 1. Goal

Add high-quality Thai service detail pages at `/services/[slug]` and extend the existing service administration area into a full CMS. The work must preserve the existing service cards, support draft review before publication, and provide stable, indexable URLs with safe permanent redirects when a published slug changes.

The system will use a hybrid content model:

- Rich Text JSON for the main service explanation.
- Structured fields for highlights, process steps, and frequently asked questions.
- Explicit publication and SEO controls.

All six existing services will remain visible as cards on the home page and `/services`, but their new detail content will start as draft. A detail URL becomes public only after an administrator publishes it.

## 2. Scope

### Included

- Database migration for service content, publication, SEO, images, and slug history.
- Server-rendered service detail and admin preview routes.
- Full create/edit forms with the same visual language as the article CMS.
- Search, status filtering, preview, publication, unpublication, archive, restore, and draft deletion.
- Confirmation modals for consequential actions.
- Thai slug normalization and permanent redirects from former slugs.
- Service metadata, canonical URL, social metadata, JSON-LD, sitemap entries, and internal-link updates.
- Draft starter content for the six existing services.
- Automated tests, linting, and production build verification.

### Not included

- Location or district landing pages.
- Automatic publication scheduling.
- Public reviews, comments, or user-generated content.
- Separate indexable tag/category pages.
- Automatic AI content generation in the CMS.

## 3. Data Model

### 3.1 `services` extensions

Keep all existing columns and add:

| Column | Type | Purpose |
| --- | --- | --- |
| `content` | `jsonb` | Sanitized Rich Text document for the main body |
| `process_steps` | `jsonb` | Ordered `{ title, description }[]` list |
| `faqs` | `jsonb` | Ordered `{ question, answer }[]` list |
| `image_alt` | `text` | Accessible description of the service cover image |
| `image_public_id` | `text` | Cloudinary identifier for lifecycle management |
| `status` | `service_status` enum | `draft` or `published` |
| `featured` | `boolean` | Editorial prominence control |
| `seo_title` | `text` | Optional title override |
| `seo_description` | `text` | Optional meta-description override |
| `canonical_url` | `text` | Optional same-site canonical override |
| `no_index` | `boolean` | Excludes a published page from indexing and sitemap |
| `published_at` | `timestamp` | First publication date; retained after unpublication |

The existing `features` field remains the structured highlight list for compatibility with the current cards. During implementation it may be parsed through a shared helper rather than changing its storage format in the first migration.

### 3.2 `service_slug_redirects`

Add a table containing:

- `id`
- `service_id` foreign key with cascade delete
- `slug` unique
- `created_at`

Every former published slug is reserved permanently for the same service. A collision check covers both the current `services.slug` values and redirect history. Old slugs cannot be assigned to another service.

### 3.3 Migration behavior

- Existing service rows retain their name, slug, description, price, icon, image, features, archive state, and timestamps.
- Existing rows receive `status = draft`, an empty valid Rich Text document, empty process steps and FAQs, and `no_index = false`.
- The migration does not alter products, articles, bookings, or article-to-service foreign keys.
- Existing non-archived service cards remain publicly visible even though their detail content is draft.

## 4. Publication and URL Lifecycle

The `archived` field controls whether a service remains operational and visible in public service-card lists. The new `status` field controls only whether its detail page is public.

- Draft: visible as an existing service card when not archived, but no public detail page.
- Published: visible as a card and available at `/services/[slug]`.
- Unpublished: returns to draft; the detail route is unavailable and is removed from sitemap.
- Archived: hidden from public service cards and detail pages regardless of publication status.
- Permanent deletion: allowed only if the service has never been published.

Before first publication, an administrator may change the slug normally. After first publication, changing it requires confirmation. The update transaction reserves the old slug in `service_slug_redirects` and writes the new current slug. Requests to a reserved former slug use a server-side permanent redirect to the current URL when the destination service is public. This follows Google Search Central guidance that a permanent server-side redirect is the preferred signal for a permanently moved URL ([redirect guidance](https://developers.google.com/search/docs/crawling-indexing/301-redirects)).

## 5. Public Experience

### 5.1 Service hub

`/services` remains the canonical service hub and continues to show every non-archived service. Cards use the existing image, name, description, price, and highlights.

- Published service: card includes a crawlable link to `/services/[slug]` plus the booking action.
- Draft service: card retains the booking action but does not link to an unavailable detail route.
- Fragment URLs such as `/services#slug` are no longer generated as service destinations.

Home-page service cards follow the same linking rule.

### 5.2 Service detail page

`/services/[slug]` is server-rendered and contains:

1. Breadcrumb navigation.
2. Hero with cover image, service name, short description, and starting price.
3. Highlight list.
4. Sanitized Rich Text body.
5. Ordered service process.
6. Visible FAQ section.
7. Published related articles selected through `articles.relatedServiceId`.
8. Booking CTA with the service preselected when supported by the booking flow.

The route normalizes decoded Thai slugs with Unicode NFKC before querying, matching the proven article-route behavior. A missing, draft, unpublished, no-longer-public, or archived current service returns `notFound()`. An old public slug redirects permanently to the current public slug.

### 5.3 Admin preview

`/admin/services/[id]/preview` renders the same core service presentation without requiring publication. It remains behind the existing admin guard and is marked `noindex`.

## 6. Administration Experience

### 6.1 Service list

`/admin/services` adopts the article-management layout:

- Search by name or slug.
- Filter by all, draft, published, and archived.
- Status badge, image, URL, price, and last-updated date.
- Row actions for edit, preview, publish/unpublish, archive/restore, and eligible draft deletion.

The “เพิ่มบริการ” button expands a full embedded form, not a shortened quick form. The create and edit experiences expose the same fields.

### 6.2 Full form

The form is divided into clear sections:

- Identity: name, slug, short description, price, icon.
- Main content: the existing safe Tiptap editor and JSON renderer used for articles.
- Structured content: editable highlight, process-step, and FAQ rows.
- Media: Cloudinary cover image, public ID, and required alt text when an image exists.
- Presentation: featured flag.
- SEO: title override, description override, canonical override, and noindex.

Saving does not implicitly publish. New services always begin as draft.

### 6.3 Confirmations and feedback

Use the shared `ConfirmModal` for:

- Publish and unpublish.
- Archive and restore.
- Permanent draft deletion.
- Changing a slug after first publication.

Async failures remain visible without discarding form state. Buttons show pending state and prevent duplicate submissions.

## 7. Validation and Security

- Name, description, and slug receive server-side length and presence checks.
- Slugs use the shared Unicode-aware normalization approach and are checked against current and historical slugs.
- Rich Text accepts only the existing allowlisted nodes and marks; arbitrary HTML and scripts are never rendered.
- Image URLs accept only the existing same-site or Cloudinary sources.
- A cover image requires non-empty alt text before publication.
- Canonical overrides accept only paths or HTTPS URLs on `www.c-electronics.online`; query strings and fragments are removed.
- Process and FAQ arrays are bounded in count and field length.
- Publication requires meaningful main content plus a short description, with user-facing validation messages.
- Server actions require the existing administrator guard.

## 8. SEO Behavior

Every public detail page provides:

- Resolved title and description with optional administrator overrides.
- Self-referencing canonical by default.
- Open Graph and Twitter card metadata.
- `index,follow` only when published, non-archived, and not `noIndex`.
- `Service` and `BreadcrumbList` JSON-LD matching visible content.
- `FAQPage` JSON-LD only when the visible FAQ section has valid entries. It is semantic markup and does not imply that Google will display a rich result.

The sitemap contains only current canonical service URLs that are published, non-archived, and indexable. `updatedAt` is used as `lastModified` because it changes with significant content and structured-data edits. Sitemap URLs and page canonicals must agree; Google recommends keeping canonical signals consistent and using accurate significant-update dates ([canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)).

## 9. Queries, Revalidation, and Internal Links

Add shared service query helpers for:

- Public service cards.
- Public service detail by normalized slug.
- Redirect lookup.
- Admin listing and filters.
- Admin editor/preview lookup.
- Sitemap-eligible services.
- Published related articles.

Create/update/publish/unpublish/archive/restore/slug-change actions revalidate:

- `/admin/services`
- `/services`
- Current and previous `/services/[slug]` paths
- `/`
- `/articles` and affected article detail pages where service cards are linked
- `/booking`
- `/sitemap.xml`

Article-related-service cards are changed from `/services#slug` to `/services/[slug]` only when that service detail is public. Otherwise they fall back to `/services` or the booking flow without creating a broken link.

## 10. Draft Starter Content

Prepare six draft records using the existing service image as cover, without publishing them automatically:

1. Air-conditioner installation and repair.
2. CCTV design and installation.
3. Home electrical-system installation and inspection.
4. Satellite-dish installation and signal troubleshooting.
5. Electrical-appliance repair.
6. Electronic-parts sales and selection support.

Each draft should contain service-specific Thai copy, highlights, a realistic process, FAQs, safety boundaries, and a booking CTA. Facts, pricing, service coverage, guarantees, and claims must be reviewed by the shop before publication.

## 11. Testing

### Unit tests

- Thai slug normalization.
- Current and historical slug collision rules.
- Indexability and SEO resolution.
- Canonical sanitization.
- Rich Text and structured-array validation.
- Revalidation path calculation.
- Sitemap inclusion and exclusion.

### Integration/page tests

- Create and edit a draft with the complete form.
- Publish, unpublish, archive, restore, and delete eligibility.
- Admin authorization on actions and preview.
- Published detail page metadata, canonical, JSON-LD, headings, alt text, and related links.
- Draft/archived routes return 404 publicly.
- Former slug returns a permanent redirect to the current public slug.
- No fragment service URLs appear in generated internal links or sitemap.
- Rich Text cannot render script or unsupported URLs.

### Final verification

- Run focused tests first, then the full test suite.
- Run ESLint.
- Run the production build.
- Inspect generated sitemap and representative Thai service URLs.

## 12. Rollout

1. Apply the additive database migration.
2. Deploy query, admin, route, redirect, sitemap, and revalidation changes.
3. Backfill the six draft detail records while retaining public service cards.
4. Review each draft for factual accuracy, price, coverage, and claims.
5. Publish one service at a time.
6. Inspect its canonical, structured data, redirect behavior, and sitemap entry.
7. Use Search Console URL Inspection and resubmit the existing sitemap after the initial rollout.
