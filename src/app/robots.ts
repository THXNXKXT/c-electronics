// ponytail: Next.js generates /robots.txt from this file
export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] },
    sitemap: "https://www.c-electronics.online/sitemap.xml",
  };
}
