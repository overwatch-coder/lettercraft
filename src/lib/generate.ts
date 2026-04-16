import "server-only";
import OpenAI from "openai";
import type { CoverLetterFormData } from "./types";

export function resolveModel(apiKey: string, requestedModel: string) {
  const provider = apiKey.startsWith("sk-") ? "openai" : "gemini";
  return provider === "gemini"
    ? requestedModel.startsWith("gpt") ? "gemini-2.0-flash" : requestedModel
    : requestedModel.startsWith("gemini") ? "gpt-4o-mini" : requestedModel;
}

export function buildSystemPrompt(keywords: string[]): string {
  const keywordSection =
    keywords.length > 0
      ? `\n\nIMPORTANT — ATS optimisation: The following keywords appear frequently in the job description. Weave as many as naturally possible into the letter without forcing them or keyword-stuffing. Integrate them in context:\n${keywords.join(", ")}`
      : "";

  return `You are an expert cover letter writer. Write compelling, tailored cover letters that are professional, authentic, and ATS-friendly.

Guidelines:
- Open with a strong, engaging hook specific to the role and company
- Highlight 2–3 concrete achievements from the resume that match the job requirements
- Mirror the language and tone of the job description naturally
- Avoid generic phrases like "I am writing to apply for…"
- Close with a confident call to action
- Keep it to one page (≈300–400 words)${keywordSection}`;
}

export function buildUserPrompt(
  input: CoverLetterFormData & { cvContent: string }
): string {
  return [
    `Write a cover letter in ${input.language} with a ${input.tone} tone.`,
    "",
    "== RESUME ==",
    input.cvContent,
    "",
    "== JOB DETAILS ==",
    `Title: ${input.jobTitle}`,
    input.companyName ? `Company: ${input.companyName}` : "",
    input.hiringManager ? `Hiring manager: ${input.hiringManager}` : "",
    "",
    "== JOB DESCRIPTION ==",
    input.description,
    input.additionalNotes ? `\n== ADDITIONAL NOTES ==\n${input.additionalNotes}` : "",
    input.customInstructions ? `\n== CUSTOM INSTRUCTIONS ==\n${input.customInstructions}` : "",
  ]
    .filter((line) => line !== null && line !== undefined)
    .join("\n")
    .trim();
}

/** @deprecated use buildSystemPrompt + buildUserPrompt instead */
export function buildPrompt(
  input: CoverLetterFormData & { cvContent: string },
  keywords: string[] = []
): { system: string; user: string } {
  return {
    system: buildSystemPrompt(keywords),
    user: buildUserPrompt(input),
  };
}

export function createClient(apiKey: string) {
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
    baseURL: apiKey.startsWith("sk-")
      ? undefined
      : "https://generativelanguage.googleapis.com/v1beta/openai/",
  });
}

export function getProvider(apiKey: string) {
  return apiKey.startsWith("sk-") ? "openai" : "gemini";
}

export async function generateLetter(
  input: CoverLetterFormData & { cvContent: string; apiKey?: string | null },
  keywords: string[] = []
) {
  const raw = input.apiKey ?? process.env.OPENAI_API_KEY ?? process.env.GEMINI_API_KEY ?? "";
  const client = createClient(raw || process.env.OPENAI_API_KEY || "dummy");
  const model = resolveModel(raw, input.model);
  const { system, user } = buildPrompt(input, keywords);
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return response.choices[0]?.message?.content ?? "";
}
