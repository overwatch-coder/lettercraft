import React from 'react';
import { Globe2 } from 'lucide-react';
import { LanguageOption } from '../../types';

interface LanguageSelectorProps {
  value: LanguageOption;
  onChange: (language: LanguageOption) => void;
  error?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  value,
  onChange,
  error
}) => {
  const languages: LanguageOption[] = [
    'English',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Dutch',
    'Chinese',
    'Japanese',
    'Korean',
  ];

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Globe2 className="w-5 h-5" />
        Language
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {languages.map((language) => (
          <button
            key={language}
            type="button"
            onClick={() => onChange(language)}
            className={`px-4 py-2 rounded ${
              value === language
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {language}
          </button>
        ))}
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};