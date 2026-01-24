export function formatCanonicalUrl(url: string | URL) {
  const path = url.toString();

  // If there are query params, make sure the URL has no trailing slash,
  // otherwise, canonical URL always has a trailing slash
  return path.replace(/\/?$/, path.includes('?') ? '' : '/');
}

const allImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/content/{blog,caseStudies}/_images/**/*.{png,jpg,jpeg,webp}',
);

export async function resolveImage(path: string | undefined) {
  if (!path) {
    return undefined;
  }

  if (!(path in allImages)) {
    throw new Error(`Image not found! Provided: "${path}", is there a typo?`);
  }

  const { default: image } = await allImages[path]();

  return image;
}
