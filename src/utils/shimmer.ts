/**
 * Generates a shimmer SVG data URL for use as a blur placeholder in Next.js Image.
 *
 * The shimmer is a lightweight animated gradient that provides a pleasant
 * loading experience while the actual image is being fetched and decoded.
 *
 * @param w - Width of the placeholder SVG
 * @param h - Height of the placeholder SVG
 * @returns A base64-encoded data URL string suitable for Next.js Image `blurDataURL`
 */
function shimmerSvg(w: number, h: number): string {
  return `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#e2e8f0" offset="20%" />
      <stop stop-color="#f1f5f9" offset="50%" />
      <stop stop-color="#e2e8f0" offset="80%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#e2e8f0" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1.5s" repeatCount="indefinite" />
</svg>`;
}

function toBase64(str: string): string {
  if (typeof window === "undefined") {
    return Buffer.from(str).toString("base64");
  }

  return window.btoa(str);
}

/**
 * Returns a data URL of a shimmer placeholder SVG.
 *
 * Usage with Next.js Image:
 * ```tsx
 * <Image
 *   src="/photo.jpg"
 *   placeholder="blur"
 *   blurDataURL={shimmerToBase64(400, 300)}
 * />
 * ```
 */
export function shimmerToBase64(w: number, h: number): string {
  return `data:image/svg+xml;base64,${toBase64(shimmerSvg(w, h))}`;
}
