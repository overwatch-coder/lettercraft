"use server";

import { generateLetter } from "@/lib/generate";

export async function generateCoverLetterAction(input: Parameters<typeof generateLetter>[0]) {
  return generateLetter(input);
}
