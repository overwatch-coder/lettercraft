import { z } from "zod";

export const coverLetterFormSchema = z.object({
  jobTitle: z.string().min(1),
  companyName: z.string().optional(),
  description: z.string().min(1),
  language: z.enum(["English", "Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Chinese", "Japanese", "Korean"]),
  tone: z.enum(["professional", "enthusiastic", "confident"]),
  model: z.enum(["gpt-4o-mini", "gpt-4o", "gemini-2.0-flash", "gemini-1.5-pro"]),
  hiringManager: z.string().optional(),
  additionalNotes: z.string().optional(),
  customInstructions: z.string().optional(),
});

export type CoverLetterFormData = z.infer<typeof coverLetterFormSchema>;

export type ResumeProfile = {
  id: string;
  name: string;
  content: string;
  uploadedAt: number;
};

export type CoverLetter = {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  language: string;
  tone: string;
  model: string;
  jobTitle: string;
  companyName?: string;
  hiringManager?: string;
  jobDescription: string;
  additionalNotes?: string;
  customInstructions?: string;
  resumeProfileId: string | null;
};
