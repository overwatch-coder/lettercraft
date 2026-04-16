import { getSetting, setSetting } from "./db";

const MASTER_KEY_NAME = "masterKey";

function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

async function getMasterKey() {
  const existing = await indexedDBKey();
  if (existing) return existing;
  const keyBytes = crypto.getRandomValues(new Uint8Array(32));
  const encoded = toBase64(keyBytes);
  await setSetting(MASTER_KEY_NAME, encoded);
  return encoded;
}

async function indexedDBKey() {
  const row = await getSetting(MASTER_KEY_NAME);
  return row?.value ?? null;
}

async function deriveKeyMaterial() {
  const master = await getMasterKey();
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(master), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: new TextEncoder().encode("lettercraft"), iterations: 100000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptString(value: string) {
  const key = await deriveKeyMaterial();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value));
  return `${toBase64(iv)}.${toBase64(new Uint8Array(cipher))}`;
}

export async function decryptString(payload: string) {
  const [ivB64, dataB64] = payload.split(".");
  const key = await deriveKeyMaterial();
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(ivB64) }, key, fromBase64(dataB64));
  return new TextDecoder().decode(plain);
}
