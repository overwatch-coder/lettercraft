import { NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getProviderModel } from "@/lib/ai-provider";
import { AtsEvaluationSchema } from "@/lib/ats";

const RequestSchema = z.object({
  description: z.string().min(1, "Job description is required"),
  letterContent: z.string().min(1, "Letter content is required"),
  provider: z.string().optional(),
  apiKey: z.string().optional().nullable(),
  model: z.string().optional(),
});

const FALLBACK_RESULT = {
  score: 0,
  matched: [],
  missing: [],
  tips: [],
};

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = RequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid request body", ...FALLBACK_RESULT },
        { status: 400 }
      );
    }

    const body = parsed.data;

    const model = getProviderModel({
      provider: body.provider,
      apiKey: body.apiKey || undefined,
      modelName: body.model,
    });

    const { output } = await generateText({
      model,
      temperature: 0.1,
      output: Output.object({ schema: AtsEvaluationSchema }),
      prompt: `You are an ATS (Applicant Tracking System) simulator scoring a cover letter against a job description. Apply the same rubric every time so the same inputs always produce the same score.

Job Description:
${body.description}

Cover Letter:
${body.letterContent}

STEP 1: From the job description, list the important keywords: required skills, tools, technologies, certifications, and qualifications. Classify each as "required" or "preferred" based on how the job description frames it.

STEP 2: For each keyword, check the cover letter for either the exact term or a clear, unambiguous equivalent (e.g. "led a team" counts for "leadership," a named framework counts for "relevant tech stack" only if the framework is actually listed as a requirement). Do not count a vague or generic sentence as a match for a specific keyword.

STEP 3: Score the letter using this weighting, not a flat percentage of keywords found:
- Required keywords matched: heaviest weight. Missing multiple required keywords should cap the score well below 70.
- Preferred keywords matched: moderate weight, can push a strong letter from the 70s into the 80s-90s.
- A letter matching every required keyword but written generically (no specifics, no evidence) should still be capped below 90; keyword presence alone is not full credit.
- A score above 90 requires both near-complete required-keyword coverage and letter content that demonstrates the skills with specifics, not just names them.

STEP 4: Return:
- score: 0-100 per the weighting above
- matched: keywords actually found (exact or clear equivalent)
- missing: important keywords absent from the letter, required keywords listed first
- tips: specific, actionable fixes, each naming the missing keyword or weak spot it addresses and how to work it in using real experience, not generic advice like "add more keywords"`,
    });

    return NextResponse.json(output);
  } catch (error) {
    console.error("ATS evaluation failed:", error);
    return NextResponse.json(
      { message: "Evaluation failed", ...FALLBACK_RESULT },
      { status: 500 }
    );
  }
}