import React, { useState } from "react";
import { FileText, Save } from "lucide-react";
import { useDocumentStore } from "../store";
import PreviewModal from "./PreviewModal";
import { CoverLetter } from "../types";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface CoverLetterEditorProps {
  content: string;
  isGenerating?: boolean;
  title: string;
  letterId: string;
  letter: CoverLetter;
}

export const CoverLetterEditor: React.FC<CoverLetterEditorProps> = ({
  content,
  isGenerating,
  title,
  letterId,
  letter,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editableContent, setEditableContent] = useState(content);
  const [editableTitle, setEditableTitle] = useState(title);
  const updateCoverLetter = useDocumentStore(
    (state) => state.updateCoverLetter
  );

  const handleSave = () => {
    if (!editableContent) return;

    updateCoverLetter(letterId, editableContent, editableTitle);
    setIsModalOpen(false); // Close the modal after saving
  };

  if (!content && !isGenerating) {
    return null;
  }

  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h4 className="font-medium text-white">{letter.title}</h4>
          <p className="py-1 text-sm text-gray-300">
            Language: {letter.language || "English"}
          </p>
          <p className="text-sm text-gray-300">
            {format(new Date(letter.timestamp), "PPP")}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="hover:bg-gray-700 px-4 py-2 text-white transition-colors bg-gray-800 rounded"
          >
            Edit
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(letter.content);
              toast.success("Cover letter copied to clipboard");
            }}
            className="hover:text-white text-gray-400 transition-colors"
          >
            <FileText className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isGenerating && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-b-2 border-purple-500 rounded-full"></div>
        </div>
      )}

      {isModalOpen && (
        <PreviewModal onClose={() => setIsModalOpen(false)}>
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block mb-1 font-medium text-white"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              className="w-full p-2 text-white bg-gray-800 rounded"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="content"
              className="block mb-1 font-medium text-white"
            >
              Content
            </label>
            <textarea
              id="content"
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              className="w-full p-2 text-white bg-gray-800 rounded"
              rows={15}
            ></textarea>
          </div>

          <button
            onClick={handleSave}
            disabled={!editableContent}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 px-4 py-2 text-white transition-opacity rounded"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </PreviewModal>
      )}
    </div>
  );
};
