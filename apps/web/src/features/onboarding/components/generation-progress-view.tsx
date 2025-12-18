"use client";

import { CheckCircle, Zap } from "lucide-react";

import { GenerationTimelineStep } from "../types";

import { GENERATION_STEP_SEQUENCE, GENERATION_STEP_META } from "../constants";

export default function GenerationProgressView({
  subjects,
  step,
  error,
  onRetry,
  onBack,
  isRetrying,
}: {
  subjects: string[];
  step: GenerationTimelineStep;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
  isRetrying: boolean;
}) {
  const stepIndex = GENERATION_STEP_SEQUENCE.indexOf(step);
  const progressPercent = Math.round(
    ((stepIndex + 1) / GENERATION_STEP_SEQUENCE.length) * 100
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-10 shadow-2xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900">
            Building your learning plan
          </h2>
          <p className="mt-2 text-base text-slate-600">
            Hang tight—your subjects are being tailored into a curriculum just
            for you.
          </p>
        </div>

        {subjects.length > 0 && (
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {subjects.map((subject) => (
              <span
                key={subject}
                className="rounded-full bg-sky-100 px-4 py-1.5 text-sm font-medium text-sky-700"
              >
                {subject}
              </span>
            ))}
          </div>
        )}

        <div className="mb-8">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full w-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-center text-sm font-semibold text-slate-500">
            {progressPercent}% complete
          </p>
        </div>

        <div className="space-y-4">
          {GENERATION_STEP_SEQUENCE.map((timelineStep, index) => {
            const isActive = timelineStep === step;
            const isComplete = index < stepIndex;
            return (
              <div
                key={timelineStep}
                className={`flex items-start gap-3 rounded-xl border-2 p-4 transition-all ${
                  isComplete
                    ? "border-emerald-200 bg-emerald-50"
                    : isActive
                    ? "border-sky-400 bg-sky-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="mt-1">
                  {isComplete ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : isActive ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                  )}
                </div>
                <div>
                  <p
                    className={`font-semibold ${
                      isActive
                        ? "text-sky-900"
                        : isComplete
                        ? "text-emerald-900"
                        : "text-slate-800"
                    }`}
                  >
                    {GENERATION_STEP_META[timelineStep].label}
                  </p>
                  <p
                    className={`mt-1 text-sm ${
                      isActive
                        ? "text-sky-700"
                        : isComplete
                        ? "text-emerald-700"
                        : "text-slate-500"
                    }`}
                  >
                    {GENERATION_STEP_META[timelineStep].description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          <Zap className="mr-2 inline h-4 w-4" />
          This usually takes about 4–5 seconds. We are shaping every topic
          around your selections.
        </div>

        {error && (
          <div className="mt-10 space-y-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-semibold">
              We could not finish generating your plan.
            </p>
            <p className="text-sm text-red-600">{error}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onRetry}
                disabled={isRetrying}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={onBack}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-red-200 bg-white px-6 py-3 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:text-red-700"
              >
                Adjust selections
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
