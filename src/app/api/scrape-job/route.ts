import { NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getProviderModel } from "@/lib/ai-provider";

const MAX_RESPONSE_BYTES = 5_000_000; // 5MB
const FETCH_TIMEOUT_MS = 15_000;
const DEFAULT_MODEL = "gpt-4o-mini";

// Blocks the common SSRF targets: loopback, link-local/metadata, and RFC1918 private ranges
// when the hostname is a literal IP. This does not resolve DNS, so a hostname that
// resolves to an internal IP (DNS rebinding) is not caught here; if that risk matters for
// your deployment, resolve the hostname server-side and check the resolved IP before fetching.
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();

  if (h === "localhost" || h === "0.0.0.0" || h === "::1" || h === "[::1]") return true;

  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 127) return true; // loopback
    if (a === 10) return true; // private
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
  }

  return false;
}

function parseSafeUrl(raw: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  if (isBlockedHost(parsed.hostname)) return null;

  return parsed;
}

function extractJsonLdJobPosting(html: string): Record<string, unknown> | null {
  const scriptMatches = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  for (const match of scriptMatches) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const candidate of candidates) {
        const type = candidate?.["@type"];
        const types = Array.isArray(type) ? type : [type];
        if (types.includes("JobPosting")) return candidate;
      }
    } catch {
      // Malformed JSON-LD block; skip it and keep looking.
      continue;
    }
  }

  return null;
}

function htmlToVisibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, apiKey: clientKey, provider: clientProvider, model: clientModel } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ message: "Missing URL" }, { status: 400 });
    }

    const safeUrl = parseSafeUrl(url);
    if (!safeUrl) {
      return NextResponse.json({ message: "URL is not allowed" }, { status: 400 });
    }

    const model = getProviderModel({
      provider: clientProvider,
      apiKey: clientKey || undefined,
      modelName: clientModel || DEFAULT_MODEL,
    });

    const pageResponse = await fetch(safeUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!pageResponse.ok) {
      return NextResponse.json(
        { message: `Failed to fetch URL (${pageResponse.status})` },
        { status: 422 }
      );
    }

    const contentType = pageResponse.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return NextResponse.json(
        { message: "URL did not return an HTML page" },
        { status: 422 }
      );
    }

    const contentLength = pageResponse.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) {
      return NextResponse.json({ message: "Page is too large to process" }, { status: 422 });
    }

    const html = await pageResponse.text();
    if (html.length > MAX_RESPONSE_BYTES) {
      return NextResponse.json({ message: "Page is too large to process" }, { status: 422 });
    }

    // Prefer structured schema.org JobPosting data when the page provides it; it's exact,
    // rather than the plain-text extraction being a lossy fallback.
    const jsonLd = extractJsonLdJobPosting(html);
    const structuredHint = jsonLd
      ? `\n\nSTRUCTURED DATA FOUND ON PAGE (schema.org JobPosting, treat as ground truth where present):\n${JSON.stringify(
        jsonLd
      ).slice(0, 6_000)}`
      : "";

    const textContent = htmlToVisibleText(html).slice(0, 12_000);

    if (textContent.length < 50 && !jsonLd) {
      return NextResponse.json(
        { message: "Could not extract meaningful content from URL" },
        { status: 422 }
      );
    }

    const { output } = await generateText({
      model,
      output: Output.object({
        schema: z.object({
          jobTitle: z.string().describe("The job title"),
          companyName: z.string().describe("The company name"),
          description: z
            .string()
            .describe(
              "The full job description including responsibilities, requirements, and qualifications. Exclude site navigation, cookie notices, unrelated listings, and footer boilerplate."
            ),
          hiringManager: z
            .string()
            .nullable()
            .describe("Hiring manager name only if explicitly mentioned on the page, otherwise null. Do not guess."),
        }),
      }),
      prompt: `Extract the job listing data from the page content below. If structured data is provided, treat it as the most reliable source and use the visible text only to fill in gaps.${structuredHint}\n\nPAGE TEXT:\n${textContent}`,
      temperature: 0.1,
    });

    return NextResponse.json({
      jobTitle: output.jobTitle ?? "",
      companyName: output.companyName ?? "",
      description: output.description ?? "",
      hiringManager: output.hiringManager ?? null,
    });
  } catch (error) {
    console.error("Scrape-job route failed:", error);
    return NextResponse.json(
      { message: "Failed to fetch job details or parse job listing" },
      { status: 500 }
    );
  }
}