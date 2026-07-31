import { createHash } from "crypto";

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error(`operation timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([promise, deadline]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

/**
 * Delete a Cloudinary asset by public_id, server-side + signed (sha1).
 * No-op when publicId is empty or env unconfigured — call unconditionally;
 * throws only on a real Cloudinary error so the caller decides best-effort.
 *
 * ponytail: no SDK — signed DELETE is ~15 lines, crypto sha1 is stdlib.
 */
export async function deleteCloudinaryImage(publicId: string | null | undefined) {
  if (!publicId) return;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  // ponytail: not configured → skip cleanup; the DB row remains the source of truth
  if (!cloudName || !apiKey || !apiSecret) return;

  const timestamp = Math.floor(Date.now() / 1000);
  // Cloudinary signature: signable params sorted alphabetically + api_secret, sha1 hex.
  // public_id < timestamp, so this order is correct.
  const signature = createHash("sha1")
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload/${publicId}?signature=${signature}&api_key=${apiKey}&timestamp=${timestamp}`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error(`Cloudinary delete failed (${res.status}): ${await res.text()}`);
}
