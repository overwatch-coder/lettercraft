import { useState } from "react";
import { Settings } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { CoverLetterForm } from "./components/form/CoverLetterForm";
import { CoverLetterEditor } from "./components/CoverLetterEditor";
import { HistoryPanel } from "./components/HistoryPanel";
import { useApiKeyStore, useDocumentStore } from "./store";
import { CoverLetterFormData } from "./types/form";
import { generateCoverLetter } from "./services/openai";
import { toast } from "react-hot-toast";

function App() {
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { apiKey, setApiKey } = useApiKeyStore();
  const { cvContent, addCoverLetter, coverLetters } = useDocumentStore();

  const handleSubmit = async (
    data: CoverLetterFormData,
    reset?: () => void
  ) => {
    if (!apiKey) {
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        toast.error("Please set your OpenAI API key first");
        setIsApiKeyModalOpen(true);
        return;
      }

      setApiKey(import.meta.env.VITE_OPENAI_API_KEY as string);
    }

    if (!cvContent) {
      toast.error("Please upload your resume first");
      return;
    }

    setIsGenerating(true);
    try {
      const content = await generateCoverLetter(cvContent, data);
      addCoverLetter(content, data.jobTitle, data.language);
      toast.success("Cover letter generated successfully");
      if (reset) {
        reset();
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate cover letter");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-900 to-blue-900 min-h-screen">
      <Toaster position="top-right" />
      <div className="container px-4 py-8 mx-auto">
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center justify-center gap-2 mx-auto">
            <img
              src="/lettercraft.webp"
              alt="LetterCraft"
              className="object-contain w-8 h-8 rounded"
            />

            <h1 className="md:text-3xl text-2xl font-bold text-white">
              LetterCraft - AI Cover Letter Generator
            </h1>
          </div>
          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            className="hover:bg-gray-700 p-2 text-white transition-colors bg-gray-800 rounded-full"
          >
            <Settings className="w-6 h-6" />
          </button>
        </header>

        <div
          className={`grid grid-cols-1 gap-8 ${
            coverLetters.length === 0
              ? "max-w-4xl mx-auto lg:grid-cols-1"
              : "lg:grid-cols-2 "
          }`}
        >
          <CoverLetterForm
            onSubmit={handleSubmit}
            isGenerating={isGenerating}
          />

          {coverLetters.length > 0 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-xl font-semibold text-white">
                Generated Cover Letters
              </h2>

              <div className="flex flex-col gap-4">
                {coverLetters.map((letter) => (
                  <div
                    key={letter.id}
                    className="flex flex-col gap-5 p-4 bg-gray-800 rounded-lg"
                  >
                    <CoverLetterEditor
                      content={letter.content}
                      isGenerating={isGenerating}
                      title={letter.title}
                      letterId={letter.id}
                      letter={letter}
                    />
                  </div>
                ))}
              </div>
              <HistoryPanel />
            </div>
          )}
        </div>

        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
        />
      </div>

      <footer>
        <div className="container flex flex-col gap-3 px-4 py-8 mx-auto">
          <p className="text-white/90 border-t-gray-50/50 pt-3 text-center border-t">
            &copy; {new Date().getFullYear()} LetterCraft. All rights reserved.
          </p>
          <h3 className="text-white/70 text-sm text-center">
            Built with <span className="animate-pulse">❤️</span> by Overwatch
          </h3>
        </div>
      </footer>
    </div>
  );
}

export default App;
