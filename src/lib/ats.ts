const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "your", "you",
  "are", "have", "has", "will", "would", "into", "about", "able", "they",
  "their", "our", "was", "were", "not", "but", "can", "all", "when",
  "who", "what", "how", "its", "also", "more", "been", "being",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

/**
 * Extracts the most meaningful keywords from a job description.
 * Used BEFORE generation to inject into the prompt so the AI naturally
 * weaves them in — no second generation pass needed.
 */
export function extractJobKeywords(jobDescription: string, limit = 25): string[] {
  const tokens = tokenize(jobDescription);

  // Count frequency
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) ?? 0) + 1);
  }

  return Array.from(freq.entries())
    .filter(([word]) => word.length > 3) // skip trivially short tokens
    .sort((a, b) => {
      // Primary: frequency (higher = more important)
      // Secondary: length (longer = more domain-specific)
      const freqDiff = b[1] - a[1];
      return freqDiff !== 0 ? freqDiff : b[0].length - a[0].length;
    })
    .slice(0, limit)
    .map(([word]) => word);
}

export function computeAtsScore(jobDescription: string, letterContent: string): number {
  const jobTokens = new Set(tokenize(jobDescription));
  if (!jobTokens.size) return 0;
  const letterTokens = new Set(tokenize(letterContent));
  let matches = 0;
  jobTokens.forEach((token) => { if (letterTokens.has(token)) matches += 1; });
  return Math.round((matches / jobTokens.size) * 100);
}

export type AtsDetails = {
  score: number;
  matched: string[];
  missing: string[];
  tips: string[];
};

export function getAtsDetails(jobDescription: string, letterContent: string): AtsDetails {
  const jobTokens = Array.from(new Set(tokenize(jobDescription)));
  if (!jobTokens.length) return { score: 0, matched: [], missing: [], tips: [] };

  const letterTokenSet = new Set(tokenize(letterContent));
  const matched: string[] = [];
  const missing: string[] = [];

  jobTokens.forEach((token) => {
    if (letterTokenSet.has(token)) matched.push(token);
    else missing.push(token);
  });

  const score = Math.round((matched.length / jobTokens.length) * 100);

  // Prioritise multi-char missing keywords (more meaningful)
  const topMissing = missing
    .filter((w) => w.length > 4)
    .sort((a, b) => b.length - a.length)
    .slice(0, 10);

  const tips: string[] = [];
  if (score < 40) tips.push("Your letter covers fewer than 40% of job keywords — add more role-specific language.");
  if (score >= 40 && score < 70) tips.push("Good start — weave in a few more keywords from the job description naturally.");
  if (score >= 70) tips.push("Strong keyword coverage! Review for context accuracy to avoid keyword stuffing.");
  if (topMissing.length > 0)
    tips.push(`Try including these missing keywords: ${topMissing.slice(0, 5).join(", ")}.`);
  if (missing.some((w) => ["experience", "skills", "team", "lead", "manage", "develop"].includes(w)))
    tips.push("Key action words like 'lead', 'manage', or 'develop' are missing — add them to strengthen impact.");

  return { score, matched: matched.slice(0, 20), missing: topMissing, tips };
}

