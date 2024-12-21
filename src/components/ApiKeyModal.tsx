import React, { useState } from "react";
import { Key, X } from "lucide-react";
import { useApiKeyStore } from "../store";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    apiKey: storedApiKey,
    setApiKey: setStoredApiKey,
    clearApiKey: clearStoredApiKey,
  } = useApiKeyStore();
  const [apiKey, setApiKey] = useState(
    storedApiKey !== null ? storedApiKey : ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredApiKey(apiKey);
    onClose();
  };

  const handleClearApiKey = () => {
    clearStoredApiKey();
    setApiKey("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 bg-gray-900 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Key className="w-5 h-5" />
            Enter OpenAI API Key
          </h2>
          <button
            onClick={onClose}
            className="hover:text-white text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="focus:border-purple-500 focus:outline-none w-full p-2 mb-4 text-white bg-gray-800 border border-gray-700 rounded"
          />
          <div className="flex items-center justify-between gap-3">
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 w-full py-2 text-white transition-opacity rounded"
            >
              Save API Key
            </button>

            <button
              type="button"
              onClick={handleClearApiKey}
              className="bg-gradient-to-r from-red-600 to-blue-600 hover:opacity-90 w-full py-2 text-white transition-opacity rounded"
            >
              Clear API Key
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
