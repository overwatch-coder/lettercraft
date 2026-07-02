import { create } from "zustand";
import { decryptString, encryptString } from "./crypto";
import { deleteCoverLetter, deleteResumeProfile, listCoverLetters, listResumeProfiles, putCoverLetter, putResumeProfile, setSetting, getSetting } from "./db";
import type { CoverLetter, ResumeProfile } from "./types";
import type { AtsDetails } from "./ats";

export const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-5.4-mini",
  google: "gemini-2.0-flash",
  anthropic: "claude-3-5-sonnet-latest",
  xai: "grok-2-latest",
  groq: "openai/gpt-oss-120b",
};

type AppStore = {
  hydrated: boolean;
  activeProvider: string;
  apiKeys: Record<string, string>;
  providerModels: Record<string, string>;
  cvContent: string | null;
  activeProfile: ResumeProfile | null;
  resumeProfiles: ResumeProfile[];
  coverLetters: CoverLetter[];
  hydrate: () => Promise<void>;
  setActiveProvider: (provider: string) => Promise<void>;
  setApiKey: (provider: string, key: string) => Promise<void>;
  getApiKey: (provider: string) => Promise<string | null>;
  setProviderModel: (provider: string, model: string) => Promise<void>;
  setCvContent: (value: string | null) => void;
  setActiveProfile: (profile: ResumeProfile | null) => Promise<void>;
  addResumeProfile: (profile: ResumeProfile) => Promise<void>;
  addCoverLetter: (letter: Omit<CoverLetter, "id" | "timestamp">) => Promise<void>;
  updateCoverLetter: (id: string, content: string) => Promise<void>;
  updateCoverLetterAts: (id: string, atsEvaluation: AtsDetails) => Promise<void>;
  removeCoverLetter: (id: string) => Promise<void>;
  removeResumeProfile: (id: string) => Promise<void>;
};

export const useAppStore = create<AppStore>((set, get) => ({
  hydrated: false,
  activeProvider: "openai",
  apiKeys: {},
  providerModels: { ...DEFAULT_MODELS },
  cvContent: null,
  activeProfile: null,
  resumeProfiles: [],
  coverLetters: [],
  hydrate: async () => {
    const [letters, profiles, activeProvRow, keysRow, modelsRow] = await Promise.all([
      listCoverLetters(),
      listResumeProfiles(),
      getSetting("activeProvider"),
      getSetting("apiKeys"),
      getSetting("providerModels")
    ]);
    const activeProfile = profiles[0] ?? null;

    let apiKeys = {};
    try {
      if (keysRow?.value) apiKeys = JSON.parse(keysRow.value);
    } catch (e) { }

    let providerModels = { ...DEFAULT_MODELS };
    try {
      if (modelsRow?.value) providerModels = { ...DEFAULT_MODELS, ...JSON.parse(modelsRow.value) };
    } catch (e) { }

    // Support legacy "apiKey" migration
    if (Object.keys(apiKeys).length === 0) {
      const legacyKey = await getSetting("apiKey");
      if (legacyKey?.value) {
        apiKeys = { openai: legacyKey.value };
      }
    }

    // Migrate old letter titles
    const migratedLetters = letters.map((letter) => {
      if (letter.companyName && letter.title === letter.jobTitle) {
        return {
          ...letter,
          title: `${letter.jobTitle || "Untitled Position"} at ${letter.companyName}`,
        };
      }
      return letter;
    });

    set({
      coverLetters: migratedLetters,
      resumeProfiles: profiles,
      activeProfile,
      cvContent: activeProfile?.content ?? null,
      activeProvider: activeProvRow?.value ?? "openai",
      apiKeys,
      providerModels,
      hydrated: true,
    });
  },
  setActiveProvider: async (provider) => {
    await setSetting("activeProvider", provider);
    set({ activeProvider: provider });
  },
  setApiKey: async (provider, key) => {
    const encrypted = await encryptString(key);
    const newKeys = { ...get().apiKeys, [provider]: encrypted };
    await setSetting("apiKeys", JSON.stringify(newKeys));
    set({ apiKeys: newKeys });
  },
  getApiKey: async (provider) => {
    const current = get().apiKeys[provider];
    if (!current) return null;
    return decryptString(current);
  },
  setProviderModel: async (provider, model) => {
    const newModels = { ...get().providerModels, [provider]: model };
    await setSetting("providerModels", JSON.stringify(newModels));
    set({ providerModels: newModels });
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
  addResumeProfile: async (profile) => {
    await putResumeProfile(profile);
    set((state) => ({
      resumeProfiles: [profile, ...state.resumeProfiles],
    }));
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
    delete updated.atsEvaluation;
    await putCoverLetter(updated);
    set((state) => ({ coverLetters: state.coverLetters.map((item) => (item.id === id ? updated : item)) }));
  },
  updateCoverLetterAts: async (id, atsEvaluation) => {
    const letter = get().coverLetters.find((item) => item.id === id);
    if (!letter) return;
    const updated = { ...letter, atsEvaluation };
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
