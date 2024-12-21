import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatFileSize } from "../../utils/format";
import { extractTextFromPDF } from "../../utils/pdf";

interface FileUploadProps {
  onFileAccepted: (content: string) => void;
  onFileRemoved: () => void;
  currentFile: File | null;
  setCurrentFile: (file: File | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileAccepted,
  onFileRemoved,
  currentFile,
  setCurrentFile,
}) => {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setCurrentFile(file);

      try {
        const text = await extractTextFromPDF(file);
        onFileAccepted(text);
        toast.success("Resume uploaded successfully");
      } catch (error) {
        toast.error("Failed to read PDF file");
        console.error("Error reading PDF:", error);
      }
    },
    [onFileAccepted, setCurrentFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      if (error?.code === "file-too-large") {
        toast.error("File is too large. Maximum size is 5MB");
      } else if (error?.code === "file-invalid-type") {
        toast.error("Only PDF files are accepted");
      } else {
        toast.error("Invalid file");
      }
    },
  });

  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <h3 className="flex items-center gap-2 mb-4 text-xl font-semibold text-white">
        <FileText className="w-5 h-5" />
        Resume Upload
      </h3>

      {currentFile ? (
        <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-purple-500" />
            <div>
              <p className="font-medium text-white">{currentFile.name}</p>
              <p className="text-sm text-gray-400">
                {formatFileSize(currentFile.size)}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onFileRemoved();
              toast.success("Resume removed");
            }}
            className="hover:bg-gray-700 p-2 transition-colors rounded-full"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-purple-500 bg-purple-500 bg-opacity-10"
              : "border-gray-700 hover:border-purple-500"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-300">
            {isDragActive
              ? "Drop your resume here..."
              : "Drag & drop your resume, or click to select"}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Only PDF files are supported (max 5MB)
          </p>
        </div>
      )}
    </div>
  );
};
