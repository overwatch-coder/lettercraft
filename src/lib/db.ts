import { openDB } from "idb";
import type { CoverLetter, ResumeProfile } from "@/lib/types";

const DB_NAME = "lettercraft-db";
const DB_VERSION = 1;

type SettingRow = { key: string; value: string };

async function db() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("settings")) database.createObjectStore("settings", { keyPath: "key" });
      if (!database.objectStoreNames.contains("coverLetters")) database.createObjectStore("coverLetters", { keyPath: "id" });
      if (!database.objectStoreNames.contains("resumeProfiles")) database.createObjectStore("resumeProfiles", { keyPath: "id" });
    },
  });
}

export async function getSetting(key: string) {
  return (await (await db()).get("settings", key)) as SettingRow | undefined;
}

export async function setSetting(key: string, value: string) {
  await (await db()).put("settings", { key, value });
}

export async function listCoverLetters() {
  return ((await (await db()).getAll("coverLetters")) as CoverLetter[]).sort((a, b) => b.timestamp - a.timestamp);
}

export async function putCoverLetter(letter: CoverLetter) {
  await (await db()).put("coverLetters", letter);
}

export async function deleteCoverLetter(id: string) {
  await (await db()).delete("coverLetters", id);
}

export async function listResumeProfiles() {
  return ((await (await db()).getAll("resumeProfiles")) as ResumeProfile[]).sort((a, b) => b.uploadedAt - a.uploadedAt);
}

export async function putResumeProfile(profile: ResumeProfile) {
  await (await db()).put("resumeProfiles", profile);
}

export async function deleteResumeProfile(id: string) {
  await (await db()).delete("resumeProfiles", id);
}
