import { z } from "zod";

export const AtsKeywordsSchema = z.object({
  keywords: z
    .array(z.string())
    .describe(
      "The most important keywords, hard skills, tools, technologies, certifications, and qualifications from the job description, extracted using the exact wording and phrasing the job description uses (not paraphrased or normalized), ordered from most to least important/frequent, deduplicated, capped at 20 items."
    ),
});

export const AtsEvaluationSchema = z.object({
  score: z.number().min(0).max(100).describe("The overall ATS match score out of 100, based on how many important job description keywords appear in the cover letter, weighted by keyword importance."),
  matched: z.array(z.string()).describe("Important job description keywords that were found in the cover letter, either verbatim or as a clear equivalent phrase."),
  missing: z.array(z.string()).describe("Important job description keywords that are absent from the cover letter and should be worked in."),
  tips: z.array(z.string()).describe("Specific, actionable suggestions for raising the score, each tied to a missing keyword or a concrete weakness in how the letter demonstrates fit."),
});

export type AtsDetails = z.infer<typeof AtsEvaluationSchema>;