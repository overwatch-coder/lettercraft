import React from "react";
import { MessageSquare } from "lucide-react";
import { ToneOption } from "../../types";

interface ToneSelectorProps {
  selectedTone: ToneOption;
  onToneChange: (tone: ToneOption) => void;
}

export const ToneSelector: React.FC<ToneSelectorProps> = ({
  selectedTone,
  onToneChange,
}) => {
  const toneOptions: ToneOption[] = [
    "professional",
    "enthusiastic",
    "confident",
  ];

  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <h3 className="flex items-center gap-2 mb-4 text-xl font-semibold text-white">
        <MessageSquare className="w-5 h-5" />
        Tone
      </h3>
      <div className="flex gap-4">
        {toneOptions.map((tone) => (
          <button
            key={tone}
            type="button"
            onClick={() => onToneChange(tone)}
            className={`px-4 py-2 rounded capitalize ${
              selectedTone === tone
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {tone}
          </button>
        ))}
      </div>
    </div>
  );
};
