export type OptionalEmailProgram =
  | "deadline_reminders"
  | "getting_started"
  | "weekly_digest";

interface UnsubscribePayload {
  v: 1;
  userId: string;
  program: OptionalEmailProgram;
}

const PROGRAMS = new Set<OptionalEmailProgram>([
  "deadline_reminders",
  "getting_started",
  "weekly_digest",
]);

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): Uint8Array | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function signingKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function signature(payload: string, secret: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.sign(
    "HMAC",
    await signingKey(secret),
    new TextEncoder().encode(payload),
  ));
}

function safeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export async function createUnsubscribeToken(
  userId: string,
  program: OptionalEmailProgram,
  secret: string,
): Promise<string> {
  if (!secret) throw new Error("missing_unsubscribe_signing_key");
  const payload = encodeBase64Url(new TextEncoder().encode(JSON.stringify({ v: 1, userId, program })));
  return `${payload}.${encodeBase64Url(await signature(payload, secret))}`;
}

export async function verifyUnsubscribeToken(
  token: string,
  secret: string,
): Promise<UnsubscribePayload | null> {
  if (!secret) return null;
  const [payload, encodedSignature, extra] = token.split(".");
  if (!payload || !encodedSignature || extra) return null;
  const providedSignature = decodeBase64Url(encodedSignature);
  const payloadBytes = decodeBase64Url(payload);
  if (!providedSignature || !payloadBytes || !safeEqual(providedSignature, await signature(payload, secret))) return null;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(payloadBytes)) as Partial<UnsubscribePayload>;
    if (parsed.v !== 1 || typeof parsed.userId !== "string" || !/^[0-9a-f-]{36}$/i.test(parsed.userId)) return null;
    if (!parsed.program || !PROGRAMS.has(parsed.program)) return null;
    return parsed as UnsubscribePayload;
  } catch {
    return null;
  }
}

export async function createUnsubscribeUrl(
  endpoint: string,
  userId: string,
  program: OptionalEmailProgram,
  secret: string,
): Promise<string> {
  const url = new URL(endpoint);
  url.searchParams.set("token", await createUnsubscribeToken(userId, program, secret));
  return url.toString();
}
