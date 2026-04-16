import { create } from "zustand";
import { decryptString, encryptString } from "./crypto";
import { deleteCoverLetter, deleteResumeProfile, listCoverLetters, listResumeProfiles, putCoverLetter, putResumeProfile, setSetting, getSetting } from "./db";
import type { CoverLetter, ResumeProfile } from "./types";

type AppStore = {
  hydrated: boolean;
  apiKey: string | null;
  cvContent: string | null;
  activeProfile: ResumeProfile | null;
  resumeProfiles: ResumeProfile[];
  coverLetters: CoverLetter[];
  hydrate: () => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  getApiKey: () => Promise<string | null>;
  setCvContent: (value: string | null) => void;
  setActiveProfile: (profile: ResumeProfile | null) => Promise<void>;
  addCoverLetter: (letter: Omit<CoverLetter, "id" | "timestamp">) => Promise<void>;
  updateCoverLetter: (id: string, content: string) => Promise<void>;
  removeCoverLetter: (id: string) => Promise<void>;
  removeResumeProfile: (id: string) => Promise<void>;
};

export const useAppStore = create<AppStore>((set, get) => ({
  hydrated: false,
  apiKey: null,
  cvContent: null,
  activeProfile: null,
  resumeProfiles: [],
  coverLetters: [],
  hydrate: async () => {
    const [letters, profiles, apiKeyRow] = await Promise.all([listCoverLetters(), listResumeProfiles(), getSetting("apiKey")]);
    const activeProfile = profiles[0] ?? null;
    set({
      coverLetters: letters,
      resumeProfiles: profiles,
      activeProfile,
      cvContent: activeProfile?.content ?? null,
      apiKey: apiKeyRow?.value ?? null,
      hydrated: true,
    });
  },
  setApiKey: async (key) => {
    const encrypted = await encryptString(key);
    await setSetting("apiKey", encrypted);
    set({ apiKey: encrypted });
  },
  getApiKey: async () => {
    const current = get().apiKey ?? (await getSetting("apiKey"))?.value ?? null;
    return current ? decryptString(current) : null;
  },
  setCvContent: (value) => set({ cvContent: value }),
  setActiveProfile: async (profile) => {
    if (profile) {
      await putResumeProfile(profile);
      set((state) => {
        const nextProfiles = state.resumeProfiles.filter((item) => item.id !== profile.id);
        nextProfiles.unshift(profile);
        return {
          activeProfile: profile,
          cvContent: profile.content,
          resumeProfiles: nextProfiles,
        };
      });
      return;
    }

    set({ activeProfile: null, cvContent: null });
  },
  addCoverLetter: async (letter) => {
    const record = { ...letter, id: crypto.randomUUID(), timestamp: Date.now() };
    await putCoverLetter(record);
    set((state) => ({ coverLetters: [record, ...state.coverLetters] }));
  },
  updateCoverLetter: async (id, content) => {
    const letter = get().coverLetters.find((item) => item.id === id);
    if (!letter) return;
    const updated = { ...letter, content };
    await putCoverLetter(updated);
    set((state) => ({ coverLetters: state.coverLetters.map((item) => (item.id === id ? updated : item)) }));
  },
  removeCoverLetter: async (id) => {
    await deleteCoverLetter(id);
    set((state) => ({ coverLetters: state.coverLetters.filter((item) => item.id !== id) }));
  },
  removeResumeProfile: async (id) => {
    await deleteResumeProfile(id);
    set((state) => {
      const nextProfiles = state.resumeProfiles.filter((item) => item.id !== id);
      const wasActive = state.activeProfile?.id === id;
      return {
        resumeProfiles: nextProfiles,
        activeProfile: wasActive ? (nextProfiles[0] ?? null) : state.activeProfile,
        cvContent: wasActive ? (nextProfiles[0]?.content ?? null) : state.cvContent,
      };
    });
  },
}));
