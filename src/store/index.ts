import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ApiKeyStore, DocumentStore } from "../types";

export const useApiKeyStore = create<ApiKeyStore>()(
  persist(
    (set) => ({
      apiKey: null,
      setApiKey: (key) => set({ apiKey: key }),
      clearApiKey: () => set({ apiKey: null }),
    }),
    {
      name: "api-key-storage",
    }
  )
);

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set) => ({
      cvContent: null,
      setCvContent: (content) => set({ cvContent: content }),
      coverLetters: [],
      addCoverLetter: (letter, title, lang) =>
        set((state) => ({
          coverLetters: [
            ...state.coverLetters,
            {
              content: letter,
              id: crypto.randomUUID(),
              title,
              timestamp: Date.now(),
              language: lang || "English",
            },
          ],
        })),
      removeCoverLetter: (id) =>
        set((state) => ({
          coverLetters: state.coverLetters.filter((letter) => letter.id !== id),
        })),
      updateCoverLetter: (id, content, title) =>
        set((state) => ({
          coverLetters: state.coverLetters.map((letter) =>
            letter.id === id ? { ...letter, content, title } : letter
          ),
        })),
    }),
    {
      name: "document-storage",
    }
  )
);
