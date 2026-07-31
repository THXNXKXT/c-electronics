import { getServiceRevalidationPaths } from "./services";

export function revalidateServicePages(
  revalidate: (path: string) => void,
  slugs: string[] = [],
  articleSlugs: string[] = [],
) {
  for (const path of getServiceRevalidationPaths(slugs, articleSlugs))
    revalidate(path);
}
