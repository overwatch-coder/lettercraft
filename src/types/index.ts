export type LanguageOption =
  | "English"
  | "Spanish"
  | "French"
  | "German"
  | "Italian"
  | "Portuguese"
  | "Dutch"
  | "Chinese"
  | "Japanese"
  | "Korean";

export type ToneOption = "professional" | "enthusiastic" | "confident";

export interface GenerationOptions {
  tone: ToneOption;
  language: LanguageOption;
}

export interface ApiKeyStore {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
}

export interface DocumentStore {
  cvContent: string | null;
  setCvContent: (content: string | null) => void;
  addCoverLetter: (content: string, title: string, lang?: string) => void;
  removeCoverLetter: (id: string) => void;
  coverLetters: CoverLetter[];
  updateCoverLetter: (id: string, content: string, title: string) => void;
}

export interface CoverLetter {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  language: string;
}
