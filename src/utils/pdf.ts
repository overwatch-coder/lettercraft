import pdfToText from "react-pdftotext";

// Extract text from PDF
export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const content = await pdfToText(file);
    return content;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}