import { NextResponse } from "next/server";
import { streamText, createTextStreamResponse } from "ai";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/generate";
import { getProviderModel } from "@/lib/ai-provider";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const keywords = body.keywords || [];
    const model = getProviderModel({
      provider: body.provider,
      apiKey: body.apiKey || undefined,
      modelName: body.model
    });

    // We can use ai sdk's useCompletion, which sends a `prompt` field by default.
    // However, our custom form sends other fields like jobTitle, etc.
    // If we use useCompletion, it passes `prompt`. We should parse the prompt if needed, 
    // but since we send JSON from `useCompletion` (it allows a `body` param), 
    // we can merge `body` and `prompt`.
    const inputForPrompt = { ...body };

    const result = streamText({
      model,
      system: buildSystemPrompt(keywords, inputForPrompt.language),
      prompt: buildUserPrompt(inputForPrompt),
    });

    return createTextStreamResponse({ stream: result.textStream });
  } catch (error) {
    console.error("Generate route failed:", error);
    return NextResponse.json({ message: "Generation failed" }, { status: 500 });
  }
}
