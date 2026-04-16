import { NextResponse } from "next/server";
import { createClient, resolveModel } from "@/lib/generate";

const EXTRACT_PROMPT = `You are a job listing parser. Given the raw text content of a job listing page, extract structured data.

Return ONLY a JSON object (no markdown, no backticks) with these fields:
- "jobTitle": string (the job title)
- "companyName": string (the company name)
- "description": string (the full job description including responsibilities, requirements, qualifications)
- "hiringManager": string or null (hiring manager name if mentioned)

If a field cannot be determined, use an empty string (or null for hiringManager).
Do NOT include any text outside the JSON object.`;

export async function POST(req: Request) {
  try {
    const { url, apiKey: clientKey } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ message: "Missing URL" }, { status: 400 });
    }

    const apiKey =
      clientKey ??
      process.env.OPENAI_API_KEY ??
      process.env.GEMINI_API_KEY ??
      "";
    if (!apiKey) {
      return NextResponse.json(
        { message: "Missing API key" },
        { status: 400 }
      );
    }

    // Fetch the page HTML server-side
    const pageResponse = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!pageResponse.ok) {
      return NextResponse.json(
        { message: `Failed to fetch URL (${pageResponse.status})` },
        { status: 422 }
      );
    }

    const html = await pageResponse.text();

    // Strip tags to reduce token count — keep only visible text
    const textContent = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12_000);

    if (textContent.length < 50) {
      return NextResponse.json(
        { message: "Could not extract meaningful content from URL" },
        { status: 422 }
      );
    }

    // Use the user's own API key to parse via AI
    const client = createClient(apiKey);
    const model = resolveModel(apiKey, "gpt-4o-mini");

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: EXTRACT_PROMPT },
        { role: "user", content: textContent },
      ],
      temperature: 0.1,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    // Parse JSON from response (handle potential markdown wrapping)
    const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(jsonStr);

    return NextResponse.json({
      jobTitle: parsed.jobTitle ?? "",
      companyName: parsed.companyName ?? "",
      description: parsed.description ?? "",
      hiringManager: parsed.hiringManager ?? null,
    });
  } catch (error) {
    console.error("Scrape-job route failed:", error);
    const message =
      error instanceof SyntaxError
        ? "Failed to parse job listing — try a different URL"
        : "Failed to fetch job details";
    return NextResponse.json({ message }, { status: 500 });
  }
}
