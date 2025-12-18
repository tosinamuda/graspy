"use client";

import { SCHOOL_GRADE_OPTIONS } from "@/lib/GRADE_LEVELS";

import SearchableSelect from "@/components/SearchableSelect";
import { type Country } from "@/lib/locale";

import { StepKey, EducationStatus, GeneratedSubject } from "../types";
import { Dispatch, SetStateAction } from "react";

type Props = {
  currentStep: StepKey;
  autoDetected: {
    country: string;
    language: string;
  };
  country: string;
  setCountry: Dispatch<SetStateAction<string>>;
  allCountries: Country[];
  language: string;
  setLanguage: Dispatch<SetStateAction<string>>;
  countryOptions: {
    value: string;
    label: string;
    group: string;
  }[];
  languageOptions: {
    value: string;
    label: string;
  }[];
  educationStatus: EducationStatus;
  setEducationStatus: Dispatch<SetStateAction<EducationStatus>>;
  knowsGradeLevel: boolean | null;
  setKnowsGradeLevel: Dispatch<SetStateAction<boolean | null>>;
  schoolGrade: string;
  setSchoolGrade: Dispatch<SetStateAction<string>>;
  ageRange: string;
  setAgeRange: Dispatch<SetStateAction<string>>;
  gradeLevel: string;
  setGradeLevel: Dispatch<SetStateAction<string>>;
  setSubjectsSeeded: Dispatch<SetStateAction<boolean>>;
  setSelectedSubjects: Dispatch<SetStateAction<string[]>>;
  subjectsSelectionError: string;
  subjectsStatusMessage: string;
  subjectsError: string | null;
  subjectsLoading: boolean;
  fetchSubjects: () => void;
  availableSubjects: GeneratedSubject[];
  selectedSubjects: string[];
  toggleSubject: (subjectId: string) => void;
};

export default function StepContent({
  currentStep,
  country,
  setCountry,
  allCountries,
  language,
  setLanguage,
  countryOptions,
  languageOptions,
  setEducationStatus,
  setKnowsGradeLevel,
  schoolGrade,
  setSchoolGrade,
  gradeLevel,
  setGradeLevel,
  setSubjectsSeeded,
  setSelectedSubjects,
  subjectsSelectionError,
  subjectsStatusMessage,
  subjectsError,
  subjectsLoading,
  fetchSubjects,
  availableSubjects,
  selectedSubjects,
  toggleSubject,
}: Props) {
  switch (currentStep) {
    case "profile":
      return (
        <div className="flex h-full flex-col gap-8">
          {/* Location Section */}
          <div className="flex flex-col gap-6">
            <SearchableSelect
              id="country"
              value={country}
              onChange={(value) => {
                setCountry(value);
                const newCountry = allCountries.find((c) => c.code === value);

                if (newCountry) {
                  const defaultLanguage = newCountry.languages[0] || "";
                  setLanguage(defaultLanguage);
                }
              }}
              options={countryOptions}
              placeholder="Search or select your country..."
              label="Where are you learning from?"
              className="rounded-2xl border border-sky-100 bg-white px-5 py-4 text-base font-medium text-slate-900 shadow-[0_10px_30px_rgba(15,78,138,0.08)] transition focus:border-sky-400 focus:ring-0"
            />

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                What language do you want to learn in?
              </label>
              <SearchableSelect
                id="language"
                value={language}
                onChange={(value) => {
                  setLanguage(value);
                }}
                options={languageOptions}
                placeholder="Select language..."
                disabled={!country}
                className="rounded-2xl border border-sky-100 bg-white px-5 py-4 text-base font-medium text-slate-900 shadow-[0_10px_30px_rgba(15,78,138,0.08)] transition focus:border-sky-400 focus:ring-0 disabled:bg-slate-100"
              />
              {!country && (
                <p className="mt-2 text-sm text-slate-500">
                  Select a country to see popular languages.
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-200" />

          {/* Level Section */}
          <div className="flex flex-col gap-4">
            <label className="block text-sm font-semibold text-slate-700">
              Which grade are you in?
            </label>
            <SearchableSelect
              id="grade"
              value={schoolGrade}
              onChange={(value) => {
                setEducationStatus("in_school");
                setSchoolGrade(value);
                setKnowsGradeLevel(true);

                const selectedOption = SCHOOL_GRADE_OPTIONS.find(
                  (o) => o.value === value
                );
                if (
                  selectedOption &&
                  gradeLevel !== selectedOption.gradeLevel
                ) {
                  setGradeLevel(selectedOption.gradeLevel);
                  setSubjectsSeeded(false);
                  setSelectedSubjects([]);
                }
              }}
              options={SCHOOL_GRADE_OPTIONS.map((option) => ({
                value: option.value,
                label: `${option.label} (${option.description})`,
                group:
                  option.gradeLevel.charAt(0).toUpperCase() +
                  option.gradeLevel.slice(1) +
                  " School Level", // Simple grouping or map from GRADE_LEVELS if imported
              }))}
              placeholder="Select your grade..."
              className="rounded-2xl border border-sky-100 bg-white px-5 py-4 text-base font-medium text-slate-900 shadow-[0_10px_30px_rgba(15,78,138,0.08)] transition focus:border-sky-400 focus:ring-0"
            />
          </div>
        </div>
      );

    case "subjects":
      return (
        <div className="flex h-full min-h-0 flex-col gap-3 sm:gap-4">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <span>Subjects</span>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-600">
              Scroll to explore
            </span>
          </div>

          {subjectsSelectionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              {subjectsSelectionError}
            </div>
          )}

          {subjectsStatusMessage && !subjectsError && (
            <div className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700">
              {subjectsStatusMessage}
            </div>
          )}

          <div className="relative flex-1 min-h-0 rounded-2xl border border-slate-200 bg-white/90">
            {!subjectsLoading && !subjectsError && (
              <>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-6 rounded-t-[1rem] bg-gradient-to-b from-white via-white/70 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-[1rem] bg-gradient-to-t from-white via-white/80 to-transparent" />
              </>
            )}
            <div className="absolute inset-0 overflow-y-auto px-2 py-3">
              {subjectsError ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <p className="text-sm text-slate-600">{subjectsError}</p>
                  <button
                    type="button"
                    onClick={() => fetchSubjects()}
                    disabled={subjectsLoading}
                    className="rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-400 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Try again
                  </button>
                </div>
              ) : subjectsLoading ? (
                <div className="space-y-2 pr-1">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={`subject-skeleton-${index}`}
                      className="h-11 rounded-lg border border-slate-200 bg-slate-100/70 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5 pr-1">
                  {availableSubjects.map((subject) => {
                    const isActive = selectedSubjects.includes(subject.id);
                    return (
                      <button
                        key={subject.id}
                        type="button"
                        disabled={subjectsLoading}
                        onClick={() => toggleSubject(subject.id)}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition ${
                          isActive
                            ? "border-sky-400 bg-sky-50 text-sky-800"
                            : "border-slate-200 bg-white hover:border-sky-300 hover:bg-slate-50"
                        } ${
                          subjectsLoading ? "cursor-not-allowed opacity-70" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-semibold ${
                              isActive ? "text-sky-700" : "text-slate-900"
                            }`}
                          >
                            {subject.label}
                          </span>
                          {subject.recommended && (
                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-600">
                              Recommended
                            </span>
                          )}
                        </div>
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
                            isActive
                              ? "border-sky-500 bg-sky-500 text-white"
                              : "border-slate-300 text-slate-400"
                          }`}
                        >
                          {isActive ? "✓" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="h-0" aria-hidden />
        </div>
      );

    default:
      return null;
  }
}
