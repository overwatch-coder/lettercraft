import { NextResponse } from "next/server";
import { z } from "zod";
import { generateText, Output } from "ai";
import { getProviderModel } from "@/lib/ai-provider";
import { AtsKeywordsSchema } from "@/lib/ats";

const RequestSchema = z.object({
  description: z.string().optional(),
  provider: z.string().optional(),
  apiKey: z.string().optional().nullable(),
  model: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = RequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid request body", keywords: [] }, { status: 400 });
    }

    const body = parsed.data;

    if (!body.description || body.description.trim().length === 0) {
      return NextResponse.json({ keywords: [] });
    }

    const model = getProviderModel({
      provider: body.provider,
      apiKey: body.apiKey || undefined,
      modelName: body.model,
    });

    const { output } = await generateText({
      model,
      temperature: 0.2,
      output: Output.object({ schema: AtsKeywordsSchema }),
      prompt: `You are an ATS (Applicant Tracking System) parser. Read the job description below the way an ATS scanner would: it matches literal strings, not meaning.

Extract the keywords, hard skills, tools, technologies, certifications, and qualifications that this job description actually uses. Copy each one using the exact wording found in the text (same casing conventions, same acronym vs. full-name form as written). Do not paraphrase, generalize, or substitute a synonym.

Prioritize:
- Required/must-have skills and tools over nice-to-haves
- Specific technologies, frameworks, and certifications over vague soft skills
- Terms that appear multiple times or in a "requirements" or "qualifications" section

Return them ordered from most to least important, deduplicated, no more than 20 items.

Job Description:
${body.description}`,
    });

    return NextResponse.json(output);
  } catch (error) {
    console.error("ATS keywords extraction failed:", error);
    return NextResponse.json({ message: "Extraction failed", keywords: [] }, { status: 500 });
  }
}