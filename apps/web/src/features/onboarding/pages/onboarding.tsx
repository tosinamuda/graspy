"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import CurriculumReadyView from "../components/curriculum-ready-view";
import GenerationProgressView from "../components/generation-progress-view";
import StepContent from "../components/onboarding-steps";
import { STEP_TITLES, STEP_DESCRIPTIONS } from "../constants";
import useOnboarding from "../hooks/useOnboarding";

export default function OnboardingPage() {
  const {
    isClient,
    autoDetected,
    stepIndex,
    country,
    setCountry,
    language,
    setLanguage,
    educationStatus,
    setEducationStatus,
    knowsGradeLevel,
    setKnowsGradeLevel,
    schoolGrade,
    setSchoolGrade,
    ageRange,
    setAgeRange,
    gradeLevel,
    setGradeLevel,
    selectedSubjects,
    setSelectedSubjects,
    setSubjectsSeeded,
    allCountries,
    isCompleting,
    availableSubjects,
    subjectsLoading,
    subjectsError,
    steps,
    currentStep,
    countryOptions,
    languageOptions,
    subjectsStatusMessage,
    subjectsSelectionError,
    completionPhase,
    generationStep,
    generationStats,
    generationError,
    generationCompletedAt,
    selectedSubjectNames,
    fetchSubjects,
    progressPercent,
    canProceed,
    handleGenerationReset,
    handleRetryGeneration,
    handleContinueToDashboard,
    handleNext,
    handleBack,
    toggleSubject,
  } = useOnboarding();

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl max-w-2xl w-full p-8">
          <div className="text-center">
            <div className="animate-pulse space-y-3">
              <div className="h-8 bg-slate-200 rounded w-3/4 mx-auto" />
              <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (completionPhase === "generating") {
    return (
      <GenerationProgressView
        subjects={selectedSubjectNames}
        step={generationStep}
        error={generationError}
        onRetry={handleRetryGeneration}
        onBack={handleGenerationReset}
        isRetrying={isCompleting}
      />
    );
  }

  if (completionPhase === "ready" && generationStats) {
    return (
      <CurriculumReadyView
        stats={generationStats}
        subjects={selectedSubjectNames}
        generatedAt={generationCompletedAt}
        onContinue={handleContinueToDashboard}
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-[#E8F3FF] via-white to-[#D3E8FF]">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-128 w-lg -translate-x-1/2 rounded-full bg-sky-200/45 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-48 right-[-15%] size-136 rounded-full bg-sky-300/30 blur-[140px]"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-2">
          <div className="text-2xl font-semibold tracking-tight text-slate-900">
            graspy
          </div>
          <a
            href="mailto:hello@graspy.org"
            className="text-base font-medium text-sky-600 transition hover:text-sky-700"
          >
            Contact
          </a>
        </header>

        <div className="mt-12 flex flex-1 items-center">
          <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] lg:items-stretch lg:gap-10">
            <div className="hidden lg:sticky lg:top-8 lg:flex lg:h-[calc(100vh-4rem)] lg:flex-col lg:justify-center">
              <div className="relative z-10 space-y-8">
                <div
                  className="absolute -left-20 top-1/2 -z-10 h-64 w-64 -translate-y-1/2 rounded-full bg-blue-400/20 blur-3xl"
                  aria-hidden
                />
                <div
                  className="absolute -right-20 top-1/2 -z-10 h-64 w-64 -translate-y-1/2 rounded-full bg-sky-400/20 blur-3xl"
                  aria-hidden
                />

                <h2 className="text-5xl font-extrabold leading-tight tracking-tight text-slate-900 lg:text-6xl">
                  Learn anywhere,
                  <br />
                  <span className="bg-linear-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                    fast & fun
                  </span>
                </h2>
                <p className="max-w-md text-lg font-medium leading-relaxed text-slate-500 lg:text-xl">
                  Lessons that feel human, hopeful, and ready to go with you.
                </p>
              </div>
            </div>

            <div className="flex h-full lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
              <div className="relative w-full rounded-[2.5rem] bg-white/85 p-8 shadow-[0_40px_90px_rgba(34,112,192,0.15)] ring-1 ring-white/50 backdrop-blur min-h-[640px] sm:p-10 lg:h-full lg:p-12 xl:min-h-0">
                <div
                  className="absolute inset-x-10 top-0 h-20 rounded-t-[2.5rem] bg-linear-to-b from-sky-50/70 to-transparent"
                  aria-hidden
                />
                <div className="relative flex h-full min-h-0 flex-col lg:overflow-hidden">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900 sm:text-[2.1rem]">
                      {STEP_TITLES[currentStep]}
                    </h1>
                    {STEP_DESCRIPTIONS[currentStep] && (
                      <p className="text-base text-slate-600 sm:text-lg">
                        {STEP_DESCRIPTIONS[currentStep]}
                      </p>
                    )}
                  </div>

                  <div className="mt-8 space-y-3">
                    <span className="text-sm font-semibold text-sky-600">
                      Step {stepIndex + 1} of {steps.length}
                    </span>
                    <div className="h-2 rounded-full bg-sky-100">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-sky-600 to-sky-500 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div
                    className={`mt-8 flex-1 min-h-0 lg:pr-1 ${
                      currentStep === "subjects" ? "" : "lg:overflow-y-auto"
                    }`}
                  >
                    <StepContent
                      {...{
                        currentStep,
                        autoDetected,
                        country,
                        setCountry,
                        allCountries,
                        language,
                        setLanguage,
                        countryOptions,
                        languageOptions,
                        educationStatus,
                        setEducationStatus,
                        knowsGradeLevel,
                        setKnowsGradeLevel,
                        schoolGrade,
                        setSchoolGrade,
                        ageRange,
                        setAgeRange,
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
                      }}
                    />
                  </div>

                  <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
                    {stepIndex > 0 ? (
                      <button
                        type="button"
                        onClick={handleBack}
                        disabled={isCompleting}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-300"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                      </button>
                    ) : (
                      <span className="invisible inline-flex items-center gap-2 rounded-2xl px-6 py-3" />
                    )}

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!canProceed || isCompleting}
                      className={`inline-flex items-center gap-2 rounded-2xl px-6 py-4 text-lg font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                        canProceed && !isCompleting
                          ? "bg-linear-to-r from-sky-600 to-sky-500 text-white hover:from-sky-600 hover:to-sky-400"
                          : "cursor-not-allowed bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isCompleting
                        ? "Setting up..."
                        : stepIndex === steps.length - 1
                        ? "Start Learning"
                        : "Next"}
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
