import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, Building2, MapPin, User, FileText } from "lucide-react";
import { coverLetterFormSchema, CoverLetterFormData } from "../../types/form";
import { FileUpload } from "./FileUpload";
import { LanguageSelector } from "../controls/LanguageSelector";
import { useDocumentStore } from "../../store";
import { ToneSelector } from "../controls/ToneSelector";

interface CoverLetterFormProps {
  onSubmit: (data: CoverLetterFormData, reset?: () => void) => void;
  isGenerating: boolean;
}

export const CoverLetterForm: React.FC<CoverLetterFormProps> = ({
  onSubmit,
  isGenerating,
}) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid },
  } = useForm<CoverLetterFormData>({
    resolver: zodResolver(coverLetterFormSchema),
    mode: "onChange",
    defaultValues: {
      language: "English",
    },
  });

  const { cvContent, setCvContent } = useDocumentStore();
  const [currentFile, setCurrentFile] = React.useState<File | null>(null);

  const handleFileAccepted = (content: string) => {
    setCvContent(content);
  };

  const handleFileRemoved = () => {
    setCvContent(null);
    setCurrentFile(null);
  };

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmit(data, () => {
          reset();
          setCurrentFile(null);
        })
      )}
      className="space-y-6"
    >
      <FileUpload
        onFileAccepted={handleFileAccepted}
        onFileRemoved={handleFileRemoved}
        currentFile={currentFile}
        setCurrentFile={setCurrentFile}
      />

      <div className="p-6 space-y-4 bg-gray-900 rounded-lg">
        <div>
          <label className="flex items-center gap-2 mb-2 text-white">
            <Briefcase className="w-4 h-4" />
            Job Title *
          </label>
          <input
            {...register("jobTitle")}
            className="focus:border-purple-500 focus:outline-none w-full p-2 text-white bg-gray-800 border border-gray-700 rounded"
            placeholder="Senior Software Engineer"
          />
          {errors.jobTitle && (
            <p className="mt-1 text-sm text-red-500">
              {errors.jobTitle.message}
            </p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 mb-2 text-white">
            <Building2 className="w-4 h-4" />
            Company Name
          </label>
          <input
            {...register("companyName")}
            className="focus:border-purple-500 focus:outline-none w-full p-2 text-white bg-gray-800 border border-gray-700 rounded"
            placeholder="Acme Inc."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 mb-2 text-white">
              <MapPin className="w-4 h-4" />
              City
            </label>
            <input
              {...register("city")}
              className="focus:border-purple-500 focus:outline-none w-full p-2 text-white bg-gray-800 border border-gray-700 rounded"
              placeholder="San Francisco"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 mb-2 text-white">
              <MapPin className="w-4 h-4" />
              Country
            </label>
            <input
              {...register("country")}
              className="focus:border-purple-500 focus:outline-none w-full p-2 text-white bg-gray-800 border border-gray-700 rounded"
              placeholder="United States"
            />
          </div>
        </div>

        <div className="hidden">
          <label className="flex items-center gap-2 mb-2 text-white">
            <User className="w-4 h-4" />
            Hiring Manager
          </label>
          <input
            {...register("hiringManager")}
            className="focus:border-purple-500 focus:outline-none w-full p-2 text-white bg-gray-800 border border-gray-700 rounded"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 mb-2 text-white">
            <FileText className="w-4 h-4" />
            Job Description *
          </label>
          <textarea
            {...register("description")}
            className="focus:border-purple-500 focus:outline-none w-full h-48 p-2 text-white bg-gray-800 border border-gray-700 rounded"
            placeholder="Paste the job description here..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="hidden">
          <label className="flex items-center gap-2 mb-2 text-white">
            <FileText className="w-4 h-4" />
            Additional Notes
          </label>
          <textarea
            {...register("additionalNotes")}
            className="focus:border-purple-500 focus:outline-none w-full h-24 p-2 text-white bg-gray-800 border border-gray-700 rounded"
            placeholder="Any additional information you'd like to include..."
          />
        </div>
      </div>

      <Controller
        name="language"
        control={control}
        render={({ field }) => (
          <LanguageSelector
            value={field.value}
            onChange={field.onChange}
            error={errors.language?.message}
          />
        )}
      />

      <Controller
        name="tone"
        control={control}
        render={({ field }) => (
          <ToneSelector
            selectedTone={field.value}
            onToneChange={field.onChange}
          />
        )}
      />

      <button
        type="submit"
        disabled={!isValid || !cvContent || isGenerating}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed w-full py-3 font-medium text-white transition-opacity rounded"
      >
        {isGenerating ? "Generating..." : "Generate Cover Letter"}
      </button>
    </form>
  );
};
