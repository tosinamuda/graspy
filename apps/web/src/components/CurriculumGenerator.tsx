"use client";

import { useCurriculum } from "@/hooks/useCurriculum";
import { getCountryName, getLanguageInfo } from "@/lib/locale";

interface CurriculumGeneratorProps {
  country: string;
  language: string;
}

export default function CurriculumGenerator({
  country,
  language,
}: CurriculumGeneratorProps) {
  const { data, loading, error, generateWithStream } = useCurriculum();

  const handleGenerate = async () => {
    await generateWithStream({ country, language });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Generate Curriculum
        </h2>
        <p className="text-gray-600">
          AI-powered curriculum for {getCountryName(country)} in{" "}
          {getLanguageInfo(language).nativeName}
        </p>
      </div>

      {!data && !loading && (
        <button
          onClick={handleGenerate}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Generate Subjects
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">
            {data?.currentStep || "Generating..."}
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {data && data.subjects.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Generated Subjects
            </h3>
            <span className="text-sm text-gray-500">
              {data.subjects.length}{" "}
              {data.subjects.length === 1 ? "subject" : "subjects"}
            </span>
          </div>
          <div className="grid gap-3">
            {data.subjects.map((subject, index) => (
              <div
                key={subject.slug || index}
                className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg"
              >
                <p className="font-medium text-indigo-900">{subject.name}</p>
              </div>
            ))}
          </div>
          <button
            onClick={handleGenerate}
            className="w-full px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
          >
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}
