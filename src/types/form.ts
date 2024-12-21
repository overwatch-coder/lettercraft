import { z } from "zod";
import { LanguageOption, ToneOption } from "./index";

export const coverLetterFormSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  companyName: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  hiringManager: z.string().optional(),
  description: z.string().min(1, "Job description is required"),
  language: z.custom<LanguageOption>(),
  tone: z.custom<ToneOption>().default("professional"),
  additionalNotes: z.string().optional(),
});

export type CoverLetterFormData = z.infer<typeof coverLetterFormSchema>;
