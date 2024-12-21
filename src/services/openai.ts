import OpenAI from "openai";
import { useApiKeyStore } from "../store";
import { CoverLetterFormData } from "../types/form";

export const generateCoverLetter = async (
  cvContent: string,
  formData: CoverLetterFormData
) => {
  const apiKey = useApiKeyStore.getState().apiKey;
  if (!apiKey) throw new Error("API key not found");

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const prompt = `You are a professional writer who is an expert at writing cover letters for jobs.
    Create a professional cover letter in ${
      formData.language
    } with the following details:
    
    Resume Content:
    ${cvContent}
    
    Job Details:
    - Title: ${formData.jobTitle}
    ${formData.companyName ? `- Company: ${formData.companyName}` : ""}
    ${formData.city ? `- City: ${formData.city}` : ""}
    ${formData.country ? `- Country: ${formData.country}` : ""}
    ${
      formData.hiringManager
        ? `- Hiring Manager: ${formData.hiringManager}`
        : ""
    }
    
    Job Description:
    ${formData.description}
    
    ${
      formData.additionalNotes
        ? `Additional Notes:\n${formData.additionalNotes}`
        : ""
    }
    
    Please create a well-structured cover letter that:
    1. Addresses the hiring manager if provided
    2. Highlights relevant experience and skills from the resume that match the job requirements
    3. Maintains a ${formData.tone} tone
    4. Is written entirely in ${formData.language}

    NB:
    - If the relevant experience and skills required are not present in the resume, consider trying to make the recruiter know that their other skills and experience are relevant and can help the resume owner acquire the other skills in no time.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error generating cover letter:", error);
    throw error;
  }
};
