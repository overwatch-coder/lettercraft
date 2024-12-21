import React from "react";
import { format } from "date-fns";
import { Trash2, Download } from "lucide-react";
import { useDocumentStore } from "../store";

export const HistoryPanel: React.FC = () => {
  const { coverLetters, removeCoverLetter } = useDocumentStore();

  const handleExport = (content: string, title: string, lang: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}-${lang}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <h3 className="mb-4 text-xl font-semibold text-white">
        History & Downloads
      </h3>
      <div className="space-y-4">
        {coverLetters.map((letter) => (
          <div
            key={letter.id}
            className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
          >
            <div>
              <h4 className="font-medium text-white">{letter.title}</h4>
              <p className="pt-1 text-sm text-gray-400">
                Language: {letter.language || "English"}
              </p>
              <p className="text-sm text-gray-400">
                {format(new Date(letter.timestamp), "PPP")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  handleExport(
                    letter.content,
                    letter.title,
                    letter.language || "English"
                  )
                }
                className="hover:bg-gray-600 p-2 text-white transition-colors bg-gray-700 rounded"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => removeCoverLetter(letter.id)}
                className="hover:bg-red-700 p-2 text-white transition-colors bg-red-600 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
