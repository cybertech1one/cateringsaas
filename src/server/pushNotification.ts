/**
 * Web Push notification sender using raw fetch() to push service endpoints.
 * Uses VAPID authentication with JWT (RFC 8292) -- no npm dependency needed.
 *
 * If VAPID keys are not configured, push notifications are silently skipped.
 *
 * NOTE: This module reads env vars via process.env directly (not env.mjs)
 * to avoid triggering env validation at import time in test environments.
 */
import { logger } from "~/server/logger";

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Lazily read VAPID keys from process.env.
 */
function getVapidKeys(): { publicKey: string; privateKey: string } | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return null;
  }

  return { publicKey, privateKey };
}

/**
 * Base64url encode a buffer (no padding).
 */
function base64urlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Create a VAPID JWT for the push service audience.
 * This is a minimal ES256 JWT implementation.
 */
async function createVapidJwt(
  audience: string,
  subject: string,
  privateKeyBase64: string,
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  const encodedHeader = base64urlEncode(
    new TextEncoder().encode(JSON.stringify(header)),
  );
  const encodedPayload = base64urlEncode(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Import the private key
  const rawKey = Uint8Array.from(
    atob(privateKeyBase64.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0),
  );

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    rawKey,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsignedToken),
  );

  // Convert DER signature to raw r||s format (64 bytes)
  const sigBytes = new Uint8Array(signature);
  let r: Uint8Array;
  let s: Uint8Array;

  if (sigBytes.length === 64) {
    r = sigBytes.slice(0, 32);
    s = sigBytes.slice(32);
  } else {
    // DER format: 0x30 len 0x02 rLen r 0x02 sLen s
    const rLen = sigBytes[3]!;
    const rStart = 4;
    const rBytes = sigBytes.slice(rStart, rStart + rLen);

    r = rBytes.length > 32 ? rBytes.slice(rBytes.length - 32) : rBytes;

    const sLenIdx = rStart + rLen + 1;
    const sLen = sigBytes[sLenIdx]!;
    const sStart = sLenIdx + 1;
    const sBytes = sigBytes.slice(sStart, sStart + sLen);

    s = sBytes.length > 32 ? sBytes.slice(sBytes.length - 32) : sBytes;
  }

  // Pad r and s to 32 bytes each
  const rawSig = new Uint8Array(64);

  rawSig.set(r, 32 - r.length);
  rawSig.set(s, 64 - s.length);

  const encodedSignature = base64urlEncode(rawSig);

  return `${unsignedToken}.${encodedSignature}`;
}

/**
 * Send a push notification to a single subscription.
 * Returns true if successful, false otherwise.
 */
async function sendPushToSubscription(
  subscription: PushSubscription,
  payload: PushPayload,
): Promise<boolean> {
  const vapid = getVapidKeys();

  if (!vapid) {
    logger.info("VAPID keys not configured, skipping push notification", "push");

    return false;
  }

  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;

    const jwt = await createVapidJwt(
      audience,
      "mailto:support@feastqr.com",
      vapid.privateKey,
    );

    const body = JSON.stringify(payload);

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": String(new TextEncoder().encode(body).length),
        TTL: "86400",
        Authorization: `vapid t=${jwt}, k=${vapid.publicKey}`,
        Urgency: "high",
      },
      body,
    });

    if (response.status === 201 || response.status === 200) {
      logger.info(
        `Push notification sent to ${subscription.endpoint.substring(0, 50)}...`,
        "push",
      );

      return true;
    }

    if (response.status === 410 || response.status === 404) {
      // Subscription expired or invalid -- caller should clean up
      logger.info(
        `Push subscription expired: ${subscription.endpoint.substring(0, 50)}...`,
        "push",
      );

      return false;
    }

    logger.warn(
      `Push notification failed (${response.status}): ${await response.text()}`,
      undefined,
      "push",
    );

    return false;
  } catch (error) {
    logger.error("Failed to send push notification", error, "push");

    return false;
  }
}

/**
 * Send push notifications to all subscriptions for an order.
 * Silently skips if VAPID keys are not configured.
 */
export async function sendOrderStatusPush(
  subscriptions: PushSubscription[],
  payload: PushPayload,
): Promise<void> {
  if (subscriptions.length === 0) return;

  const vapid = getVapidKeys();

  if (!vapid) {
    return;
  }

  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushToSubscription(sub, payload)),
  );

  const succeeded = results.filter(
    (r) => r.status === "fulfilled" && r.value === true,
  ).length;

  logger.info(
    `Push notifications sent: ${succeeded}/${subscriptions.length} succeeded`,
    "push",
  );
}
