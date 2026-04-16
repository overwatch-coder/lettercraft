import { NextResponse } from "next/server";
import { buildSystemPrompt, buildUserPrompt, createClient, resolveModel } from "@/lib/generate";
import { extractJobKeywords } from "@/lib/ats";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiKey = body.apiKey ?? process.env.OPENAI_API_KEY ?? process.env.GEMINI_API_KEY ?? "";
    if (!apiKey) {
      return NextResponse.json({ message: "Missing API key" }, { status: 400 });
    }

    // Extract ATS keywords from the job description BEFORE generating.
    // Injecting them into the system prompt means the AI weaves them in
    // naturally on the first pass — no costly re-generation needed.
    const keywords = extractJobKeywords(body.description ?? "", 25);

    const client = createClient(apiKey);
    const model = resolveModel(apiKey, body.model);

    const stream = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: buildSystemPrompt(keywords) },
        { role: "user", content: buildUserPrompt(body) },
      ],
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content ?? "";
            if (token) controller.enqueue(encoder.encode(token));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Generate route failed:", error);
    return NextResponse.json({ message: "Generation failed" }, { status: 500 });
  }
}
