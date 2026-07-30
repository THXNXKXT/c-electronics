export function revalidateServicePages(
  revalidate: (path: string) => void,
) {
  for (const path of ["/admin/services", "/", "/services", "/booking"]) {
    revalidate(path);
  }
}
